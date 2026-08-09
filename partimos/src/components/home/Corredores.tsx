import Link from "next/link";
import { Container } from "@/components/site/Section";
import { Icon } from "@/components/ui/Icon";
import { CORRIDORS, corridorCap } from "@/lib/corridors";
import { formatDuration, formatUsd } from "@/lib/pricing";

/**
 * LES CORRIDORS — un tableau, pas une grille de cartes.
 *
 * L'ancienne version alignait six cartes identiques icône + titre + texte.
 * L'utilisateur l'a trouvée laide deux fois, et il avait raison : c'est la
 * structure de page par défaut, celle qui ne décide de rien. Un tableau, lui,
 * fait un vrai travail — il rend les six routes COMPARABLES d'un coup d'œil,
 * ce qui est exactement la question qu'on se pose ici.
 *
 * C'est aussi la structure d'une planche : une nomenclature sous le dessin.
 *
 * La colonne « bus » est une comparaison éditoriale, jamais une base de
 * tarif. Le plafond ne se calcule pas à partir d'elle et n'en dépend pas.
 */
export function Corredores() {
  const rows = [...CORRIDORS].sort((a, b) => a.distanceKm - b.distanceKm);

  return (
    <section className="border-b border-plate-200 py-14 sm:py-20">
      <Container>
        <div className="mb-8 max-w-[54ch]">
          <h2 className="text-[clamp(26px,3.6vw,36px)] leading-tight">
            Las seis rutas abiertas
          </h2>
          <p className="mt-3 text-[15.5px] leading-relaxed text-plate-600">
            El tope está calculado con un carro estándar y tres puestos. Menos
            puestos suben el tope, porque hay menos gente entre quien repartir
            el mismo costo.
          </p>
        </div>

        {/* Défilement horizontal contenu : c'est le tableau qui déborde sur
            petit écran, jamais la page. */}
        <div className="-mx-5 overflow-x-auto px-5">
          <table className="w-full min-w-[680px] border-collapse text-left">
            <thead>
              <tr className="border-y border-plate-300">
                <th
                  scope="col"
                  className="py-2.5 pr-4 text-[11px] font-bold tracking-[0.14em] text-plate-600 uppercase"
                >
                  Ruta
                </th>
                <th
                  scope="col"
                  className="py-2.5 pr-4 text-right text-[11px] font-bold tracking-[0.14em] text-plate-600 uppercase"
                >
                  Distancia
                </th>
                <th
                  scope="col"
                  className="py-2.5 pr-4 text-right text-[11px] font-bold tracking-[0.14em] text-plate-600 uppercase"
                >
                  En carretera
                </th>
                <th
                  scope="col"
                  className="py-2.5 pr-4 text-right text-[11px] font-bold tracking-[0.14em] text-plate-600 uppercase"
                >
                  Aporte máx.
                </th>
                <th
                  scope="col"
                  className="py-2.5 text-right text-[11px] font-bold tracking-[0.14em] text-plate-600 uppercase"
                >
                  Bus, de referencia
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((corridor) => {
                const cap = corridorCap(corridor);
                return (
                  <tr
                    key={corridor.slug}
                    className="border-b border-plate-200 transition-colors hover:bg-plate-100"
                  >
                    <th scope="row" className="py-3 pr-4 font-normal">
                      <Link
                        href={`/viajes/${corridor.slug}`}
                        className="group inline-flex items-center gap-2 text-[16px] font-bold decoration-ochre-500 hover:underline"
                        style={{ fontStretch: "112%" }}
                      >
                        {corridor.origin.shortName}
                        <Icon
                          name="arrowRight"
                          className="size-3.5 text-plate-500"
                        />
                        {corridor.destination.shortName}
                      </Link>
                    </th>
                    <td className="cote py-3 pr-4 text-right text-[14px] text-plate-600">
                      {corridor.distanceKm} km
                    </td>
                    <td className="cote py-3 pr-4 text-right text-[14px] text-plate-600">
                      {formatDuration(corridor.typicalDurationMin)}
                    </td>
                    <td className="cote py-3 pr-4 text-right text-[15px] font-bold text-ochre-600">
                      {formatUsd(cap.maxPriceCents)}
                    </td>
                    <td className="cote py-3 text-right text-[14px] text-plate-600">
                      {corridor.busPriceCents
                        ? formatUsd(corridor.busPriceCents)
                        : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-[13px] leading-relaxed text-plate-600">
          El bus está ahí para que compares, no porque fijemos precio con él.
          Casi siempre el bus sale más barato: lo que cambia es que sales
          cuando el conductor sale, y te deja donde vas, no en la terminal.
        </p>
      </Container>
    </section>
  );
}
