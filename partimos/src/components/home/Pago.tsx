import {
  Section,
  Eyebrow,
  SectionTitle,
  Lead,
} from "@/components/site/Section";
import { Icon } from "@/components/ui/Icon";

/**
 * La section la plus importante du site : elle explique que la plateforme ne
 * touche jamais l'argent (R2). Tout le reste du modèle en découle.
 */
export function Pago() {
  return (
    <Section
      id="pago"
      stop
      stopRing="#0E2A35"
      className="bg-ink-900 text-white"
    >
      <Eyebrow tone="dark">El pago</Eyebrow>
      <SectionTitle className="max-w-[18ch]">
        Le pagas a la persona, no a una app
      </SectionTitle>
      <Lead tone="dark">
        Partimos no cobra, no retiene y no toca tu plata en ningún momento. El
        aporte va directo de tu mano a la del conductor.
      </Lead>

      <div className="mt-9 grid items-stretch gap-3.5 min-[860px]:grid-cols-[1fr_210px_1fr] min-[860px]:gap-0">
        <div className="rounded-[20px] border border-white/14 bg-white/6 p-6 text-center">
          <span className="brand-gradient mx-auto mb-3.5 flex size-14 items-center justify-center rounded-full font-display text-[21px] font-bold text-white">
            Tú
          </span>
          <h3 className="mb-1.5 font-display text-lg font-bold">Pasajero</h3>
          <p className="text-sm text-ink-300">
            Reservas tu puesto en la app. No pagas nada ahí.
          </p>
        </div>

        <div
          aria-hidden
          className="flex flex-col items-center justify-center gap-2.5 px-2.5 py-3.5"
        >
          <span className="text-center text-[11.5px] font-bold tracking-[0.11em] text-brand-green uppercase">
            Efectivo o Yappy
          </span>
          <span className="flex w-full items-center justify-center max-[859px]:h-13 max-[859px]:flex-col max-[859px]:w-auto">
            <i className="h-[3px] flex-1 rounded-sm bg-[repeating-linear-gradient(90deg,var(--color-brand-green)_0_10px,transparent_10px_20px)] max-[859px]:h-full max-[859px]:w-[3px] max-[859px]:flex-none max-[859px]:bg-[repeating-linear-gradient(180deg,var(--color-brand-green)_0_10px,transparent_10px_20px)]" />
            <i className="size-0 shrink-0 border-y-[6px] border-l-[9px] border-y-transparent border-l-brand-green max-[859px]:border-x-[6px] max-[859px]:border-y-0 max-[859px]:border-t-[9px] max-[859px]:border-x-transparent max-[859px]:border-t-brand-green max-[859px]:border-l-0" />
          </span>
        </div>

        <div className="rounded-[20px] border border-white/14 bg-white/6 p-6 text-center">
          <span className="brand-gradient mx-auto mb-3.5 flex size-14 items-center justify-center rounded-full font-display text-[21px] font-bold text-white">
            A
          </span>
          <h3 className="mb-1.5 font-display text-lg font-bold">Conductor</h3>
          <p className="text-sm text-ink-300">
            Recibe el aporte completo. Sin comisiones, sin descuentos.
          </p>
        </div>
      </div>

      <ul className="mt-3.5 flex flex-wrap justify-center gap-2.5">
        <li className="flex items-center gap-2 rounded-[11px] bg-white/9 px-3.5 py-2.5 text-[13.5px] font-semibold">
          <Icon name="cash" className="size-4.5 text-ink-300" />
          Efectivo el día del viaje
        </li>
        <li className="flex items-center gap-2 rounded-[11px] bg-white/9 px-3.5 py-2.5 text-[13.5px] font-semibold">
          <span
            aria-hidden
            className="flex size-4.5 items-center justify-center rounded-[6px] bg-white/15 text-[10px] font-extrabold"
          >
            Y
          </span>
          Yappy directo a su número
        </li>
      </ul>

      {/* Deux encarts, deux registres : ce qui se passe / ce qui ne se passe
          jamais. Le second est le seul endroit du site où le corail apparaît. */}
      <div className="mt-6.5 grid gap-3.5 md:grid-cols-2">
        <div className="flex items-start gap-3.5 rounded-[18px] border border-white/14 bg-white/6 px-5.5 py-5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-white/12">
            <Icon name="phone" className="size-4.5" />
          </span>
          <div>
            <h3 className="mb-1.5 font-display text-[17px] font-bold">
              El número del conductor aparece al reservar
            </h3>
            <p className="text-[14.5px] leading-relaxed text-ink-300">
              Para coordinar el punto exacto y el pago, necesitas hablar con la
              persona. Por eso su número se desbloquea apenas confirmas tu
              puesto — antes no, para que nadie reciba llamadas de quien no va a
              viajar con él.
            </p>
            <span className="tnum mt-2.5 inline-flex items-center gap-2 rounded-[9px] bg-white/10 px-3 py-1.5 text-[13.5px] font-semibold">
              Ana M. · +507 6XXX-4471
            </span>
          </div>
        </div>

        <div className="flex items-start gap-3.5 rounded-[18px] border border-danger/30 bg-danger/10 px-5.5 py-5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-danger/20 text-[#FF9C90]">
            <Icon name="cross" className="size-4" />
          </span>
          <div>
            <h3 className="mb-1.5 font-display text-[17px] font-bold">
              No pedimos tarjeta de crédito
            </h3>
            <p className="text-[14.5px] leading-relaxed text-ink-300">
              Nunca. No guardamos datos bancarios porque no manejamos pagos. Si
              alguna vez una página te pide tarjeta a nombre de Partimos, no es
              nuestra.
            </p>
          </div>
        </div>
      </div>
    </Section>
  );
}
