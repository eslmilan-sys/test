/**
 * RÉFÉRENTIEL DES CORRIDORS
 *
 * Un corridor = une paire de villes = une page SEO = un jeu de paramètres de
 * prix. C'est l'unité de pilotage du produit.
 *
 * Ces données reproduisent l'amorçage de schema.sql (§12). Elles servent de
 * repli quand Supabase n'est pas encore configuré : le site se construit et
 * se déploie sans base, puis bascule sur les données réelles dès que les
 * variables d'environnement existent. Aucune page ne dépend d'un service
 * tiers pour rendre — c'est la règle du §10 du brief.
 */

import { computePriceCap, type VehicleCategory } from "./pricing";

export type City = {
  slug: string;
  name: string;
  /** Nom court pour les fils d'Ariane et les cartes. */
  shortName: string;
  province: string;
  /** Coordonnées réelles, reprises de l'amorçage de schema.sql. Elles
   *  positionnent les villes sur la carte schématique. */
  lat: number;
  lng: number;
};

export type Corridor = {
  slug: string;
  origin: City;
  destination: City;
  distanceKm: number;
  tollCents: number;
  typicalDurationMin: number;
  /** Référence bus — comparaison éditoriale, jamais une base de tarif. */
  busPriceCents: number | null;
  isPriority: boolean;
  /** Points de prise en charge habituels. Jamais un terminal (§10). */
  pickupPoints: string[];
  /** Deux ou trois phrases propres au corridor : c'est ce qui distingue la
   *  page d'un gabarit dupliqué aux yeux de Google comme des lecteurs. */
  intro: string;
};

export const CITIES = {
  panama: {
    slug: "panama-city",
    name: "Ciudad de Panamá",
    shortName: "Panamá",
    province: "Panamá",
    lat: 8.9824,
    lng: -79.5199,
  },
  chitre: {
    slug: "chitre",
    name: "Chitré",
    shortName: "Chitré",
    province: "Herrera",
    lat: 7.9614,
    lng: -80.4297,
  },
  lasTablas: {
    slug: "las-tablas",
    name: "Las Tablas",
    shortName: "Las Tablas",
    province: "Los Santos",
    lat: 7.7667,
    lng: -80.2833,
  },
  david: {
    slug: "david",
    name: "David",
    shortName: "David",
    province: "Chiriquí",
    lat: 8.4333,
    lng: -82.4333,
  },
  santiago: {
    slug: "santiago",
    name: "Santiago",
    shortName: "Santiago",
    province: "Veraguas",
    lat: 8.1,
    lng: -80.9833,
  },
  penonome: {
    slug: "penonome",
    name: "Penonomé",
    shortName: "Penonomé",
    province: "Coclé",
    lat: 8.5194,
    lng: -80.3572,
  },
  coronado: {
    slug: "coronado",
    name: "Coronado",
    shortName: "Coronado",
    province: "Panamá Oeste",
    lat: 8.5333,
    lng: -79.95,
  },
} as const satisfies Record<string, City>;

const PANAMA_PICKUPS = [
  "Costa del Este — Town Center",
  "Albrook — salida hacia el interior",
  "Vía Centenario — entrada a la Panamericana",
];

