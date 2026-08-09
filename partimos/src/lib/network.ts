/**
 * LE RÉSEAU, VU COMME UNE PLANCHE
 *
 * Les six corridors ne sont pas six routes indépendantes : c'est un tronc sur
 * la Panaméricaine et une fourche vers Azuero. Ce module DÉRIVE cette
 * topologie des corridors existants au lieu de la redéclarer — si un corridor
 * change de distance, le tracé suit, et il n'y a jamais deux vérités à tenir
 * d'accord.
 *
 * Rien ici n'est un choix graphique : ce sont des stations et des kilomètres
 * cumulés. Le dessin qui s'appuie dessus vit dans le composant.
 */

import { CORRIDORS, type Corridor } from "./corridors.ts";
import type { Waypoint } from "./segments.ts";

export type Branch = "trunk" | "azuero";

export type Station = Waypoint & { branch: Branch };

/** Le corridor le plus long donne le tronc : il traverse tous les autres. */
function longest(corridors: Corridor[]): Corridor {
  return corridors.reduce((a, b) => (b.distanceKm > a.distanceKm ? b : a));
}

const TRUNK_CORRIDOR = longest(CORRIDORS);
const TRUNK_SLUGS = new Set(TRUNK_CORRIDOR.waypoints.map((w) => w.citySlug));

/** La branche : le plus long corridor qui quitte le tronc en cours de route. */
const BRANCH_CORRIDOR = longest(
  CORRIDORS.filter((c) =>
    c.waypoints.some((w) => !TRUNK_SLUGS.has(w.citySlug)),
  ),
);

const TRUNK: Station[] = TRUNK_CORRIDOR.waypoints.map((w) => ({
  ...w,
  branch: "trunk",
}));

/** Les stations d'Azuero : celles de la branche absentes du tronc. */
const AZUERO: Station[] = BRANCH_CORRIDOR.waypoints
  .filter((w) => !TRUNK_SLUGS.has(w.citySlug))
  .map((w) => ({ ...w, branch: "azuero" }));

/** Le dernier point commun aux deux tracés : là où la fourche s'ouvre. */
const FORK: Station =
  [...BRANCH_CORRIDOR.waypoints]
    .reverse()
    .filter((w) => TRUNK_SLUGS.has(w.citySlug))
    .map((w): Station => ({ ...w, branch: "trunk" }))[0] ?? TRUNK[0];

export const NETWORK = {
  trunk: TRUNK,
  azuero: AZUERO,
  fork: FORK,
  maxKm: Math.max(
    TRUNK[TRUNK.length - 1].km,
    AZUERO.length > 0 ? AZUERO[AZUERO.length - 1].km : 0,
  ),
};

export const ALL_STATIONS: Station[] = [...TRUNK, ...AZUERO];

export function station(citySlug: string): Station | undefined {
  return ALL_STATIONS.find((s) => s.citySlug === citySlug);
}

/**
 * Le chemin d'une station à une autre, stations traversées comprises.
 *
 * Deux stations de branches différentes ne se rejoignent pas : on ne remonte
 * pas jusqu'à la fourche pour redescendre de l'autre côté. Chitré → Santiago
 * n'existe pas plus dans le dessin que dans la recherche.
 */
export function pathBetween(
  fromCitySlug: string,
  toCitySlug: string,
): Station[] | null {
  const from = station(fromCitySlug);
  const to = station(toCitySlug);
  if (!from || !to || from.km >= to.km) return null;

  // Une station du tronc commun (avant la fourche) mène aux deux branches ;
  // une station située après la fourche ne mène qu'à la sienne.
  if (from.branch === "azuero" && to.branch === "trunk") return null;
  if (from.branch === "trunk" && from.km > FORK.km && to.branch === "azuero") {
    return null;
  }

  const line =
    to.branch === "azuero"
      ? [...TRUNK.filter((s) => s.km <= FORK.km), ...AZUERO]
      : TRUNK;

  const a = line.findIndex((s) => s.citySlug === fromCitySlug);
  const b = line.findIndex((s) => s.citySlug === toCitySlug);
  if (a === -1 || b === -1 || a >= b) return null;

  return line.slice(a, b + 1);
}
