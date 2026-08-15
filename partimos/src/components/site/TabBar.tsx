"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/ui/Icon";

/**
 * LA BARRE D'ONGLETS — visible seulement dans l'app installée.
 *
 * Elle est TOUJOURS dans le HTML ; c'est `.solo-app` (globals.css) qui
 * décide de la montrer. Le site n'en veut pas — il a sa barre haute et
 * son pied de page — et surtout la page servie doit rester la même pour
 * tout le monde, robots d'indexation compris.
 *
 * QUATRE ONGLETS ET UN BOUTON CENTRAL, d'après la maquette du
 * propriétaire. Le bouton n'est pas un cinquième onglet : c'est
 * l'ACTION, publier un viaje. C'est aussi la réponse à la question du
 * switcher conducteur/passager — il n'y en a pas besoin. Un switcher
 * global obligerait à déclarer un rôle à chaque ouverture, alors que le
 * rôle se déduit : on cherche par défaut, on publie quand on appuie sur
 * le +. Le rôle suit le geste, pas l'inverse.
 *
 * Les libellés restent sous les icônes. Une icône seule est une
 * devinette — « route » et « chat » ne veulent rien dire hors contexte —
 * et le coût d'un mot de sept lettres est nul.
 */

/**
 * `rutas` dit quelles ADRESSES allument l'onglet — ce n'est pas toujours
 * celle où il mène. « Buscar » mène aux salidas du jour, mais la page de
 * résultats et les pages de ruta font partie du même geste : chercher.
 * Un onglet éteint sur l'écran qu'il a ouvert, c'est une carte de métro
 * sans « vous êtes ici ».
 *
 * `rutas: []` veut dire « n'allume jamais ». C'est le cas de Mensajes :
 * il n'ouvre pas une page mais un panneau par-dessus /cuenta. Le juger
 * sur le chemin l'allumerait en même temps que Viajes — deux onglets
 * actifs disent moins que zéro.
 */
type Tab = { href: string; label: string; icon: IconName; rutas: string[] };

/** Deux à gauche du bouton, deux à droite : le + tombe au centre exact. */
const IZQUIERDA: Tab[] = [
  { href: "/", label: "Inicio", icon: "home", rutas: ["/"] },
  {
    href: "/ya",
    label: "Buscar",
    icon: "search",
    rutas: ["/ya", "/buscar", "/viajes", "/viaje"],
  },
];
const DERECHA: Tab[] = [
  { href: "/cuenta?panel=mensajes", label: "Mensajes", icon: "chat", rutas: [] },
  { href: "/cuenta", label: "Viajes", icon: "route", rutas: ["/cuenta"] },
];

export function TabBar() {
  const pathname = usePathname();

  /* L'onglet actif se juge sur le PRÉFIXE, sauf l'accueil : « / » est
     préfixe de tout, et l'allumer partout ne dirait plus rien. */
  const activo = (rutas: string[]) =>
    rutas.some((r) => (r === "/" ? pathname === "/" : pathname.startsWith(r)));

  const item = (t: Tab) => {
    const on = activo(t.rutas);
    return (
      <li key={t.href} className="flex-1">
        <Link
          href={t.href}
          aria-current={on ? "page" : undefined}
          className={`flex h-full flex-col items-center justify-center gap-1 text-[10.5px] font-semibold transition-colors ${
            on ? "text-naranja" : "text-ink-400"
          }`}
        >
          <Icon name={t.icon} className="size-[21px]" />
          {t.label}
        </Link>
      </li>
    );
  };

  return (
    <nav
      aria-label="Navegación principal"
      className="solo-app fixed inset-x-0 bottom-0 z-50 border-t border-ink-200 bg-white"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="relative mx-auto flex h-[62px] max-w-[520px] items-stretch">
        {IZQUIERDA.map(item)}

        {/* PUBLIER — l'action, pas une destination. Il déborde vers le
            haut pour être atteint sans viser : c'est la cible la plus
            grande de l'écran, et celle qu'on touche le plus mal si elle
            est alignée avec les autres. */}
        <li className="flex w-[76px] shrink-0 items-start justify-center">
          <Link
            href="/publicar/nuevo"
            aria-label="Publicar un viaje"
            className="tab-mas -mt-5 flex size-[54px] items-center justify-center rounded-full bg-naranja text-white shadow-[0_6px_18px_-4px_rgba(226,84,12,0.55)] transition-colors hover:bg-naranja-hondo"
          >
            <Icon name="plus" className="size-6" />
          </Link>
        </li>

        {DERECHA.map(item)}
      </ul>
    </nav>
  );
}
