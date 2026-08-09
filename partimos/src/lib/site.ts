/** Constantes du site. Une seule source pour les URL canoniques. */

export const SITE = {
  name: "Partimos",
  /** Domaine d'origine — à brancher une fois le domaine acheté (⛔ HUMAIN). */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://partimos.com",
  locale: "es-PA",
  description:
    "Viajes compartidos entre particulares en Panamá. Encuentra quién va a tu pueblo este fin de semana y comparte los gastos. Le pagas directo a la persona, en efectivo o por Yappy.",
} as const;

export function canonical(path = "/") {
  return new URL(path, SITE.url).toString();
}

/**
 * Préfixe des fichiers servis depuis `public/`.
 *
 * `basePath` de Next réécrit les liens et les routes, mais PAS les `src` bruts
 * d'une balise `<img>` ou d'un `<source>`. Sous une Page de projet GitHub, où
 * le site vit sous /test/partimos, un `/img/foto.jpg` écrit tel quel renvoie
 * un 404 — et une image absente ne se voit qu'une fois déployée.
 */
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function asset(path: string) {
  return `${BASE_PATH}${path}`;
}
