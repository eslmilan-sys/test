import type { IconName } from "@/components/ui/Icon";

/**
 * Le plan du site, en un seul endroit.
 *
 * Il alimente le menu mobile, le menu déroulant du bureau et le pied de page.
 * Une seule source : trois listes qui divergent, c'est exactement comme ça
 * qu'un site finit avec des pages que personne ne trouve.
 *
 * Le groupement est par INTENTION, pas par type de contenu : on arrive ici
 * soit pour voyager, soit pour conduire. « Blog / Produit / Société » ne
 * répond à aucune des deux questions.
 */

export type NavLink = {
  href: string;
  label: string;
  hint: string;
  icon: IconName;
};

export type NavSection = { title: string; links: NavLink[] };

export const NAV_SECTIONS: NavSection[] = [
  {
    title: "Viajar",
    links: [
      {
        href: "/ya",
        label: "Tu próximo viaje",
        hint: "Tu rutina, ya buscada — dos taps y listo",
        icon: "route",
      },
      {
        href: "/buscar",
        label: "Buscar un viaje",
        hint: "Quién sale hoy, a qué hora y por cuánto",
        icon: "search",
      },
      {
        href: "/viajes",
        label: "Todas las rutas",
        hint: "Ida y vuelta por todo el país, con aportes",
        icon: "route",
      },
      {
        href: "/como-funciona",
        label: "Cómo se paga un viaje",
        hint: "Del primer clic al pago, paso a paso",
        icon: "cash",
      },
      {
        href: "/seguridad",
        label: "Seguridad",
        hint: "Con quién viajas y qué no guardamos",
        icon: "shield",
      },
    ],
  },
  {
    title: "Manejar",
    links: [
      {
        href: "/publicar/nuevo",
        label: "Publicar mi viaje",
        hint: "Cuatro pasos, menos de un minuto",
        icon: "car",
      },
      {
        href: "/publicar",
        label: "Cómo funciona para conductores",
        hint: "Por qué hay un tope y de dónde sale",
        icon: "compass",
      },
      {
        href: "/publicar#calculadora",
        label: "Calcular el aporte",
        hint: "Cuánto se puede pedir por puesto",
        icon: "compass",
      },
    ],
  },
  {
    title: "Partimos",
    links: [
      {
        href: "/cuenta",
        label: "Mi cuenta",
        hint: "Tus viajes, tu perfil, tu verificación",
        icon: "users",
      },
      {
        href: "/ayuda",
        label: "Ayuda",
        hint: "Las preguntas de siempre",
        icon: "chat",
      },
      {
        href: "/terminos",
        label: "Términos de uso",
        hint: "Qué es la plataforma y qué no es",
        icon: "id",
      },
      {
        href: "/privacidad",
        label: "Aviso de privacidad",
        hint: "Qué guardamos y qué no",
        icon: "shield",
      },
    ],
  },
];

/** Les quatre entrées visibles en permanence sur grand écran. */
export const PRIMARY_LINKS = [
  { href: "/buscar", label: "Buscar" },
  { href: "/viajes", label: "Rutas" },
  { href: "/como-funciona", label: "Cómo se paga" },
  { href: "/seguridad", label: "Seguridad" },
];
