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

import { computePriceCap, type VehicleCategory } from "./pricing.ts";
import type { Waypoint } from "./segments.ts";

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
  isPriority: boolean;
  /** Sens du trajet. La demande existe dans les deux sens — on descend le
   *  vendredi, on remonte le dimanche — donc chaque corridor a son retour,
   *  page à part entière avec son propre contenu. `isReturn` sert aux vues
   *  qui listent : montrer douze lignes où six suffisent serait du bruit. */
  isReturn?: boolean;
  /** Points de prise en charge habituels. Jamais un terminal (§10). */
  pickupPoints: string[];
  /** Deux ou trois phrases propres au corridor : c'est ce qui distingue la
   *  page d'un gabarit dupliqué aux yeux de Google comme des lecteurs. */
  intro: string;
  /** Villes traversées, origine et destination comprises, dans l'ordre du
   *  trajet. C'est le référentiel des arrêts intermédiaires : un conducteur
   *  ne peut déclarer que des points qui sont VRAIMENT sur sa route. */
  waypoints: Waypoint[];
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
  chorrera: {
    slug: "la-chorrera",
    name: "La Chorrera",
    shortName: "La Chorrera",
    province: "Panamá Oeste",
    lat: 8.8803,
    lng: -79.7833,
  },
} as const satisfies Record<string, City>;

/**
 * LA ROUTE, EN KILOMÈTRES CUMULÉS DEPUIS CIUDAD DE PANAMÁ
 *
 * Toutes ces villes sont sur la Panamericana, dans cet ordre. Les distances
 * sont celles des corridors du §12 : Coronado 85, Penonomé 145, Santiago 250,
 * David 440 — et l'embranchement d'Azuero à Divisa, qui mène à Chitré (250)
 * puis Las Tablas (285). Les corridors ne sont donc pas six routes séparées :
 * c'est un tronc commun avec une fourche, et c'est précisément ce qui permet
 * de découper les trajets.
 *
 * Les péages sont eux aussi cumulés. Ils se paient tous dans les 85 premiers
 * kilomètres (l'autopista vers La Chorrera) : au-delà de Coronado, un segment
 * n'ajoute plus de péage, et le calcul du plafond doit le refléter — sinon on
 * facturerait à un passager Penonomé → Santiago un péage qu'il ne franchit
 * jamais.
 */
const PANAMA_PICKUPS = [
  "Costa del Este — Town Center",
  "Albrook — salida hacia el interior",
  "Vía Centenario — entrada a la Panamericana",
];

const ROAD = {
  "panama-city": {
    km: 0,
    tollCents: 0,
    pickupPoints: PANAMA_PICKUPS,
  },
  "la-chorrera": {
    km: 37,
    tollCents: 200,
    pickupPoints: [
      "La Chorrera — salida oeste",
      "La Chorrera — Parque Libertador",
    ],
  },
  coronado: {
    km: 85,
    tollCents: 200,
    pickupPoints: [
      "Coronado — entrada de la urbanización",
      "El Rey de Coronado — estacionamiento",
    ],
  },
  penonome: {
    km: 145,
    tollCents: 300,
    pickupPoints: [
      "Penonomé — entrada del pueblo",
      "Penonomé — El Machetazo, sobre la vía",
    ],
  },
  santiago: {
    km: 250,
    tollCents: 300,
    pickupPoints: [
      "Santiago — parada de descanso en la Panamericana",
      "Santiago — entrada por la vía principal",
    ],
  },
  david: {
    km: 440,
    tollCents: 300,
    pickupPoints: [
      "David — entrada por la Panamericana",
      "David — Parque Cervantes",
    ],
  },
  chitre: {
    km: 250,
    tollCents: 300,
    pickupPoints: [
      "Chitré — entrada por la vía de Divisa",
      "Chitré — Parque Unión",
    ],
  },
  "las-tablas": {
    km: 285,
    tollCents: 300,
    pickupPoints: ["Las Tablas — entrada del pueblo"],
  },
} as const satisfies Record<
  string,
  { km: number; tollCents: number; pickupPoints: readonly string[] }
