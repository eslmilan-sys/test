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
 * La barre appartient au registre de la planche : fond vert profond, filet
 * en bas, clé ocre au survol. Une barre blanche translucide au-dessus d'une
 * planche sombre lisait comme un reste de l'ancien monde posé par-dessus le
 * nouveau.
 *
 * Les éléments qui apparaissent selon la taille sont ENVELOPPÉS dans un
 * élément porteur de la règle d'affichage. Poser `hidden` directement sur un
 * bouton dont la classe de base contient `inline-flex` ne masque rien : les
 * deux utilitaires visent `display` et c'est l'ordre de la feuille de style
 * qui gagne. C'est exactement le bug qui déformait cette barre.
 */
export function Nav() {
  return (
    <header className="plate sticky top-0 z-50 border-b border-plate-700">
      <nav
        aria-label="Principal"
        className="mx-auto flex h-16 max-w-[1120px] items-center gap-4 px-5"
      >
        <Logo />

        <ul className="ml-4 hidden items-center gap-7 text-[14.5px] font-medium text-plate-300 min-[900px]:flex">
          {PRIMARY_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="block py-2 transition-colors hover:text-ochre-300"
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
              className="flex items-center gap-1.5 px-3.5 py-2 text-[14.5px] font-semibold text-plate-300 transition-colors hover:text-ochre-300"
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
