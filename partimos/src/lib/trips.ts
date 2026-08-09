/**
 * TRAJETS
 *
 * Le site public doit pouvoir montrer une liste de résultats avant que
 * Supabase existe — sinon la boucle « chercher → choisir → réserver » ne se
 * démontre pas, et c'est justement la boucle principale du produit.
 *
 * On génère donc un jeu de trajets DÉTERMINISTE à partir des corridors. Rien
 * n'est aléatoire : le même corridor et la même date rendent toujours les
 * mêmes trajets, sur le serveur comme dans le navigateur. Un `Math.random()`
 * ici produirait un décalage d'hydratation à chaque chargement.
 *
 * Ces trajets sont marqués comme démonstration dans l'interface tant que
 * `NEXT_PUBLIC_SUPABASE_URL` n'est pas renseignée. Afficher de faux conducteurs
 * sans le dire serait un mensonge, pas une maquette.
 */

import {
  CORRIDORS,
  corridorsServing,
  getCorridor,
  type Corridor,
} from "./corridors.ts";
import { computePriceCap, type VehicleCategory } from "./pricing.ts";
import {
  findSegment,
  seatsFreeOnSegment,
  segmentCap,
  type SeatHold,
  type Segment,
  type Waypoint,
} from "./segments.ts";

export type Trip = {
  id: string;
  corridorSlug: string;
  /** ISO, heure locale du Panama. */
  departureAt: string;
  arrivalAt: string;
  seatsOffered: number;
  /** Sièges pris sur le tronçon le plus chargé — la borne du trajet entier. */
  seatsTaken: number;
  priceCents: number;
  /** Écart entre le plafond et ce que le conducteur demande. Reporté tel quel
   *  sur les segments, pour qu'un trajet à prix réduit le reste par morceaux. */
  discountCents: number;
  /** Villes où ce conducteur accepte de prendre ou de laisser quelqu'un.
   *  Sous-ensemble ordonné des `waypoints` du corridor, extrémités comprises. */
  servedStops: Waypoint[];
  /** Réservations déjà posées, par intervalle d'arrêts. Une place vendue
   *  jusqu'à Santiago se libère après Santiago : c'est un inventaire, pas un
   *  compteur. */
  holds: SeatHold[];
  driver: {
    firstName: string;
    lastInitial: string;
    rating: number;
    ridesCount: number;
    isVerified: boolean;
    isSuperDriver: boolean;
    /** Initiale affichée dans l'avatar — aucune photo n'est inventée. */
    initial: string;
  };
  vehicle: {
    make: string;
    model: string;
    color: string;
    category: VehicleCategory;
  };
  stops: string[];
  womenOnly: boolean;
  instantBooking: boolean;
};

const DRIVERS = [
  {
    firstName: "Ana",
    lastInitial: "M",
    rating: 4.9,
    ridesCount: 62,
    isVerified: true,
    isSuperDriver: true,
  },
  {
    firstName: "Javier",
    lastInitial: "R",
    rating: 4.8,
    ridesCount: 38,
    isVerified: true,
    isSuperDriver: false,
  },
  {
    firstName: "Yaritza",
    lastInitial: "C",
    rating: 5.0,
    ridesCount: 91,
    isVerified: true,
    isSuperDriver: true,
  },
  {
    firstName: "Carlos",
    lastInitial: "B",
    rating: 4.6,
    ridesCount: 14,
    isVerified: true,
    isSuperDriver: false,
  },
  {
    firstName: "Rita",
    lastInitial: "G",
    rating: 4.9,
    ridesCount: 47,
    isVerified: true,
    isSuperDriver: false,
  },
  {
    firstName: "Moisés",
    lastInitial: "D",
    rating: 4.7,
    ridesCount: 23,
    isVerified: false,
    isSuperDriver: false,
  },
  {
    firstName: "Lourdes",
    lastInitial: "P",
    rating: 5.0,
    ridesCount: 8,
    isVerified: true,
    isSuperDriver: false,
  },
];

