import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { Logo } from "./Logo";
import { MobileMenu } from "./MobileMenu";
import { AuthDialog } from "./AuthDialog";
import { PRIMARY_LINKS } from "./navigation";

/**
 * Les entrées visibles nomment des DESTINATIONS, pas des sections de la page
 * d'accueil. « Cómo funciona » qui renvoie à une ancre plus bas ne dit pas
 * qu'il existe d'autres pages — c'était le fond de la critique.
 */
export function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-ink-200 bg-white">
      <nav
        aria-label="Principal"
        className="mx-auto flex max-w-[1120px] items-center gap-5 px-5 py-2.5"
      >
        <Logo gradientId="brand-nav" />

        <ul className="ml-3 hidden gap-6 text-[14.5px] font-medium text-ink-500 min-[900px]:flex">
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

        <div className="ml-auto flex items-center gap-2.5">
          <AuthDialog
            trigger={
              <button className="hidden py-1.5 text-[14.5px] font-semibold transition-colors hover:text-accent-ink min-[900px]:block">
                Entrar
              </button>
            }
          />
          <ButtonLink href="/#buscar" size="sm">
            Buscar viaje
          </ButtonLink>
          <MobileMenu />
        </div>
      </nav>
    </header>
  );
}
