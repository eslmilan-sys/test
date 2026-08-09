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
