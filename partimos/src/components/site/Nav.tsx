import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { Logo } from "./Logo";
import { MobileMenu } from "./MobileMenu";
import { AccountButton } from "./AccountButton";
import { Icon } from "@/components/ui/Icon";
import { PRIMARY_LINKS } from "./navigation";

/**
 * BARRE DE NAVIGATION
 *
 * Deux compositions, pas une seule qui se comprime.
 *
 * · Mobile : marque, compte, menu. Trois cibles, de l'air entre elles.
 *   Chercher et publier vivent dans la barre d'action basse et dans le menu —
 *   les empiler aussi en haut donnait cinq contrôles sur 390 px, dont un
 *   bouton texte qui passait sur deux lignes et gonflait l'en-tête à 85 px.
 * · À partir de 900 px : les destinations apparaissent, et les deux actions
 *   reviennent en haut, là où il y a la place de les lire.
 *
 * Les éléments qui apparaissent selon la taille sont ENVELOPPÉS dans un
 * élément porteur de la règle d'affichage. Poser `hidden` directement sur un
 * bouton dont la classe de base contient `inline-flex` ne masque rien : les
 * deux utilitaires visent `display` et c'est l'ordre de la feuille de style
 * qui gagne. C'est exactement le bug qui déformait cette barre.
 */
export function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-ink-200/70 bg-white/85 backdrop-blur-xl">
      <nav
        aria-label="Principal"
        className="mx-auto flex h-16 max-w-[1120px] items-center gap-4 px-5"
      >
        <Logo gradientId="brand-nav" />

        <ul className="ml-4 hidden items-center gap-7 text-[14.5px] font-medium text-ink-500 min-[900px]:flex">
          {PRIMARY_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="block py-2 transition-colors hover:text-ink-900"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="ml-auto flex items-center gap-2">
          <span className="hidden min-[900px]:block">
            <Link
              href="/publicar/nuevo"
              className="flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[14.5px] font-semibold text-ink-600 transition-colors hover:bg-ink-50 hover:text-ink-900"
            >
              <Icon name="plus" className="size-4" />
              Publicar
            </Link>
          </span>

          <span className="hidden min-[900px]:block">
            <ButtonLink href="/buscar" size="sm">
              Buscar viaje
            </ButtonLink>
          </span>

          <AccountButton />
          <MobileMenu />
        </div>
      </nav>
    </header>
  );
}
