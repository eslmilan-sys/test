/**
 * LIEUX CONNUS — les points de rencontre que tout le monde sait trouver.
 *
 * « Frente al Machetazo » est une adresse panaméenne parfaitement valide :
 * les gens se donnent rendez-vous aux centres commerciaux, aux parques
 * centraux, aux supermercados — pas à des coordonnées. Ce catalogue liste
 * les repères CONNUS de chaque ville desservie, pour que le buscador et
 * les points de ramassage parlent la langue des passagers.
 *
 * Deux règles :
 *   · JAMAIS une terminal de buses (règle produit — on ne se pose pas là
 *     où opèrent les transports commerciaux).
 *   · Uniquement des lieux réels et notoires : parques centraux dont le
 *     nom est établi, chaînes présentes dans la ville (El Machetazo est
 *     LE grand magasin de l'intérieur du pays), malls qui existent.
 *
 * Le géocodeur Mapbox complète ce catalogue pour tout le reste (une
 * adresse, un coin de rue) — voir PlacePicker. Le catalogue, lui, marche
 * hors ligne et à la première frappe.
 */

export type PlaceKind = "mall" | "parque" | "tienda" | "referencia";

export type KnownPlace = {
  citySlug: string;
  name: string;
  kind: PlaceKind;
};

export const KNOWN_PLACES: KnownPlace[] = [
  // Ciudad de Panamá
  { citySlug: "panama-city", name: "Multiplaza Pacific", kind: "mall" },
  { citySlug: "panama-city", name: "Albrook Mall", kind: "mall" },
  { citySlug: "panama-city", name: "Metromall", kind: "mall" },
  { citySlug: "panama-city", name: "Megamall (Vía España)", kind: "mall" },
  { citySlug: "panama-city", name: "Parque Omar", kind: "parque" },
  {
    citySlug: "panama-city",
    name: "Universidad de Panamá",
    kind: "referencia",
  },
  {
    citySlug: "panama-city",
    name: "Costa del Este (entrada)",
    kind: "referencia",
  },
  {
    citySlug: "panama-city",
    name: "Westland Mall (Arraiján)",
    kind: "mall",
  },
  { citySlug: "panama-city", name: "Multicentro (Avenida Balboa)", kind: "mall" },
  { citySlug: "panama-city", name: "El Dorado (centro comercial)", kind: "mall" },
  { citySlug: "panama-city", name: "Parque Urracá", kind: "parque" },

  // Coronado
  { citySlug: "coronado", name: "Coronado Mall", kind: "mall" },
  { citySlug: "coronado", name: "El Rey de Coronado", kind: "tienda" },

  // Penonomé
  { citySlug: "penonome", name: "El Machetazo de Penonomé", kind: "tienda" },
  { citySlug: "penonome", name: "Parque 8 de Diciembre", kind: "parque" },

  // Aguadulce
  { citySlug: "aguadulce", name: "Parque Rodolfo Chiari", kind: "parque" },
  { citySlug: "aguadulce", name: "El Machetazo de Aguadulce", kind: "tienda" },

  // Santiago
  {
    citySlug: "santiago",
    name: "Parque Juan Demóstenes Arosemena",
    kind: "parque",
  },
  { citySlug: "santiago", name: "El Machetazo de Santiago", kind: "tienda" },

  // Chitré
  { citySlug: "chitre", name: "Parque Unión", kind: "parque" },
  { citySlug: "chitre", name: "El Machetazo de Chitré", kind: "tienda" },

  // Las Tablas
  { citySlug: "las-tablas", name: "Parque Porras", kind: "parque" },

  // David
  { citySlug: "david", name: "Parque Cervantes", kind: "parque" },
  { citySlug: "david", name: "Chiriquí Mall", kind: "mall" },
  { citySlug: "david", name: "Federal Mall", kind: "mall" },
  { citySlug: "david", name: "Súper Barú (David)", kind: "tienda" },
];

export const KIND_LABELS: Record<PlaceKind, string> = {
  mall: "Centro comercial",
  parque: "Parque",
  tienda: "Tienda",
  referencia: "Punto de referencia",
};

export function placesForCity(citySlug: string): KnownPlace[] {
  return KNOWN_PLACES.filter((p) => p.citySlug === citySlug);
}

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

/** Recherche un lieu connu par son nom — le buscador s'en sert pour que
 *  « multiplaza » sélectionne Ciudad de Panamá. */
export function searchPlaces(query: string, limit = 4): KnownPlace[] {
  const q = normalize(query.trim());
  if (q.length < 2) return [];
  return KNOWN_PLACES.filter((p) => normalize(p.name).includes(q)).slice(
    0,
    limit,
  );
}
