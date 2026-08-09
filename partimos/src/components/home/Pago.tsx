import {
  Section,
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
      className="bg-plate-900 text-white"
    >
      <SectionTitle className="max-w-[18ch]">
        Le pagas a la persona, no a una app
      </SectionTitle>
      <Lead tone="dark">
        No hay carrito, no hay checkout, no hay plata retenida. El aporte va de
        tu mano a la del conductor, el día del viaje.
      </Lead>

      <div className="mt-9 grid items-stretch gap-3.5 min-[860px]:grid-cols-[1fr_210px_1fr] min-[860px]:gap-0">
        <div className="border border-white/14 bg-white/6 p-6 text-center">
          <span className="bg-plate-800 mx-auto mb-3.5 flex size-14 items-center justify-center rounded-full text-[21px] font-bold text-white">
            Tú
          </span>
          <h3 className="mb-1.5 text-lg font-bold">Pasajero</h3>
          <p className="text-sm text-plate-300">
            Apartas tu puesto en la app. Ahí no pagas nada.
          </p>
        </div>

        <div
          aria-hidden
          className="flex flex-col items-center justify-center gap-2.5 px-2.5 py-3.5"
        >
          <span className="text-center text-[11.5px] font-bold tracking-[0.11em] text-ochre-400 uppercase">
            Efectivo o Yappy
          </span>
          {/* Le trait s'étire, la pointe non.
              La version précédente construisait la pointe avec quatre bordures
              CSS puis en redéfinissait six au point de rupture : les règles
              s'annulaient et la flèche mobile sortait déformée. Ici le trait
              est un dégradé qui s'étire tout seul, et la pointe est un carré
              SVG — un carré se pivote sans jamais se déformer. */}
          <span className="flex w-full items-center justify-center gap-0 max-[859px]:h-20 max-[859px]:w-auto max-[859px]:flex-col">
            {/* Pas de `self-stretch` : en colonne, l'axe transversal devient
                l'horizontale et le trait se décalerait de sa pointe. */}
            <i className="h-[3px] flex-1 bg-[repeating-linear-gradient(90deg,var(--color-brand-green)_0_10px,transparent_10px_20px)] max-[859px]:w-[3px] max-[859px]:flex-1 max-[859px]:bg-[repeating-linear-gradient(180deg,var(--color-brand-green)_0_10px,transparent_10px_20px)]" />
            <svg
              viewBox="0 0 12 12"
              className="size-3 shrink-0 text-ochre-400 max-[859px]:rotate-90"
              aria-hidden="true"
            >
              <path d="M2 0.5 L10 6 L2 11.5 Z" fill="currentColor" />
            </svg>
          </span>
        </div>

        <div className="border border-white/14 bg-white/6 p-6 text-center">
          <span className="bg-plate-800 mx-auto mb-3.5 flex size-14 items-center justify-center rounded-full text-[21px] font-bold text-white">
            A
          </span>
          <h3 className="mb-1.5 text-lg font-bold">Conductor</h3>
          <p className="text-sm text-plate-300">
            Recibe el aporte completo. Nadie le descuenta nada.
          </p>
        </div>
      </div>

      <ul className="mt-3.5 flex flex-wrap justify-center gap-2.5">
        <li className="flex items-center gap-2 bg-white/9 px-3.5 py-2.5 text-[13.5px] font-semibold">
          <Icon name="cash" className="size-4.5 text-plate-300" />
          Efectivo el día del viaje
        </li>
        <li className="flex items-center gap-2 bg-white/9 px-3.5 py-2.5 text-[13.5px] font-semibold">
          <span
            aria-hidden
            className="flex size-4.5 items-center justify-center bg-white/15 text-[10px] font-extrabold"
          >
            Y
          </span>
          Yappy directo a su número
        </li>
      </ul>

      {/* Deux encarts, deux registres : ce qui se passe / ce qui ne se passe
          jamais. Le second est le seul endroit du site où le corail apparaît. */}
      <div className="mt-6.5 grid gap-3.5 md:grid-cols-2">
        <div className="flex items-start gap-3.5 border border-white/14 bg-white/6 px-5.5 py-5">
          <span className="flex size-8 shrink-0 items-center justify-center bg-white/12">
            <Icon name="phone" className="size-4.5" />
          </span>
          <div>
            <h3 className="mb-1.5 text-[17px] font-bold">
              El número del conductor aparece al reservar
            </h3>
            <p className="text-[14.5px] leading-relaxed text-plate-300">
              Para coordinar el punto exacto y el pago, necesitas hablar con la
              persona. Por eso su número se desbloquea apenas confirmas tu
              puesto — antes no, para que nadie reciba llamadas de quien no va a
              viajar con él.
            </p>
            <span className="cote mt-2.5 inline-flex items-center gap-2 bg-white/10 px-3 py-1.5 text-[13.5px] font-semibold">
              Ana M. · +507 6XXX-4471
            </span>
          </div>
        </div>

        <div className="flex items-start gap-3.5 border border-danger/30 bg-danger/10 px-5.5 py-5">
          <span className="flex size-8 shrink-0 items-center justify-center bg-danger/20 text-[#FF9C90]">
            <Icon name="cross" className="size-4" />
          </span>
          <div>
            <h3 className="mb-1.5 text-[17px] font-bold">
              No pedimos tarjeta de crédito
            </h3>
            <p className="text-[14.5px] leading-relaxed text-plate-300">
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
