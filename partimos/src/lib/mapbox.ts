/**
 * MAPBOX — EN IMAGES STATIQUES, PAS EN BIBLIOTHÈQUE.
 *
 * La vraie carte, le vrai tracé, et ZÉRO octet de JavaScript : l'API Static
 * Images rend la carte côté Mapbox et nous renvoie une image, mise en cache
 * par leur CDN. Sur un export statique visé par des téléphones en données
 * mobiles, c'est le bon échange — Mapbox GL JS coûterait ~230 Ko de bundle
 * plus les tuiles, pour des cartes qui n'ont pas besoin d'être manipulées.
 *
 * Le jeton est un jeton PUBLIC (`pk.`) — fait pour être embarqué côté
 * client. Il vit néanmoins en variable d'environnement et pas dans ce
 * fichier : la protection anti-secrets de GitHub reconnaît le motif Mapbox
 * et refuse tout push qui le contient. Tant que le dépôt n'a pas autorisé
 * ce jeton (bouton « allow » de l'alerte), les déploiements se font sans
 * lui — et la carte s'active toute seule dès qu'il est là au build.
 */

import { CITIES, type Corridor } from "./corridors.ts";

export const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

/** Encodage « polyline » de Google, précision 5 — le format que Mapbox lit. */
function encodePolyline(points: [number, number][]): string {
  let out = "";
  let prevLat = 0;
  let prevLng = 0;
  for (const [lat, lng] of points) {
    for (const [value, prev] of [
      [Math.round(lat * 1e5), prevLat],
      [Math.round(lng * 1e5), prevLng],
    ] as const) {
      let d = value - prev;
      d = d < 0 ? ~(d << 1) : d << 1;
      while (d >= 0x20) {
        out += String.fromCharCode((0x20 | (d & 0x1f)) + 63);
        d >>= 5;
      }
      out += String.fromCharCode(d + 63);
    }
    prevLat = Math.round(lat * 1e5);
    prevLng = Math.round(lng * 1e5);
  }
  return out;
}

const cityBySlug = (slug: string) =>
  Object.values(CITIES).find((c) => c.slug === slug)!;

/**
 * L'image du corridor : le tracé ambre relie les villes traversées, un
 * anneau bleu au départ, une épingle verte à l'arrivée — le même langage
 * que partout ailleurs sur le site (bleu = origine, vert = destination,
 * ambre = la route). `auto` cadre sur le contenu, le padding respire.
 */
export function corridorMapUrl(
  corridor: Corridor,
  width = 760,
  height = 440,
): string {
  const points = corridor.waypoints.map((w) => {
    const city = cityBySlug(w.citySlug);
    return [city.lat, city.lng] as [number, number];
  });
  const path = `path-4+f59e0b-0.9(${encodeURIComponent(encodePolyline(points))})`;

  const origin = cityBySlug(corridor.origin.slug);
  const destination = cityBySlug(corridor.destination.slug);
  const pins =
    `pin-s+0369a1(${origin.lng},${origin.lat})` +
    `,pin-s+4d7c0f(${destination.lng},${destination.lat})`;

  return (
    `https://api.mapbox.com/styles/v1/mapbox/light-v11/static/` +
    `${path},${pins}/auto/${width}x${height}@2x` +
    `?padding=56&access_token=${MAPBOX_TOKEN}`
  );
}
