import { SearchCard } from "./SearchCard";
import { LiveStrip } from "./LiveStrip";

const PROOF = [
  { title: "Salen de tu barrio", detail: "No de una terminal a las 4 a.m." },
  { title: "Sabes quién maneja", detail: "Cédula y celular verificados" },
  { title: "Le pagas a la persona", detail: "Efectivo o Yappy, nunca tarjeta" },
  { title: "Reservar no cuesta", detail: "Partimos no cobra comisión" },
];

export function Hero() {
  return (
    <div className="relative overflow-hidden bg-ink-900 pt-8 text-white md:pt-11">
      {/* Deux halos très dilués : ils donnent de la profondeur au bloc sombre
          sans introduire de nouvelle couleur. Purement décoratifs. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -right-35 size-[520px] rounded-full bg-[radial-gradient(circle,rgb(32_168_248/0.26),transparent_66%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-55 -left-40 size-[560px] rounded-full bg-[radial-gradient(circle,rgb(160_216_56/0.16),transparent_66%)]"
      />

      <div className="relative z-[2] mx-auto w-full max-w-[1120px] px-5">
        <div className="grid gap-7 min-[960px]:grid-cols-[1.04fr_0.94fr] min-[960px]:items-start min-[960px]:gap-x-13 min-[960px]:gap-y-5">
          <div className="min-[960px]:col-start-1 min-[960px]:row-start-1">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-green/30 bg-brand-green/15 px-3.5 py-1.5 text-xs font-semibold text-brand-green">
              <span
                aria-hidden
                className="size-1.75 animate-pulse rounded-full bg-brand-green"
              />
              34 viajes publicados para este viernes
            </p>
            <h1 className="mb-3.5 text-[clamp(36px,7.8vw,68px)] leading-[0.98] font-extrabold tracking-[-0.045em]">
              Alguien ya va
              <br />
              <em className="brand-gradient-text not-italic">para allá.</em>
            </h1>
            <p className="max-w-[42ch] text-[16.5px] leading-relaxed text-ink-300 md:text-[17.5px]">
              El viernes hay alguien saliendo a tu pueblo con puestos vacíos.
              Solo falta que se enteren.
            </p>
          </div>

          <ul className="grid grid-cols-2 gap-x-5 gap-y-3.5 border-t border-white/12 pt-5.5 min-[960px]:col-start-1 min-[960px]:row-start-2">
            {PROOF.map((item) => (
              <li key={item.title}>
                <b className="mb-0.5 block font-display text-base font-bold tracking-[-0.02em] md:text-[19px]">
                  {item.title}
                </b>
                <span className="text-[12.5px] leading-snug text-ink-400">
                  {item.detail}
                </span>
              </li>
            ))}
          </ul>

          <div
            id="buscar"
            className="scroll-mt-24 min-[960px]:col-start-2 min-[960px]:row-span-2 min-[960px]:row-start-1 min-[960px]:self-center"
          >
            <SearchCard />
          </div>
        </div>

        <LiveStrip />
      </div>
    </div>
  );
}
