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
        href: "/#buscar",
        label: "Buscar un viaje",
        hint: "Escoge origen y destino en el mapa",
        icon: "search",
      },
      {
        href: "/viajes",
        label: "Todas las rutas",
        hint: "Seis corredores, con horarios y aportes",
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
        href: "/publicar",
        label: "Publicar mi viaje",
        hint: "Los puestos vacíos no le sirven a nadie",
        icon: "car",
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
  { href: "/viajes", label: "Rutas" },
  { href: "/como-funciona", label: "Cómo se paga" },
  { href: "/publicar", label: "Publicar un viaje" },
  { href: "/seguridad", label: "Seguridad" },
];
