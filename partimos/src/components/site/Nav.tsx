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
 *
 * ---------------------------------------------------------------------------
 * ELLE FLOTTE, DÉTACHÉE DU BORD.
 *
 * C'est le geste qui change tout : la barre n'est plus un bandeau collé en
 * haut mais un objet posé SUR la page, qui laisse voir le premier écran
 * passer dessous. Deux précautions vont avec, et ce sont elles qu'on voit
 * casser partout où ce geste est copié sans réfléchir :
 *
 *   · LA HAUTEUR EST RÉSERVÉE. La barre est `fixed`, donc elle est sortie du
 *     flux : sans réservoir, le premier titre de chaque page passerait
 *     dessous. Le réservoir est rendu ici, une fois, et vaut pour toutes les
 *     pages — pas un `padding-top` recopié page par page qu'on oublierait sur
 *     la septième. Sa hauteur ne bouge PAS quand la barre se contracte, sinon
 *     le contenu sauterait au premier pixel de défilement.
 *
 *   · LE FOND TIENT LE CONTRASTE SUR N'IMPORTE QUOI. La barre survole le
 *     premier écran clair, mais aussi la section de paiement, qui est sombre.
 *     Le verre est translucide : sa valeur composite descend avec ce qui
 *     passe dessous. D'où `--on-glass-muted` (voir `globals.css`) plutôt
 *     qu'un `text-ink-500` qui serait juste ici et faux trois écrans plus
 *     bas — il y tomberait à 3,6:1.
 */
export function Nav() {
  return (
    <>
      <header className="pointer-events-none fixed inset-x-0 top-0 z-50 px-3 pt-[var(--nav-gap)]">
        <nav
          aria-label="Principal"
          className="glass nav-pill pointer-events-auto mx-auto flex h-[var(--nav-h)] max-w-[1120px] items-center gap-4 rounded-[20px] px-4 sm:px-5"
        >
          <Logo gradientId="brand-nav" />

          <ul className="ml-4 hidden items-center gap-7 text-[14.5px] font-medium text-[var(--on-glass-muted)] min-[900px]:flex">
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
                className="flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[14.5px] font-semibold text-[var(--on-glass-muted)] transition-colors hover:bg-white/70 hover:text-ink-900"
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

      {/* Le réservoir. Décoratif et sans contenu : il ne dit rien à un lecteur
          d'écran, il occupe juste la place que la barre a quittée. */}
      <div aria-hidden className="h-[var(--nav-space)]" />
    </>
  );
}
