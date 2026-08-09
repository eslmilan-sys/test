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

import { CORRIDORS, getCorridor, type Corridor } from "./corridors";
import { computePriceCap, type VehicleCategory } from "./pricing";

export type Trip = {
  id: string;
  corridorSlug: string;
  /** ISO, heure locale du Panama. */
  departureAt: string;
  arrivalAt: string;
  seatsOffered: number;
  seatsTaken: number;
  priceCents: number;
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

function buildTrip(corridor: Corridor, date: string, index: number): Trip {
  const seed = hash(`${corridor.slug}|${date}|${index}`);
  const driver = DRIVERS[seed % DRIVERS.length];
  const vehicle = VEHICLES[(seed >> 3) % VEHICLES.length];
  const seatsOffered = 2 + ((seed >> 5) % 3);
  const seatsTaken = (seed >> 8) % (seatsOffered + 1);

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
    driver: { ...driver, initial: driver.firstName.charAt(0) },
    vehicle,
    stops: corridor.pickupPoints.slice(0, 2 + ((seed >> 19) % 3)),
    womenOnly: (seed >> 23) % 7 === 0,
    instantBooking: (seed >> 25) % 3 !== 0,
  };
}

/** Trajets d'un corridor pour une date, triés par heure de départ. */
export function getTripsFor(corridorSlug: string, date: string): Trip[] {
  const corridor = getCorridor(corridorSlug);
  if (!corridor) return [];

  // Entre deux et cinq trajets, selon le corridor et le jour : un corridor
  // prioritaire un vendredi bouge plus qu'un mardi vers David.
  const seed = hash(`${corridorSlug}|${date}`);
  const weekday = new Date(`${date}T12:00:00`).getDay();
  const busy = weekday === 5 || weekday === 0;
  const count = (corridor.isPriority ? 5 : 3) + (busy ? 2 : 0) + (seed % 2);

  // Un départ déjà passé n'est pas un résultat : il fait croire que la
  // plateforme est vide alors qu'elle a des trajets plus tard dans la journée.
  const now = Date.now();

  return Array.from({ length: count }, (_, i) => buildTrip(corridor, date, i))
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

/** Identifiants pré-générés, pour que l'export statique ait des pages. */
export function demoTripIds(days = 3): string[] {
  const ids: string[] = [];
  const today = new Date();
  for (let d = 0; d < days; d++) {
    const date = new Date(today);
    date.setDate(today.getDate() + d);
    const iso = date.toISOString().slice(0, 10);
    for (const corridor of CORRIDORS) {
      ids.push(...getTripsFor(corridor.slug, iso).map((t) => t.id));
    }
  }
  return ids;
}

export function seatsLeft(trip: Trip): number {
  return trip.seatsOffered - trip.seatsTaken;
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
