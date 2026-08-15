"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/ui/Icon";

/**
 * LA BARRE D'ONGLETS — visible seulement dans l'app installée.
 *
 * Elle est TOUJOURS dans le HTML ; c'est `.solo-app` (globals.css) qui
 * décide de la montrer. Le site web n'en veut pas — il a sa barre haute et
 * son pied de page — et surtout la page servie doit rester la même pour
 * tout le monde, robots d'indexation compris.
 *
 * QUATRE ONGLETS, PAS SIX. Le pouce d'une main qui tient le téléphone
 * atteint confortablement quatre cibles sur 390 px ; à six, on vise. Et
 * quatre couvre les deux intentions du produit (voyager, conduire) plus le
 * suivi et l'aide, ce qui est tout ce qu'on fait ici.
 *
 * Pas de libellé sous chaque icône ? Si — mais courts. Une icône seule est
 * une devinette : « route » et « compass » ne veulent rien dire hors
 * contexte, et le coût d'un mot de sept lettres est nul.
 */

type Tab = { href: string; label: string; icon: IconName };

const TABS: Tab[] = [
  { href: "/ya", label: "Buscar", icon: "search" },
  { href: "/publicar/nuevo", label: "Publicar", icon: "car" },
  { href: "/cuenta", label: "Mis viajes", icon: "route" },
  { href: "/ayuda", label: "Ayuda", icon: "chat" },
];

export function TabBar() {
  const pathname = usePathname();

  /* L'onglet actif se juge sur le PRÉFIXE, pas sur l'égalité : /publicar/nuevo
     et /cuenta?panel=verificacion doivent allumer le leur. L'accueil est le
     seul cas d'égalité stricte — sinon « / » allumerait tout. */
  const activo = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav
      aria-label="Navegación principal"
      className="solo-app fixed inset-x-0 bottom-0 z-50 border-t border-ink-200 bg-white/95 backdrop-blur-md"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto flex h-16 max-w-[520px] items-stretch">
        {TABS.map((t) => {
          const on = activo(t.href);
          return (
            <li key={t.href} className="flex-1">
              <Link
                href={t.href}
                aria-current={on ? "page" : undefined}
                className={`flex h-full flex-col items-center justify-center gap-1 text-[11.5px] font-semibold transition-colors ${
                  on ? "text-accent-ink" : "text-ink-500"
                }`}
              >
                <Icon
                  name={t.icon}
                  className={on ? "size-[22px]" : "size-[21px]"}
                />
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
