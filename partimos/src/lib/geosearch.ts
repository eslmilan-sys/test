/**
 * RECHERCHE DE LIEUX — TROIS FOURNISSEURS EN PARALLÈLE.
 *
 * Aucune base ne connaît tous les lieux du Panama. Mapbox rate des PH
 * que TomTom connaît ; TomTom rate des barriadas que la communauté
 * OpenStreetMap (LocationIQ) a cartographiées ; et inversement. Plutôt
 * que de parier sur un fournisseur, on interroge les trois EN MÊME
 * TEMPS et on fusionne : le lieu n'a besoin d'exister que dans UNE base
 * pour sortir.
 *
 *   · TomTom Search — référentiel commercial fort (POI, immeubles,
 *     commerces), coordonnées directes dans la réponse.
 *   · LocationIQ Autocomplete — OpenStreetMap : ce que les Panaméens
 *     ont cartographié eux-mêmes, coordonnées directes.
 *   · Mapbox Search Box — déjà en place ; ses coordonnées demandent
 *     l'étape retrieve, faite au clic.
 *
 * Chaque fournisseur qui échoue (clé absente, quota, réseau) disparaît
 * en silence : Promise.allSettled, jamais de rejet global. Les clés
 * sont des clés PUBLIQUES côté client, comme le jeton Mapbox — à
 * restreindre par domaine dans chaque console.
 */

import {
  geocodePlaces,
  suggestPlaces,
  MAPBOX_TOKEN,
  type GeocodedPlace,
} from "./mapbox";

const TOMTOM_KEY = process.env.NEXT_PUBLIC_TOMTOM_KEY ?? "";
const LOCATIONIQ_KEY = process.env.NEXT_PUBLIC_LOCATIONIQ_KEY ?? "";

/** Un lieu trouvé, quel que soit le fournisseur. lat/lng à 0 = inconnues
 *  pour l'instant (Mapbox suggest) — `mapboxId` permet de les obtenir. */
export type FoundPlace = GeocodedPlace & { mapboxId?: string };

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

async function tomtomSearch(
  query: string,
  near?: { lat: number; lng: number },
  signal?: AbortSignal,
): Promise<FoundPlace[]> {
  if (!TOMTOM_KEY) return [];
  const params = new URLSearchParams({
    key: TOMTOM_KEY,
    countrySet: "PA",
    language: "es-MX",
    limit: "5",
    typeahead: "true",
  });
  if (near) {
    params.set("lat", String(near.lat));
    params.set("lon", String(near.lng));
  }
  const res = await fetch(
    `https://api.tomtom.com/search/2/search/` +
      `${encodeURIComponent(query)}.json?${params}`,
    { signal },
  );
  if (!res.ok) return [];
  const data = (await res.json()) as {
    results?: {
      poi?: { name?: string };
      address?: {
        freeformAddress?: string;
        municipality?: string;
        streetName?: string;
      };
      position?: { lat: number; lon: number };
    }[];
  };
  return (data.results ?? [])
    .filter((r) => r.position)
    .map((r) => {
      const name =
        r.poi?.name ??
        r.address?.freeformAddress ??
        r.address?.streetName ??
        query;
      const context = r.poi?.name
        ? (r.address?.freeformAddress ?? r.address?.municipality ?? "")
        : (r.address?.municipality ?? "");
      return {
        name,
        context: context.replace(/, Panam[aá]$/i, ""),
        lat: r.position!.lat,
        lng: r.position!.lon,
      };
    });
}

async function locationiqSearch(
  query: string,
  signal?: AbortSignal,
): Promise<FoundPlace[]> {
  if (!LOCATIONIQ_KEY) return [];
  const params = new URLSearchParams({
    key: LOCATIONIQ_KEY,
    q: query,
    countrycodes: "pa",
    limit: "5",
    dedupe: "1",
    "accept-language": "es",
  });
  const res = await fetch(
    `https://api.locationiq.com/v1/autocomplete?${params}`,
    { signal },
  );
  if (!res.ok) return [];
  const data = (await res.json()) as {
    display_place?: string;
    display_address?: string;
    display_name?: string;
    lat: string;
    lon: string;
  }[];
  if (!Array.isArray(data)) return [];
  return data.map((r) => ({
    name: r.display_place ?? (r.display_name ?? query).split(",")[0],
    context: (r.display_address ?? r.display_name ?? "")
      .replace(/, Panam[aá]$/i, "")
      .slice(0, 80),
    lat: Number(r.lat),
    lng: Number(r.lon),
  }));
}

/**
 * La recherche combinée. L'ordre de fusion privilégie les fournisseurs
 * à coordonnées directes (TomTom, LocationIQ) puis Mapbox ; les
 * doublons se reconnaissent au nom normalisé. Six résultats maximum —
 * au-delà, une liste de suggestions devient une liste de lecture.
 */
export async function searchEverywhere(
  query: string,
  near?: { lat: number; lng: number },
  signal?: AbortSignal,
): Promise<FoundPlace[]> {
  if (query.trim().length < 3) return [];
  const settled = await Promise.allSettled([
    tomtomSearch(query, near, signal),
    locationiqSearch(query, signal),
    MAPBOX_TOKEN
      ? suggestPlaces(query, near, signal)
      : Promise.resolve([] as FoundPlace[]),
  ]);
  const merged: FoundPlace[] = [];
  const seen = new Set<string>();
  for (const result of settled) {
    if (result.status !== "fulfilled") continue;
    for (const place of result.value) {
      const key = normalize(place.name);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      merged.push(place);
    }
  }
  /* Personne n'a répondu ? Le géocodeur v5 de Mapbox reste un dernier
     filet pour les rues. */
  if (merged.length === 0 && MAPBOX_TOKEN) {
    try {
      return await geocodePlaces(query, near, signal);
    } catch {
      return [];
    }
  }
  return merged.slice(0, 6);
}

export const GEOSEARCH_ENABLED = Boolean(
  TOMTOM_KEY || LOCATIONIQ_KEY || MAPBOX_TOKEN,
);
