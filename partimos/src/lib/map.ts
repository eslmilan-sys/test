/**
 * PROJECTION DE LA CARTE SCHÉMATIQUE
 *
 * Pourquoi pas Mapbox : la clé est une étape ⛔ HUMAIN, et une carte à tuiles
 * impose un service tiers sur le chemin critique de la recherche — ce que le
 * §10 du brief interdit pour l'interface. Le jour où la clé existe, cette
 * carte devient le repli hors ligne.
 *
 * Pourquoi pas un contour du Panama : dessiner une côte de mémoire produirait
 * une géographie fausse. On projette donc les VRAIES coordonnées des villes,
 * reliées par les corridors réels — la topologie et les positions relatives
 * sont exactes, le trait est assumé comme schématique. Un plan de métro ne
 * ment pas parce qu'il n'est pas une carte routière.
 */

import { ALL_CITIES, CORRIDORS, type City } from "./corridors";

/** Cadre de la zone couverte, avec une marge pour les étiquettes. */
const BOUNDS = {
  minLng: -82.9,
  maxLng: -79.2,
  minLat: 7.55,
  maxLat: 9.25,
};

export const MAP_VIEWBOX = { width: 1000, height: 460 };

/**
 * Projection équirectangulaire, corrigée du cosinus de la latitude moyenne.
 * À l'échelle du Panama (moins de 2° de latitude), l'écart avec une
 * projection conforme est inférieur au rayon des pastilles.
 */
export function project(lat: number, lng: number): { x: number; y: number } {
  const midLat = ((BOUNDS.minLat + BOUNDS.maxLat) / 2) * (Math.PI / 180);
  const spanLng = (BOUNDS.maxLng - BOUNDS.minLng) * Math.cos(midLat);
  const spanLat = BOUNDS.maxLat - BOUNDS.minLat;

  const x =
    (((lng - BOUNDS.minLng) * Math.cos(midLat)) / spanLng) * MAP_VIEWBOX.width;
  // L'axe y d'un SVG descend, la latitude monte.
  const y = ((BOUNDS.maxLat - lat) / spanLat) * MAP_VIEWBOX.height;

  return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
}

export type MapCity = City & { x: number; y: number };

export const MAP_CITIES: MapCity[] = ALL_CITIES.map((city) => ({
  ...city,
  ...project(city.lat, city.lng),
}));

export function mapCity(slug: string): MapCity | undefined {
  return MAP_CITIES.find((c) => c.slug === slug);
}

/** Les corridors existants, prêts à tracer. */
export const MAP_LINKS = CORRIDORS.map((corridor) => {
  const from = mapCity(corridor.origin.slug)!;
  const to = mapCity(corridor.destination.slug)!;
  return { slug: corridor.slug, from, to, isPriority: corridor.isPriority };
});

/**
 * Une courbe douce plutôt qu'un segment : une route ne va pas tout droit, et
 * la courbure évite que deux corridors partant de Panamá se superposent.
 */
export function linkPath(
  from: { x: number; y: number },
  to: { x: number; y: number },
): string {
  const mx = (from.x + to.x) / 2;
  const my = (from.y + to.y) / 2;
  // Perpendiculaire au segment, amplitude proportionnelle à sa longueur.
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy) || 1;
  const bend = Math.min(38, length * 0.12);
  const cx = mx + (-dy / length) * bend;
  const cy = my + (dx / length) * bend;
  return `M ${from.x} ${from.y} Q ${cx} ${cy} ${to.x} ${to.y}`;
}
