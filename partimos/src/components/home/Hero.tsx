import { SearchCard } from "./SearchCard";
import { LiveStrip } from "./LiveStrip";
import { Icon, type IconName } from "@/components/ui/Icon";

/**
 * LE PREMIER ÉCRAN
 *
 * Quatre décisions, chacune tirée d'une règle plutôt que d'une intuition.
 *
 * 1. LA RECHERCHE EST LE CTA. Sur une place de marché, la barre de recherche
 *    est l'action principale — pas un bouton à côté d'un argumentaire. Elle
 *    passait sous la ligne de flottaison sur téléphone, derrière les quatre
 *    preuves ; elle est maintenant juste après le titre, et les preuves
 *    viennent après. Sur grand écran elle reprend sa colonne de droite, où
 *    elle est visible de toute façon.
 *
 * 2. LE PREMIER ÉCRAN EST CLAIR. Une bande sombre en haut de page ferme la
 *    page au lieu de l'ouvrir — c'est ce qu'il y a de moins gai. Ici, du crème
 *    avec un soleil ambre en haut à droite, un reflet bleu en bas à gauche, et
 *    un grain très fin. On lit « beau temps », pas « logiciel ».
 *
 * 3. L'ENTRÉE EST CHORÉGRAPHIÉE. Une séquence décalée à l'ouverture plutôt
 *    que des effets au survol dispersés — et rien au survol sur un téléphone,
 *    justement.
 *
 * 4. LA HIÉRARCHIE SE FAIT À LA GRAISSE, pas seulement à la taille. Titre en
 *    800, texte d'accroche en 300 : l'écart se voit même en plissant les yeux,
 *    ce qui est le test.
 */
const PROOF: { icon: IconName; title: string; detail: string }[] = [
  { icon: "pin", title: "Salen de tu barrio", detail: "No de una terminal" },
  { icon: "id", title: "Sabes quién maneja", detail: "Cédula verificada" },
  { icon: "cash", title: "Pagas en el carro", detail: "Efectivo o Yappy" },
  { icon: "check", title: "Reservar es gratis", detail: "Sin comisión" },
];

export function Hero() {
  return (
    <div className="sky grain relative overflow-hidden border-b border-ink-200">
      <div className="relative z-[2] mx-auto w-full max-w-[1120px] px-5 pt-14 md:pt-24">
        <div className="flex flex-col min-[960px]:grid min-[960px]:grid-cols-[1.02fr_0.98fr] min-[960px]:items-start min-[960px]:gap-x-16 min-[960px]:gap-y-8">
          <div className="order-1 min-[960px]:col-start-1 min-[960px]:row-start-1">
            <p className="enter enter-1 mb-5 inline-flex items-center gap-2 rounded-full border border-ink-200 bg-white/70 px-3.5 py-1.5 text-[12.5px] font-semibold text-ink-600">
              <span
                aria-hidden
                className="size-1.5 animate-pulse rounded-full bg-brand-green-deep"
              />
              34 viajes publicados para este viernes
            </p>

            <h1 className="enter enter-2 mb-5 text-[clamp(40px,8.6vw,72px)] leading-[0.96] font-extrabold tracking-[-0.048em]">
              Alguien ya va <br />
              <em className="text-action-deep not-italic">para allá.</em>
            </h1>

            <p className="enter enter-2 max-w-[40ch] text-[17px] leading-[1.45] font-light text-ink-600 md:text-[20px]">
              El viernes hay alguien saliendo a tu pueblo con puestos vacíos.
              Solo falta que se enteren.
            </p>
          </div>

          {/* La recherche : deuxième sur téléphone, colonne de droite ensuite. */}
          <div
            id="buscar"
            className="enter enter-3 order-2 mt-7 scroll-mt-24 min-[960px]:col-start-2 min-[960px]:row-span-2 min-[960px]:row-start-1 min-[960px]:mt-0"
          >
            <SearchCard />
          </div>

          <ul className="enter enter-4 order-3 mt-8 grid grid-cols-2 border-t border-ink-200 min-[960px]:col-start-1 min-[960px]:row-start-2 min-[960px]:mt-0">
            {PROOF.map((item, index) => (
              <li
                key={item.title}
                className={[
                  "py-5",
                  index % 2 === 0 ? "border-r border-ink-200 pr-5" : "pl-5",
                  index > 1 ? "border-t border-ink-200" : "",
                ].join(" ")}
              >
                <Icon name={item.icon} className="mb-2.5 size-5 text-accent-ink" />
                <b className="block font-display text-[15.5px] leading-tight font-bold tracking-[-0.02em] md:text-[17px]">
                  {item.title}
                </b>
                <span className="mt-1 block text-[13px] font-light text-ink-500">
                  {item.detail}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <LiveStrip />
      </div>
    </div>
  );
}
