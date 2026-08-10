import { Section, SectionTitle, Lead } from "@/components/site/Section";
import { Icon } from "@/components/ui/Icon";
import { PayMarks } from "@/components/ui/PayMark";

/**
 * La section la plus importante du site : elle explique que la plateforme ne
 * touche jamais l'argent (R2). Tout le reste du modèle en découle.
 */
export function Pago() {
  return (
    <Section id="pago" stop stopRing="#2F4346" className="noche text-white">
      <SectionTitle className="max-w-[18ch]">
        Le pagas a la persona, no a una app
      </SectionTitle>
      <Lead tone="dark">
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
      {/* LE PLATEAU EST EN VERRE, LES MOYENS DE PAIEMENT NE LE SONT PAS.
          C'est le seul découpage qui tienne ici. Le verre a besoin d'un
          dégradé sous lui pour exister, et cette section en a un — c'est
          l'endroit du site où il travaille le mieux. Mais Yappy est une
          marque tierce : son orange doit rester sur du blanc franc, sinon il
          vire sur le brun. Donc le plateau est une vitre, et les deux puces
          sont des objets opaques POSÉS dessus. C'est exactement la façon dont
          macOS empile ses fenêtres, et c'est ce qui donne la profondeur. */}
      <div className="glass-noche mt-8 rounded-[20px] border border-white/12 px-5 py-6 sm:px-7">
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-x-3 sm:gap-x-5">
          <span className="flex size-12 items-center justify-center rounded-full bg-action font-display text-[18px] font-bold text-ink-900">
            Tú
          </span>
          {/* Le trait s'étire, la pointe non : un carré SVG pivoté ne se
              déforme jamais, contrairement à une pointe en bordures CSS. */}
          <span aria-hidden className="flex items-center">
            <i className="h-[3px] flex-1 rounded-sm bg-[repeating-linear-gradient(90deg,var(--color-action)_0_10px,transparent_10px_20px)]" />
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

        <div className="mt-5 grid gap-2 text-[14px] leading-snug text-night-200 sm:grid-cols-2 sm:gap-7">
          <p>
            <b className="font-display font-bold text-white">Pasajero</b> —
            apartas tu puesto en la app. Ahí no pagas nada.
          </p>
          <p className="sm:text-right">
            <b className="font-display font-bold text-white">Conductor</b> —
            recibe el aporte completo. Nadie le descuenta nada.
          </p>
        </div>
      </div>

      {/* Deux encarts, deux registres : ce qui se passe / ce qui ne se passe
          jamais. Le second est le seul endroit du site où le corail apparaît. */}
      <div className="mt-6.5 grid gap-3.5 md:grid-cols-2">
        <div className="glass-noche flex items-start gap-3.5 rounded-[18px] border border-white/12 px-5.5 py-5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-white/14">
            <Icon name="phone" className="size-4.5" />
          </span>
          <div>
            <h3 className="mb-1.5 font-display text-[17px] font-bold">
              El número del conductor aparece al reservar
            </h3>
            <p className="text-[14.5px] leading-relaxed text-night-200">
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

        {/* Verre aussi, mais la teinte danger reste : l'utilitaire `bg-*`
            gagne sur la couleur de fond de `.glass-noche` (couche utilities
            après base), le flou et le liseré, eux, s'appliquent. */}
        <div className="glass-noche flex items-start gap-3.5 rounded-[18px] border border-danger/30 bg-danger/10 px-5.5 py-5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-danger/20 text-[#FF9C90]">
            <Icon name="cross" className="size-4" />
          </span>
          <div>
            <h3 className="mb-1.5 font-display text-[17px] font-bold">
              No pedimos tarjeta de crédito
            </h3>
            <p className="text-[14.5px] leading-relaxed text-night-200">
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