export const CORRIDORS: Corridor[] = [
  {
    slug: "panama-chitre",
    origin: CITIES.panama,
    destination: CITIES.chitre,
    distanceKm: 250,
    tollCents: 300,
    typicalDurationMin: 220,
    busPriceCents: 900,
    isPriority: true,
    pickupPoints: [...PANAMA_PICKUPS, "Divisa — cruce hacia Azuero"],
    intro:
      "La ruta de Azuero por excelencia. Los viernes en la tarde y los domingos al mediodía es cuando más gente se mueve, sobre todo en temporada de festivales. La mayoría de los conductores sale por la Panamericana y toma el cruce de Divisa.",
  },
  {
    slug: "panama-las-tablas",
    origin: CITIES.panama,
    destination: CITIES.lasTablas,
    distanceKm: 285,
    tollCents: 300,
    typicalDurationMin: 245,
    busPriceCents: 1050,
    isPriority: true,
    pickupPoints: [...PANAMA_PICKUPS, "Chitré — si te queda de paso"],
    intro:
      "Media hora más allá de Chitré, por la misma carretera. Quien va a Las Tablas casi siempre puede dejarte antes en Chitré o en Guararé, así que vale la pena mirar los dos corredores cuando buscas puesto.",
  },
  {
    slug: "panama-coronado",
    origin: CITIES.panama,
    destination: CITIES.coronado,
    distanceKm: 85,
    tollCents: 200,
    typicalDurationMin: 75,
    busPriceCents: 450,
    isPriority: true,
    pickupPoints: [
      "Costa del Este — Town Center",
      "Vía Centenario — entrada a la Panamericana",
      "La Chorrera — salida oeste",
    ],
    intro:
      "El corredor más corto y el más frecuente: mucha gente baja los viernes en la tarde y sube los domingos. Como el trayecto es de poco más de una hora, el aporte por puesto es pequeño y los conductores suelen tener horarios flexibles.",
  },
  {
    slug: "panama-santiago",
    origin: CITIES.panama,
    destination: CITIES.santiago,
    distanceKm: 250,
    tollCents: 300,
    typicalDurationMin: 210,
    busPriceCents: 950,
    isPriority: false,
    pickupPoints: [...PANAMA_PICKUPS, "Aguadulce — parada en carretera"],
    intro:
      "Santiago es el punto medio del país: mucha gente que va a Chiriquí para ahí, y muchos veragüenses suben a Panamá entre semana por trámites. Es de los corredores donde más se consigue puesto en días laborables.",
  },
  {
    slug: "panama-penonome",
    origin: CITIES.panama,
    destination: CITIES.penonome,
    distanceKm: 145,
    tollCents: 300,
    typicalDurationMin: 120,
    busPriceCents: 600,
    isPriority: false,
    pickupPoints: [...PANAMA_PICKUPS, "Penonomé — entrada del pueblo"],
    intro:
      "Dos horas de carretera y buena parte de los conductores que van a Chiriquí o a Veraguas pasan por aquí. Si no encuentras un viaje directo a Penonomé, mira también los que van más lejos: casi todos pueden dejarte en la entrada.",
  },
  {
    slug: "panama-david",
    origin: CITIES.panama,
    destination: CITIES.david,
    distanceKm: 440,
    tollCents: 300,
    typicalDurationMin: 390,
    busPriceCents: 2100,
    isPriority: false,
    pickupPoints: [...PANAMA_PICKUPS, "Santiago — parada de descanso"],
    intro:
      "Seis horas y media de carretera, casi siempre con una parada en Santiago. Es el trayecto donde más se nota la diferencia con el bus nocturno: sales cuando el conductor sale, no cuando salga la flota.",
  },
];

export function getCorridor(slug: string): Corridor | undefined {
  return CORRIDORS.find((c) => c.slug === slug);
}

/** Le corridor inverse, quand il existe. Utile pour le maillage interne. */
export function getReverseCorridor(corridor: Corridor): Corridor | undefined {
  return CORRIDORS.find(
    (c) =>
      c.origin.slug === corridor.destination.slug &&
      c.destination.slug === corridor.origin.slug,
  );
}

/** Corridors qui partagent une ville — le maillage interne des pages SEO. */
export function getRelatedCorridors(corridor: Corridor, limit = 3): Corridor[] {
  return CORRIDORS.filter((c) => c.slug !== corridor.slug)
    .sort((a, b) => Number(b.isPriority) - Number(a.isPriority))
    .slice(0, limit);
}

/**
 * Plafond de référence d'un corridor : véhicule standard, 3 sièges.
 * C'est le chiffre affiché sur les cartes de route et les pages corridor.
 */
export function corridorCap(
  corridor: Corridor,
  category: VehicleCategory = "standard",
  seats = 3,
) {
  return computePriceCap(
    corridor.distanceKm,
    corridor.tollCents,
    category,
    seats,
  );
}

export const ALL_CITIES: City[] = Object.values(CITIES);
