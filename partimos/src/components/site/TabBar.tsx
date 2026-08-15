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
 * SA FORME : une pilule qui FLOTTE au-dessus du contenu, en verre, avec
 * l'onglet actif dans sa propre pastille. Demande explicite du
 * propriétaire, exemple à l'appui. Ce n'est pas qu'esthétique : une
 * barre pleine largeur collée au bord se lit comme un morceau de la
 * page, alors qu'une pilule détachée se lit comme un objet posé DESSUS —
 * et c'est ce qu'elle est, puisqu'elle survit au défilement.
 *
 * Le verre n'est pas décoratif non plus : on doit deviner que la liste
 * continue dessous, sinon on croit être arrivé au bas de l'écran.
 *
 * CINQ DESTINATIONS ET UNE ACTION. Le `+` central n'est pas un sixième
 * onglet : il publie. C'est aussi la réponse à la question du switcher
 * conducteur/passager — il n'y en a pas besoin. Un switcher global
 * obligerait à déclarer un rôle à chaque ouverture, alors que le rôle se
 * déduit : on cherche par défaut, on publie quand on appuie sur le +.
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
  /* `rutas: []` veut dire « n'allume jamais ». Mensajes n'ouvre pas une
     page mais un panneau par-dessus /cuenta : le juger sur le chemin
     l'allumerait en même temps que Viajes, et deux onglets actifs disent
     moins que zéro. */
  {
    href: "/cuenta?panel=mensajes",
    label: "Mensajes",
    icon: "chat",
    rutas: [],
  },
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
          className={`mx-auto flex h-full max-w-[74px] flex-col items-center justify-center gap-0.5 rounded-[18px] text-[10.5px] font-semibold transition-colors ${
            on ? "bg-naranja-suave text-naranja" : "text-ink-500"
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
      /* Elle FLOTTE : `inset-x-3` la décolle des bords, et la réserve du
         bas tient compte de la barre d'accueil de l'iPhone. Le contenu
         passe dessous — d'où le verre. */
      className="solo-app fixed inset-x-3 bottom-0 z-50"
      style={{ paddingBottom: "calc(10px + env(safe-area-inset-bottom))" }}
    >
      <ul className="glass relative mx-auto flex h-[64px] max-w-[440px] items-stretch rounded-[24px] px-1.5">
        {IZQUIERDA.map(item)}

        {/* PUBLIER — l'action, pas une destination. Il déborde vers le
            haut pour être atteint sans viser : c'est la cible la plus
            grande de l'écran, et celle qu'on touche le plus mal si elle
            est alignée avec les autres. */}
        <li className="flex w-[72px] shrink-0 items-start justify-center">
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
