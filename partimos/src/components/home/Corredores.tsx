import Link from "next/link";
import { Container } from "@/components/site/Section";
import { CORRIDORS, corridorCap } from "@/lib/corridors";
import { formatDuration, formatUsd } from "@/lib/pricing";

/**
 * LES SIX ROUTES — une échelle, pas un tableau.
 *
 * Le tableau à cinq colonnes obligeait à défiler vers la droite sur
 * téléphone, et les deux colonnes qui le justifiaient — l'aporte et le
 * comparatif bus — étaient précisément celles qu'on ne voyait jamais.
 *
 * Passer en cartes aurait ramené la grille de cartes identiques, déjà
 * rejetée deux fois. Deux constats ont donné la forme :
 *
 *   1. Les six corridors partent TOUS de Ciudad de Panamá. L'écrire six fois
 *      était du bruit ; on l'écrit une fois en tête et chaque ligne n'a plus
 *      qu'une destination à porter.
 *   2. Ce qu'on compare ici, c'est une distance et un aporte. Une piste de
 *      largeur FIXE, remplie proportionnellement, se compare d'un coup d'œil —
 *      un trait de longueur variable, lui, laissait une demi-ligne morte
 *      entre sa fin et le prix.
 *
 * David remplit la piste entière, Coronado un cinquième : on lit l'échelle du
 * pays sans lire un seul chiffre. Et c'est le motif du site — le même trait
 * pointillé ambre relie les trois étapes plus haut et longe le premier écran.
 * Répété, il devient une signature.
 */
export function Corredores() {
  const rows = [...CORRIDORS].sort((a, b) => a.distanceKm - b.distanceKm);
  const maxKm = Math.max(...rows.map((c) => c.distanceKm));

  return (
    <section className="border-t border-ink-200 py-14 sm:py-20">
      {/* Même décalage que les `Section` voisines : sans lui, le ruban
          d'asphalte passait au travers du texte au-dessus de 1160 px. */}
      <Container>
        <div className="relative z-[2] pl-[var(--rail-gutter)]">
          <div className="mb-8 max-w-[52ch]">
            <h2 className="font-display text-[clamp(28px,4.2vw,40px)] leading-[1.08] font-extrabold tracking-[-0.03em]">
              Las seis rutas abiertas
            </h2>
            <p className="mt-3 text-[15.5px] leading-relaxed text-ink-500">
              Todas salen de Ciudad de Panamá. El tope está calculado con un
              carro estándar y tres puestos: menos puestos suben el tope, porque
              hay menos gente entre quien repartir el mismo costo.
            </p>
          </div>

          <ul>
            {rows.map((corridor) => {
              const cap = corridorCap(corridor);
              const pct = (corridor.distanceKm / maxKm) * 100;

              return (
                <li key={corridor.slug} className="border-t border-ink-200">
                  <Link
                    href={`/viajes/${corridor.slug}`}
                    className="group grid grid-cols-[1fr_auto] items-center gap-x-6 gap-y-3 py-4 transition-colors hover:bg-ink-100/70 sm:grid-cols-[minmax(132px,1.1fr)_minmax(120px,2fr)_auto] sm:py-[18px]"
                  >
                    <span className="min-w-0">
                      <b className="block font-display text-[17px] leading-tight font-bold tracking-[-0.02em] decoration-action decoration-2 underline-offset-4 group-hover:underline">
                        {corridor.destination.shortName}
                      </b>
                      <span className="tnum mt-0.5 block text-[12.5px] text-ink-500">
                        {corridor.distanceKm} km ·{" "}
                        {formatDuration(corridor.typicalDurationMin)}
                      </span>
                    </span>

                    {/* La piste. Largeur fixe, remplissage proportionnel : les
                      six lignes se comparent sur la même règle. Ordre 3 sur
                      téléphone pour qu'elle passe sous les deux colonnes. */}
                    <span
                      aria-hidden
                      className="relative order-3 col-span-2 block h-[3px] rounded-full bg-ink-200 sm:order-none sm:col-span-1"
                    >
                      <i
                        className="absolute inset-y-0 left-0 rounded-full bg-[repeating-linear-gradient(90deg,var(--color-action)_0_8px,transparent_8px_17px)]"
                        style={{ width: `${pct}%` }}
                      />
                      <i className="absolute top-1/2 left-0 size-2.5 -translate-y-1/2 rounded-full border-2 border-ink-900 bg-ink-50" />
                      <i
                        className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-action ring-2 ring-ink-50"
                        style={{ left: `${pct}%` }}
                      />
                    </span>

                    <span className="text-right">
                      <span className="tnum block font-display text-[21px] leading-none font-extrabold tracking-[-0.03em] text-action-ink">
                        {formatUsd(cap.maxPriceCents)}
                      </span>
                      <span className="tnum mt-1 block text-[11.5px] text-ink-500">
                        aporte máx.
                        {corridor.busPriceCents
                          ? ` · bus ${formatUsd(corridor.busPriceCents)}`
                          : ""}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>

          <p className="mt-6 max-w-[62ch] border-t border-ink-200 pt-5 text-[13px] leading-relaxed text-ink-500">
            El bus está ahí para que compares, no porque fijemos precio con él.
            Casi siempre el bus sale más barato: lo que cambia es que sales
            cuando el conductor sale, y te deja donde vas, no en la terminal.
          </p>
        </div>
      </Container>
    </section>
  );
}
