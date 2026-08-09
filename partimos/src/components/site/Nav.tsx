import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { Logo } from "./Logo";
import { MobileMenu } from "./MobileMenu";
import { AccountButton } from "./AccountButton";
import { Icon } from "@/components/ui/Icon";
import { PRIMARY_LINKS } from "./navigation";

/**
 * Deux affordances restent visibles partout, à toutes les tailles : publier
 * un viaje et son compte. C'est le motif des plateformes à double face — si
 * l'action « offrir » se cache dans un menu, seule la demande se voit, et le
 * côté offre ne démarre jamais.
 */
export function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-ink-200 bg-white">
      <nav
        aria-label="Principal"
        className="mx-auto flex max-w-[1120px] items-center gap-4 px-5 py-2.5"
      >
        <Logo gradientId="brand-nav" />

        <ul className="ml-3 hidden gap-6 text-[14.5px] font-medium text-ink-500 min-[980px]:flex">
          {PRIMARY_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="block py-1.5 transition-colors hover:text-ink-900"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/publicar/nuevo"
            className="flex items-center gap-1.5 rounded-[11px] border-[1.5px] border-ink-200 px-3 py-2 text-[14px] font-semibold transition-colors hover:border-accent hover:text-accent-ink"
          >
            <Icon name="plus" className="size-4" />
            <span className="hidden sm:inline">Publicar</span>
            <span className="sr-only sm:hidden">Publicar un viaje</span>
          </Link>

          <ButtonLink
            href="/buscar"
            size="sm"
            className="hidden sm:inline-flex"
          >
            Buscar viaje
          </ButtonLink>

          <AccountButton />
          <MobileMenu />
        </div>
      </nav>
    </header>
  );
}
