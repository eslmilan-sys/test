import { SearchCard } from "./SearchCard";
import { LiveStrip } from "./LiveStrip";
import { Icon, type IconName } from "@/components/ui/Icon";

/**
 * Les quatre preuves : une icône, trois mots, une précision.
 *
 * Elles étaient quatre paragraphes en deux colonnes ; à 390 px chacun passait
 * sur deux ou trois lignes et le bloc devenait un mur. Une preuve qui demande
 * un effort de lecture ne rassure pas — on la scanne, ou elle ne sert à rien.
 * Le texte a donc été coupé à l'os et une icône porte la moitié du sens.
 */
const PROOF: { icon: IconName; title: string; detail: string }[] = [
  { icon: "pin", title: "Salen de tu barrio", detail: "No de una terminal" },
  { icon: "id", title: "Sabes quién maneja", detail: "Cédula verificada" },
  { icon: "cash", title: "Pagas en el carro", detail: "Efectivo o Yappy" },
  { icon: "check", title: "Reservar es gratis", detail: "Sin comisión" },
];

export function Hero() {
  return (
    <div className="relative overflow-hidden bg-plate-900 text-white">
      {/* Un seul halo, très dilué. Il y en avait deux, qui se croisaient au
          milieu et rendaient le fond sale au lieu de profond. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-48 -right-32 size-[620px] rounded-full bg-[radial-gradient(circle,rgb(32_168_248/0.22),transparent_64%)]"
      />

      <div className="relative z-[2] mx-auto w-full max-w-[1120px] px-5 pt-10 md:pt-16">
        <div className="grid gap-10 min-[960px]:grid-cols-[1.02fr_0.98fr] min-[960px]:items-start min-[960px]:gap-x-16 min-[960px]:gap-y-8">
          <div className="min-[960px]:col-start-1 min-[960px]:row-start-1">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-3.5 py-1.5 text-[12.5px] font-medium text-plate-300">
              <span
                aria-hidden
                className="size-1.5 animate-pulse rounded-full bg-ochre-400"
              />
              34 viajes publicados para este viernes
            </p>

            <h1 className="mb-5 text-[clamp(40px,8.6vw,72px)] leading-[0.96] font-extrabold tracking-[-0.048em]">
              Alguien ya va <br />
              <em className="cote not-italic">para allá.</em>
            </h1>

            <p className="max-w-[40ch] text-[17px] leading-[1.5] text-plate-300 md:text-[19px]">
              El viernes hay alguien saliendo a tu pueblo con puestos vacíos.
              Solo falta que se enteren.
            </p>
          </div>

          <ul className="grid grid-cols-2 border-t border-white/10 min-[960px]:col-start-1 min-[960px]:row-start-2">
            {PROOF.map((item, index) => (
              <li
                key={item.title}
                className={[
                  "py-5",
                  index % 2 === 0 ? "border-r border-white/10 pr-5" : "pl-5",
                  index > 1 ? "border-t border-white/10" : "",
                ].join(" ")}
              >
                <Icon
                  name={item.icon}
                  className="mb-2.5 size-5 text-plate-400"
                />
                <b className="block text-[15.5px] leading-tight font-bold tracking-[-0.02em] md:text-[17px]">
                  {item.title}
                </b>
                <span className="mt-1 block text-[13px] text-plate-400">
                  {item.detail}
                </span>
              </li>
            ))}
          </ul>

          <div
            id="buscar"
            className="scroll-mt-24 min-[960px]:col-start-2 min-[960px]:row-span-2 min-[960px]:row-start-1"
          >
            <SearchCard />
          </div>
        </div>

        <LiveStrip />
      </div>
    </div>
  );
}