const VEHICLES: Trip["vehicle"][] = [
  { make: "Toyota", model: "Corolla", color: "gris", category: "standard" },
  { make: "Hyundai", model: "Accent", color: "blanco", category: "economy" },
  { make: "Kia", model: "Sportage", color: "negro", category: "suv" },
  { make: "Nissan", model: "Sentra", color: "azul", category: "standard" },
  { make: "Toyota", model: "Hilux", color: "plata", category: "suv" },
];

/** Heures de départ typiques : tôt le matin, midi, fin d'après-midi, nuit. */
const DEPARTURE_HOURS = [5, 6, 8, 11, 14, 16, 17, 19, 21];

/** Empreinte stable d'une chaîne. Remplace un générateur aléatoire. */
function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/**
 * Les arrêts que CE conducteur déclare, parmi ceux du corridor.
 *
 * Tout le monde ne s'arrête pas partout : celui qui va à David d'une traite
 * ne déclare rien, celui qui a le temps déclare Penonomé et Santiago. Le tirage
 * est déterministe, un bit par ville intermédiaire — sinon la même page rendue
 * deux fois donnerait deux itinéraires différents.
 */
function pickServedStops(corridor: Corridor, seed: number): Waypoint[] {
  const inner = corridor.waypoints.slice(1, -1);
  const kept = inner.filter((_, i) => ((seed >> i) & 1) === 1);
  return [
    corridor.waypoints[0],
    ...kept,
    corridor.waypoints[corridor.waypoints.length - 1],
  ];
}

/**
 * Les réservations déjà posées, en intervalles d'arrêts.
 *
 * Chacune occupe un seul siège sur une portion du trajet. Comme il y en a au
 * plus `seatsOffered`, aucun tronçon ne peut être survendu, quel que soit le
 * tirage — l'invariant tient par construction, pas par vérification après coup.
 */
function buildHolds(
  stopCount: number,
  seatsOffered: number,
  seed: number,
): SeatHold[] {
  const legCount = stopCount - 1;
  const count = (seed >> 3) % (seatsOffered + 1);

  return Array.from({ length: count }, (_, k) => {
    const h = hash(`hold|${seed}|${k}`);
    const fromIndex = h % legCount;
    const toIndex = fromIndex + 1 + ((h >> 7) % (legCount - fromIndex));
    return { fromIndex, toIndex, seats: 1 };
  });
}

function buildTrip(corridor: Corridor, date: string, index: number): Trip {
  const seed = hash(`${corridor.slug}|${date}|${index}`);
  const driver = DRIVERS[seed % DRIVERS.length];
  const vehicle = VEHICLES[(seed >> 3) % VEHICLES.length];
  const seatsOffered = 2 + ((seed >> 5) % 3);

  const servedStops = pickServedStops(
    corridor,
    hash(`paradas|${corridor.slug}|${date}|${index}`),
  );
  const holds = buildHolds(
    servedStops.length,
    seatsOffered,
    hash(`reservas|${corridor.slug}|${date}|${index}`),
  );
  const seatsTaken =
    seatsOffered -
    seatsFreeOnSegment(seatsOffered, holds, {
      fromIndex: 0,
      toIndex: servedStops.length - 1,
    });

  const hour = DEPARTURE_HOURS[(seed >> 11) % DEPARTURE_HOURS.length];
  const minute = [0, 15, 30, 45][(seed >> 14) % 4];
  const departure = new Date(
    `${date}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`,
  );
  const arrival = new Date(
    departure.getTime() + corridor.typicalDurationMin * 60_000,
  );

  // Le plafond dépend du nombre de sièges offerts. Le conducteur demande le
  // plafond ou un demi-dollar en dessous — jamais plus, la base le refuserait.
  const cap = computePriceCap(
    corridor.distanceKm,
    corridor.tollCents,
    vehicle.category,
    seatsOffered,
  ).maxPriceCents;
  const discount = (seed >> 17) % 3 === 0 ? 50 : 0;

  return {
    id: `${corridor.slug}-${date}-${index}`,
    corridorSlug: corridor.slug,
    departureAt: departure.toISOString(),
    arrivalAt: arrival.toISOString(),
    seatsOffered,
    seatsTaken,
    priceCents: Math.max(0, cap - discount),
    discountCents: discount,
    servedStops,
    holds,
    driver: { ...driver, initial: driver.firstName.charAt(0) },
    vehicle,
    stops: corridor.pickupPoints.slice(0, 2 + ((seed >> 19) % 3)),
    womenOnly: (seed >> 23) % 7 === 0,
    instantBooking: (seed >> 25) % 3 !== 0,
  };
}