>;

/** Construit la liste ordonnée des points de passage d'un corridor. */
function road(...slugs: (keyof typeof ROAD)[]): Waypoint[] {
  return slugs.map((slug) => {
    const city = Object.values(CITIES).find((c) => c.slug === slug)!;
    const { km, tollCents, pickupPoints } = ROAD[slug];
    return {
      citySlug: slug,
      name: city.shortName,
      km,
      tollCents,
      pickupPoints: [...pickupPoints],
    };
  });
}

export const CORRIDORS: Corridor[] = [
  {
    slug: "panama-chitre",
    origin: CITIES.panama,
    destination: CITIES.chitre,
    distanceKm: 250,
    tollCents: 300,
    typicalDurationMin: 220,
    isPriority: true,
    pickupPoints: [...PANAMA_PICKUPS, "Divisa — cruce hacia Azuero"],
    intro:
      "La ruta de Azuero por excelencia. Los viernes en la tarde y los domingos al mediodía es cuando más gente se mueve, sobre todo en temporada de festivales. La mayoría de los conductores sale por la Panamericana y toma el cruce de Divisa.",
    waypoints: road("panama-city", "la-chorrera", "coronado", "penonome", "chitre"),
  },
  {
    slug: "panama-las-tablas",
    origin: CITIES.panama,
    destination: CITIES.lasTablas,
    distanceKm: 285,
    tollCents: 300,
    typicalDurationMin: 245,
    isPriority: true,
    pickupPoints: [...PANAMA_PICKUPS, "Chitré — si te queda de paso"],
    intro:
      "Media hora más allá de Chitré, por la misma carretera. Quien va a Las Tablas casi siempre puede dejarte antes en Chitré o en Guararé, así que vale la pena mirar los dos corredores cuando buscas puesto.",
    waypoints: road(
      "panama-city",
      "coronado",
      "penonome",
      "chitre",
      "las-tablas",
    ),
  },
  {
    slug: "panama-coronado",
    origin: CITIES.panama,
    destination: CITIES.coronado,
    distanceKm: 85,
    tollCents: 200,
    typicalDurationMin: 75,
    isPriority: true,
    pickupPoints: [
      "Costa del Este — Town Center",
      "Vía Centenario — entrada a la Panamericana",
    ],
    intro:
      "El corredor más corto y el más frecuente: mucha gente baja los viernes en la tarde y sube los domingos. Como el trayecto es de poco más de una hora, el aporte por puesto es pequeño y los conductores suelen tener horarios flexibles.",
    waypoints: road("panama-city", "la-chorrera", "coronado"),
  },
  {
    slug: "panama-santiago",
    origin: CITIES.panama,
    destination: CITIES.santiago,
    distanceKm: 250,
    tollCents: 300,
    typicalDurationMin: 210,
    isPriority: false,
    pickupPoints: [...PANAMA_PICKUPS, "Aguadulce — parada en carretera"],
    intro:
      "Santiago es el punto medio del país: mucha gente que va a Chiriquí para ahí, y muchos veragüenses suben a Panamá entre semana por trámites. Es de los corredores donde más se consigue puesto en días laborables.",
    waypoints: road("panama-city", "la-chorrera", "coronado", "penonome", "santiago"),
  },
  {
    slug: "panama-penonome",
    origin: CITIES.panama,
    destination: CITIES.penonome,
    distanceKm: 145,
    tollCents: 300,
    typicalDurationMin: 120,
    isPriority: false,
    pickupPoints: [...PANAMA_PICKUPS, "Penonomé — entrada del pueblo"],
    intro:
      "Dos horas de carretera y buena parte de los conductores que van a Chiriquí o a Veraguas pasan por aquí. Si no encuentras un viaje directo a Penonomé, mira también los que van más lejos: casi todos pueden dejarte en la entrada.",
    waypoints: road("panama-city", "la-chorrera", "coronado", "penonome"),
  },
  {
    slug: "panama-david",
    origin: CITIES.panama,
    destination: CITIES.david,
    distanceKm: 440,
    tollCents: 300,
    typicalDurationMin: 390,
    isPriority: false,
    pickupPoints: [...PANAMA_PICKUPS, "Santiago — parada de descanso"],
    intro:
      "Seis horas y media de carretera, casi siempre con una parada en Santiago para estirar las piernas. Muchos salen de madrugada para llegar con el día por delante; mira también los viajes de la tarde, que llegan de noche.",
    waypoints: road("panama-city", "la-chorrera", "coronado", "penonome", "santiago", "david"),
  },
];

