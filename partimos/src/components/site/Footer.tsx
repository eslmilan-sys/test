import Link from "next/link";
import { CORRIDORS } from "@/lib/corridors";
import { LEGAL_FOOTER } from "@/lib/content";
import { LogoMark } from "./Logo";

const COLUMNS = [
  {
    title: "Viajar",
    links: [
      { href: "/#buscar", label: "Buscar un viaje" },
      { href: "/viajes", label: "Todas las rutas" },
      { href: "/seguridad", label: "Seguridad" },
    ],
  },
  {
    title: "Manejar",
    links: [
      { href: "/publicar", label: "Publicar un viaje" },
      { href: "/publicar#calculadora", label: "Calcular el aporte" },
      { href: "/ayuda", label: "Preguntas frecuentes" },
    ],
  },
  {
    title: "Partimos",
    links: [
      { href: "/ayuda#contacto", label: "Contacto" },
      { href: "/terminos", label: "Términos de uso" },
      { href: "/privacidad", label: "Aviso de privacidad" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-5 bg-ink-900 pt-13 pb-8 text-ink-400">
      <div className="mx-auto w-full max-w-[1120px] px-5">
        <div className="mb-9 grid gap-8 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <div>
            <Link
              href="/"
              className="flex items-center gap-2.5"
              aria-label="Partimos — inicio"
            >
              <LogoMark gradientId="brand-footer" dotColor="#0E2A35" />
              <span className="brand-gradient-text font-display text-[22px] font-extrabold tracking-[-0.03em]">
                Partimos
              </span>
            </Link>
            <p className="mt-3.5 max-w-[32ch] text-sm leading-relaxed">
              Viajes compartidos entre particulares en Panamá. Alguien ya va
              para allá.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h2 className="mb-3.5 font-display text-sm font-bold text-white">
                {col.title}
              </h2>
              <ul>
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="block py-1 text-sm transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Maillage interne : chaque page pointe vers tous les corridors.
            C'est ce qui fait remonter les pages SEO les unes les autres. */}
        <nav aria-label="Rutas" className="mb-8 border-t border-white/10 pt-7">
          <h2 className="mb-3 font-display text-sm font-bold text-white">
            Rutas populares
          </h2>
          <ul className="flex flex-wrap gap-x-5 gap-y-1.5">
            {CORRIDORS.map((corridor) => (
              <li key={corridor.slug}>
                <Link
                  href={`/viajes/${corridor.slug}`}
                  className="text-[13.5px] transition-colors hover:text-white"
                >
                  {corridor.origin.shortName} → {corridor.destination.shortName}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Mention légale obligatoire sur toutes les pages (§8 du brief). */}
        <div className="flex flex-wrap items-start justify-between gap-5 border-t border-white/12 pt-6">
          <p className="max-w-[70ch] text-[12.5px] leading-relaxed text-ink-400">
            {LEGAL_FOOTER}
          </p>
          <span className="text-[12.5px] whitespace-nowrap">
            © {new Date().getFullYear()} Partimos · Panamá
          </span>
        </div>
      </div>
    </footer>
  );
}
