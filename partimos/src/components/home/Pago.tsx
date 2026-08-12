import { Section, SectionTitle, Lead } from "@/components/site/Section";
import { Icon } from "@/components/ui/Icon";
import { PayMarks } from "@/components/ui/PayMark";

/**
 * La section la plus importante du site : elle explique que la plateforme ne
 * touche jamais l'argent (R2). Tout le reste du modèle en découle.
 */
export function Pago() {
  return (
    <Section id="pago">
      <SectionTitle className="max-w-[18ch]">
        Le pagas a la persona — en la mano o por la app
      </SectionTitle>
      <Lead>
        No hay carrito, no hay checkout, no hay plata retenida. El aporte va de
        tu mano a la del conductor, el día del viaje.
      </Lead>

      {/* UN SEUL BLOC, PAS TROIS.
          La version précédente empilait une carte « Pasajero », une flèche
          verticale de 80 px et une carte « Conductor », puis les moyens de
          paiement dessous : trois blocs pour une seule idée, et sur téléphone
          la flèche mangeait à elle seule un quart d'écran. Ici le geste tient
          en une ligne — de ta main à la sienne — et ce qui circule dessus est
          posé juste en dessous. Le trait est ambre comme partout ailleurs sur
          le site : le vert de marque ne sert qu'au logo. */}
      {/* Section CLAIRE : une seule nuit par page (Historias), sinon tunnel.
          Le verre reste où il a un dégradé à flouter — pas ici. */}
      <div className="mt-8 rounded-[20px] border border-ink-200 bg-white px-5 py-6 shadow-card sm:px-7">
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-x-3 sm:gap-x-5">
          <span className="flex size-12 items-center justify-center rounded-full bg-action font-display text-[18px] font-bold text-ink-900">
            Tú
          </span>
          {/* Le trait s'étire, la pointe non : un carré SVG pivoté ne se
              déforme jamais, contrairement à une pointe en bordures CSS. */}
          <span aria-hidden className="flex items-center">
            <i className="flujo-aporte h-[3px] flex-1 rounded-sm bg-[repeating-linear-gradient(90deg,var(--color-action)_0_10px,transparent_10px_20px)]" />
            <svg
              viewBox="0 0 12 12"
              className="size-3 shrink-0 text-action"
              aria-hidden="true"
            >
              <path d="M2 0.5 L10 6 L2 11.5 Z" fill="currentColor" />
            </svg>
          </span>
          <span className="flex size-12 items-center justify-center rounded-full bg-action font-display text-[18px] font-bold text-ink-900">
            A
          </span>
        </div>

        {/* Ce qui circule sur le trait, posé sur le trait. */}
        <div className="mt-5">
          <PayMarks />
        </div>

        <div className="mt-5 grid gap-2 text-[14px] leading-snug text-ink-500 sm:grid-cols-2 sm:gap-7">
          <p>
            <b className="font-display font-bold text-ink-900">Pasajero</b> —
            apartas tu puesto en la app. Ahí no pagas nada.
          </p>
          <p className="sm:text-right">
            <b className="font-display font-bold text-ink-900">Conductor</b> —
            recibe el aporte completo. Nadie le descuenta nada.
          </p>
        </div>
      </div>

      {/* Deux encarts, deux registres : ce qui se passe / ce qui ne se passe
          jamais. Le second est le seul endroit du site où le corail apparaît. */}
      <div className="mt-6.5 grid gap-3.5 md:grid-cols-2">
        <div className="flex items-start gap-3.5 rounded-[18px] border border-ink-200 bg-white px-5.5 py-5 shadow-card">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-ink-100">
            <Icon name="phone" className="size-4.5" />
          </span>
          <div>
            <h3 className="mb-1.5 font-display text-[17px] font-bold">
              El número del conductor aparece al reservar
            </h3>
            <p className="text-[14.5px] leading-relaxed text-ink-500">
              Para coordinar el punto exacto y el pago, necesitas hablar con la
              persona. Por eso su número se desbloquea apenas confirmas tu
              puesto — antes no, para que nadie reciba llamadas de quien no va a
              viajar con él.
            </p>
            <span className="tnum mt-2.5 inline-flex items-center gap-2 rounded-[9px] bg-ink-100 px-3 py-1.5 text-[13.5px] font-semibold">
              Ana M. · +507 6XXX-4471
            </span>
          </div>
        </div>

        <div className="flex items-start gap-3.5 rounded-[18px] border border-danger/30 bg-danger-soft px-5.5 py-5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-danger/15 text-danger">
            <Icon name="cross" className="size-4" />
          </span>
          <div>
            <h3 className="mb-1.5 font-display text-[17px] font-bold">
              No pedimos tarjeta de crédito
            </h3>
            <p className="text-[14.5px] leading-relaxed text-ink-500">
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