/**
 * LES RETOURS — un point A vers un point B, pas seulement depuis Panamá.
 *
 * Le client l'a dit simplement : « les gens rentrent à la ville aussi ». On
 * descend le vendredi, on remonte le dimanche — la moitié de la demande est
 * dans l'autre sens, et elle n'avait aucune page.
 *
 * Chaque retour est DÉRIVÉ de son aller : mêmes villes, même distance, mêmes
 * péages totaux, points de passage inversés avec les cumuls recalculés depuis
 * la nouvelle origine (km' = total − km, péages' = total − péages — les
 * péages se paient tous près de Panamá, donc en montant ils tombent sur la
 * FIN du trajet, et le calcul des segments doit le savoir).
 *
 * Seul l'éditorial est écrit à la main : une page générée qui répète l'aller
 * mot pour mot serait du contenu dupliqué, pour Google comme pour le lecteur.
 */
const RETURN_EDITORIAL: Record<string, { intro: string; pickup: string[] }> = {
  "panama-chitre": {
    intro:
      "El domingo de vuelta es el viaje más compartido de Azuero: casi todos los que bajaron el viernes suben entre el mediodía y la noche. Busca temprano — los puestos de la tarde del domingo son los primeros en llenarse.",
    pickup: [...ROAD.chitre.pickupPoints, "Divisa — cruce de la Panamericana"],
  },
  "panama-las-tablas": {
    intro:
      "De Las Tablas a la capital casi todos pasan por Guararé y Chitré, así que un carro que sale de Las Tablas suele poder recogerte en el camino. El domingo sube más gente que cualquier otro día de la semana.",
    pickup: [...ROAD["las-tablas"].pickupPoints, "Chitré — de paso por la vía"],
  },
  "panama-coronado": {
    intro:
      "La subida del domingo desde la playa. Poco más de una hora de camino, aporte pequeño, y muchos carros que regresan a la ciudad con puestos vacíos después del fin de semana.",
    pickup: [...ROAD.coronado.pickupPoints],
  },
  "panama-santiago": {
    intro:
      "Muchos veragüenses suben a la capital entre semana por trámites o trabajo. Es de las rutas donde más fácil se consigue puesto un lunes en la mañana, y casi todos los carros que vienen de Chiriquí pasan por aquí.",
    pickup: [...ROAD.santiago.pickupPoints, "Aguadulce — parada en carretera"],
  },
  "panama-penonome": {
    intro:
      "Quien sube de Veraguas o de Chiriquí pasa por Penonomé, así que además de los carros que salen del pueblo puedes montarte en uno que ya viene en camino. La entrada del pueblo es el punto de siempre.",
    pickup: [...ROAD.penonome.pickupPoints],
  },
  "panama-david": {
    intro:
      "La subida larga: seis horas y media, casi siempre con parada en Santiago. Muchos conductores salen de madrugada para llegar a la capital a mediodía — mira también los viajes que salen la tarde anterior.",
    pickup: [...ROAD.david.pickupPoints, "Santiago — parada de descanso"],
  },
};