/**
 * Tous les trajets d'un corridor pour une date, sans filtre.
 *
 * Séparé de `getTripsFor` parce que la recherche par segment a besoin des
 * trajets bruts : un trajet parti de Panamá il y a une heure n'est pas passé
 * pour qui monte à Santiago dans quatre heures, et un trajet complet jusqu'à
 * Penonomé peut être vide après.
 */
export function buildTripsFor(corridorSlug: string, date: string): Trip[] {
  const corridor = getCorridor(corridorSlug);
  if (!corridor) return [];

  // Entre deux et cinq trajets, selon le corridor et le jour : un corridor
  // prioritaire un vendredi bouge plus qu'un mardi vers David.
  const seed = hash(`${corridorSlug}|${date}`);
  const weekday = new Date(`${date}T12:00:00`).getDay();
  const busy = weekday === 5 || weekday === 0;
  const count = (corridor.isPriority ? 5 : 3) + (busy ? 2 : 0) + (seed % 2);

  return Array.from({ length: count }, (_, i) => buildTrip(corridor, date, i));
}

/** Trajets d'un corridor pour une date, triés par heure de départ. */
export function getTripsFor(corridorSlug: string, date: string): Trip[] {
  // Un départ déjà passé n'est pas un résultat : il fait croire que la
  // plateforme est vide alors qu'elle a des trajets plus tard dans la journée.
  const now = Date.now();

  return buildTripsFor(corridorSlug, date)
    .filter((trip) => trip.seatsOffered - trip.seatsTaken > 0)
    .filter((trip) => new Date(trip.departureAt).getTime() > now)
    .sort((a, b) => a.departureAt.localeCompare(b.departureAt));
}

export function getTrip(id: string): Trip | undefined {
  const match = /^(.+)-(\d{4}-\d{2}-\d{2})-(\d+)$/.exec(id);
  if (!match) return undefined;
  const [, corridorSlug, date, index] = match;
  const corridor = getCorridor(corridorSlug);
  if (!corridor) return undefined;
  return buildTrip(corridor, date, Number(index));
}

/**
 * Combien de jours la recherche propose. Les sélecteurs de date et la
 * génération des pages lisent la MÊME constante : la faire diverger produit
 * des résultats qui pointent vers des pages inexistantes, et c'est exactement
 * ce qui arrivait avant les arrêts intermédiaires.
 */
export const SEARCH_HORIZON_DAYS = 10;

/**
 * Identifiants pré-générés, pour que l'export statique ait des pages.
 *
 * Aucun filtre ici, volontairement. Un trajet complet de bout en bout peut
 * rester réservable sur un tronçon, et un trajet déjà parti de Panamá peut
 * encore prendre quelqu'un à Santiago : dès qu'un trajet EXISTE, la recherche
 * peut le montrer, donc sa page doit exister aussi. Deux jours de marge au-delà
 * de l'horizon proposé absorbent le décalage entre la date de compilation et
 * celle de la visite.
 */
export function demoTripIds(days = SEARCH_HORIZON_DAYS + 2): string[] {
  const ids: string[] = [];
  const today = new Date();
  for (let d = 0; d < days; d++) {
    const date = new Date(today);
    date.setDate(today.getDate() + d);
    const iso = date.toISOString().slice(0, 10);
    for (const corridor of CORRIDORS) {
      ids.push(...buildTripsFor(corridor.slug, iso).map((t) => t.id));
    }
  }
  return ids;
}

export function seatsLeft(trip: Trip): number {
  return trip.seatsOffered - trip.seatsTaken;
}

/* ────────────────────────────────────────────────────────────────────────────
 * RECHERCHE PAR SEGMENT
 *
 * Un trajet publié Panamá → David qui déclare Penonomé et Santiago répond à
 * six recherches, pas une. C'est le levier le plus fort dont dispose une place
 * de marché qui démarre : l'offre ne change pas, la couverture est multipliée.
 *
 * Ce qu'un résultat doit porter en plus du trajet : où on monte, où on
 * descend, à quelle heure, combien de places restent SUR CE SEGMENT, et
 * combien on donne — le plafond des kilomètres réellement parcourus, jamais
 * celui du trajet entier.
 * ──────────────────────────────────────────────────────────────────────────── */