const RETURN_CORRIDORS: Corridor[] = CORRIDORS.map((outbound) => {
  const editorial = RETURN_EDITORIAL[outbound.slug];
  return {
    ...outbound,
    slug: `${outbound.slug.replace(/^panama-/, "")}-panama`,
    origin: outbound.destination,
    destination: outbound.origin,
    isReturn: true,
    pickupPoints: editorial.pickup,
    intro: editorial.intro,
    waypoints: [...outbound.waypoints].reverse().map((w) => ({
      ...w,
      km: outbound.distanceKm - w.km,
      tollCents: outbound.tollCents - w.tollCents,
    })),
  };
});

CORRIDORS.push(...RETURN_CORRIDORS);

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

/** Corridors qui partagent une ville — le maillage interne des pages SEO.
 *  Même sens de marche que la page courante, et jamais son propre retour :
 *  celui-ci a déjà son lien dédié dans la FAQ de la page. */
export function getRelatedCorridors(corridor: Corridor, limit = 3): Corridor[] {
  const reverse = getReverseCorridor(corridor);
  return CORRIDORS.filter(
    (c) =>
      c.slug !== corridor.slug &&
      c.slug !== reverse?.slug &&
      Boolean(c.isReturn) === Boolean(corridor.isReturn),
  )
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

/**
 * LE RÉSEAU ROUTIER EN TRONÇONS ÉLÉMENTAIRES
 *
 * Il n'y a PAS de « rutas cerradas » : toutes les villes desservies sont
 * reliées par la Panamericana et la fourche d'Azuero à Divisa. Un
 * conducteur peut donc publier N'IMPORTE QUELLE paire — Las Tablas →
 * David compris — et l'itinéraire s'arme tout seul en chaînant les
 * tronçons. Les km et les péages par tronçon reproduisent exactement les
 * cumuls de ROAD (les péages se paient tous près de la capitale : une
 * ruta qui ne s'en approche pas n'en facture aucun).
 *
 * « divisa » est le nœud de la fourche : un vrai croisement, pas une
 * ville desservie — il route, il n'apparaît jamais comme parada.
 */
const DIVISA = "divisa";

const ROAD_EDGES: {
  a: string;
  b: string;
  km: number;
  tollCents: number;
}[] = [
  { a: "panama-city", b: "la-chorrera", km: 37, tollCents: 200 },
  { a: "la-chorrera", b: "coronado", km: 48, tollCents: 0 },
  { a: "coronado", b: "penonome", km: 60, tollCents: 100 },
  { a: "penonome", b: DIVISA, km: 70, tollCents: 0 },
  { a: DIVISA, b: "santiago", km: 35, tollCents: 0 },
  { a: "santiago", b: "david", km: 190, tollCents: 0 },
  { a: DIVISA, b: "chitre", km: 35, tollCents: 0 },
  { a: "chitre", b: "las-tablas", km: 35, tollCents: 0 },
];

/** Le chemin de nœuds entre deux villes. Le réseau est un arbre : le
 *  chemin simple est unique, un parcours en largeur suffit. */
function roadPath(fromSlug: string, toSlug: string): string[] | null {
  const previous = new Map<string, string>([[fromSlug, fromSlug]]);
  const queue = [fromSlug];
  while (queue.length > 0) {
    const node = queue.shift()!;
    if (node === toSlug) {
      const path = [node];
      let cursor = node;
      while (cursor !== fromSlug) {
        cursor = previous.get(cursor)!;
        path.unshift(cursor);
      }
      return path;
    }
    for (const edge of ROAD_EDGES) {
      const next = edge.a === node ? edge.b : edge.b === node ? edge.a : null;
      if (next && !previous.has(next)) {
        previous.set(next, node);
        queue.push(next);
      }
    }
  }
  return null;
}

/**
 * LA RUTA ENTRE DEUX VILLES QUELCONQUES — toujours.
 *
 * Un corridor prédéfini existe ? On le rend tel quel : il porte sa page
 * SEO et son éditorial. Sinon, on le SYNTHÉTISE depuis le réseau : mêmes
 * villes, mêmes km, mêmes péages, mêmes points de prise en charge — la
 * seule chose qui manque est la page /viajes dédiée, et l'appelant le
 * sait via `getCorridor(slug)`. La formule de prix ne change pas d'un
 * iota : elle reçoit des km et des péages, d'où qu'ils viennent.
 */
export function buildRoute(
  fromSlug: string,
  toSlug: string,
): Corridor | null {
  if (!fromSlug || !toSlug || fromSlug === toSlug) return null;

  const predefined = CORRIDORS.find(
    (c) => c.origin.slug === fromSlug && c.destination.slug === toSlug,
  );
  if (predefined) return predefined;

  const origin = ALL_CITIES.find((c) => c.slug === fromSlug);
  const destination = ALL_CITIES.find((c) => c.slug === toSlug);
  if (!origin || !destination) return null;

  const path = roadPath(fromSlug, toSlug);
  if (!path) return null;

  // Cumuls le long du chemin, nœud par nœud — Divisa cumule mais ne
  // devient jamais un waypoint.
  let km = 0;
  let tollCents = 0;
  const waypoints: Waypoint[] = [];
  for (let i = 0; i < path.length; i++) {
    if (i > 0) {
      const edge = ROAD_EDGES.find(
        (e) =>
          (e.a === path[i - 1] && e.b === path[i]) ||
          (e.b === path[i - 1] && e.a === path[i]),
      )!;
      km += edge.km;
      tollCents += edge.tollCents;
    }
    const slug = path[i];
    if (slug === DIVISA) continue;
    const city = ALL_CITIES.find((c) => c.slug === slug)!;
    waypoints.push({
      citySlug: slug,
      name: city.shortName,
      km,
      tollCents,
      pickupPoints: [...ROAD[slug as keyof typeof ROAD].pickupPoints],
    });
  }

  const crossed = waypoints.slice(1, -1).map((w) => w.name);
  return {
    slug: `${fromSlug}-${toSlug}`,
    origin,
    destination,
    distanceKm: km,
    tollCents,
    // Le rythme moyen observé sur les corridors du réseau (~0,9 min/km),
    // arrondi aux 5 minutes — une estimation, affichée comme telle.
    typicalDurationMin: Math.round((km * 0.9) / 5) * 5,
    isPriority: false,
    pickupPoints: [...ROAD[fromSlug as keyof typeof ROAD].pickupPoints],
    intro:
      crossed.length > 0
        ? `Ruta armada al momento: sigue la carretera y pasa por ${crossed.join(", ")}. Marca las paradas que te quedan de paso y tu viaje sale en más búsquedas.`
        : "Ruta armada al momento sobre la carretera que une las dos ciudades.",
    waypoints,
  };
}

/**
 * Corridors qui traversent les deux villes, dans le bon sens.
 *
 * C'est la requête qui change tout : Penonomé → Santiago n'est le corridor de
 * personne, mais trois corridors passent par les deux villes dans cet ordre.
 * Une recherche qui ne regardait que `origin`/`destination` renvoyait une page
 * vide alors que l'offre existait déjà.
 */
export function corridorsServing(
  fromCitySlug: string,
  toCitySlug: string,
): Corridor[] {
  return CORRIDORS.filter((corridor) => {
    const from = corridor.waypoints.findIndex(
      (w) => w.citySlug === fromCitySlug,
    );
    const to = corridor.waypoints.findIndex((w) => w.citySlug === toCitySlug);
    return from !== -1 && to !== -1 && from < to;
  });
}

/** Paires de villes desservies par au moins un corridor, arrêts compris. */
export function isPairServed(
  fromCitySlug: string,
  toCitySlug: string,
): boolean {
  return corridorsServing(fromCitySlug, toCitySlug).length > 0;
}