export type TripMatch = {
  trip: Trip;
  segment: Segment;
  /** Faux dès que le passager monte après le départ ou descend avant l'arrivée. */
  isPartial: boolean;
  priceCents: number;
  seatsFree: number;
  /** Heure au point de montée, pas au départ du conducteur. */
  boardingAt: string;
  /** Heure au point de descente, pas à l'arrivée du conducteur. */
  droppingAt: string;
};

/**
 * Heure de passage à un kilomètre donné du corridor.
 *
 * Interpolation linéaire sur la durée annoncée. Approximation assumée : la
 * vitesse n'est pas constante sur la Panamericana. L'affichage doit donc rester
 * une estimation, et le conducteur reste seul maître de son horaire (R4).
 */
function timeAtKm(trip: Trip, corridor: Corridor, km: number): string {
  const fraction = corridor.distanceKm > 0 ? km / corridor.distanceKm : 0;
  const minutes = Math.round(fraction * corridor.typicalDurationMin);
  return new Date(
    new Date(trip.departureAt).getTime() + minutes * 60_000,
  ).toISOString();
}

/** Le résultat correspondant à un trajet pris sur un segment donné. */
export function matchFor(trip: Trip, segment: Segment): TripMatch | null {
  const corridor = getCorridor(trip.corridorSlug);
  if (!corridor) return null;

  const cap = segmentCap(segment, trip.vehicle.category, trip.seatsOffered);

  return {
    trip,
    segment,
    isPartial:
      segment.fromIndex > 0 || segment.toIndex < trip.servedStops.length - 1,
    // Le rabais que le conducteur consent sur le trajet entier le suit sur le
    // segment. Le plafond n'est jamais dépassé : on ne fait que soustraire.
    priceCents: Math.max(0, cap.maxPriceCents - trip.discountCents),
    seatsFree: seatsFreeOnSegment(trip.seatsOffered, trip.holds, segment),
    boardingAt: timeAtKm(trip, corridor, segment.from.km),
    droppingAt: timeAtKm(trip, corridor, segment.to.km),
  };
}

/** Le trajet vu de bout en bout — ce qu'affiche la page du trajet par défaut. */
export function fullMatch(trip: Trip): TripMatch | null {
  const segment = findSegment(
    trip.servedStops,
    trip.servedStops[0].citySlug,
    trip.servedStops[trip.servedStops.length - 1].citySlug,
  );
  return segment ? matchFor(trip, segment) : null;
}

/**
 * Tous les trajets d'une date qui peuvent emmener quelqu'un d'une ville à
 * l'autre, directement ou en cours de route.
 */
export function searchTrips(
  fromCitySlug: string,
  toCitySlug: string,
  date: string,
  seats = 1,
): TripMatch[] {
  const now = Date.now();
  const matches: TripMatch[] = [];

  for (const corridor of corridorsServing(fromCitySlug, toCitySlug)) {
    for (const trip of buildTripsFor(corridor.slug, date)) {
      const segment = findSegment(trip.servedStops, fromCitySlug, toCitySlug);
      if (!segment) continue;

      const match = matchFor(trip, segment);
      if (!match) continue;
      if (match.seatsFree < seats) continue;
      // C'est l'heure de MONTÉE qui décide, pas celle du départ.
      if (new Date(match.boardingAt).getTime() <= now) continue;

      matches.push(match);
    }
  }

  return matches.sort((a, b) => a.boardingAt.localeCompare(b.boardingAt));
}

/** Combien de recherches distinctes une liste d'arrêts rend possibles. */
export function servedPairCount(stopCount: number): number {
  return (stopCount * (stopCount - 1)) / 2;
}

export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat("es-PA", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

export function formatDayLabel(date: string): string {
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
  if (date === today) return "Hoy";
  if (date === tomorrow) return "Mañana";
  const label = new Intl.DateTimeFormat("es-PA", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(`${date}T12:00:00`));
  return label.charAt(0).toUpperCase() + label.slice(1);
}
