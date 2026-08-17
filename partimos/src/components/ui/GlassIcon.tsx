import { Icon, type IconName } from "./Icon";

/**
 * ICÔNE EN VERRE — la signature du glassmorphisme de référence.
 *
 * Deux gouttes de couleur vive vivent DERRIÈRE une tuile de verre dépoli.
 * Là où la tuile les recouvre, son `backdrop-blur` les fond en lumière ;
 * là où elles dépassent, elles restent nettes. C'est ce contraste
 * net/flouté sur le même objet qui fait « verre » — pas la transparence
 * seule.
 *
 * Les couleurs sont celles du site (ambre, ciel, vert lima), jamais les
 * violets des maquettes d'inspiration : on emprunte la TECHNIQUE, pas la
 * palette. Chaque ton appaire sa couleur à une voisine pour la variété
 * sans casser l'harmonie.
 *
 * Toujours `aria-hidden` : l'icône décore un titre qui porte déjà le
 * sens. Un lecteur d'écran n'a rien à faire de deux gouttes floutées.
 */

export type GlassTone = "amber" | "tostado" | "green" | "naranja";

/** UN rectangle de couleur, incliné, à moitié sous le verre — le même
 *  geste que le grand carré ambre de la carte de recherche, en petit.
 *  Un seul objet par icône : le motif vaut par sa rareté. */
/* TROIS POSITIONS SUR LA MÊME RAMPE, ET LE VERT DE LA MARQUE.
   ─────────────────────────────────────────────────────────────────────
   Il y avait un ton `sky` — un dégradé bleu ciel — au milieu d'une liste
   de cartes d'un produit orange. Il servait à varier, et c'est un bon
   réflexe : trois cartes du même bleu se lisent comme une seule. Mais on
   ne varie pas en changeant de FAMILLE, on varie en se déplaçant DANS la
   sienne. Trois positions bien écartées sur la rampe donnent la même
   variété sans donner l'impression que deux produits se sont mélangés.

   Le vert reste, et lui seul est hors rampe : il ne décore pas, il dit
   « vérifié ». Une couleur qui porte un sens n'est pas interchangeable. */
const RECT: Record<GlassTone, string> = {
  /* Le jaune du matin — le plus clair, celui qui accroche le moins. */
  amber:
    "bg-[linear-gradient(135deg,var(--color-sol-200),var(--color-sol-400)_62%,var(--color-sol-600))]",
  /* L'orange de la maison — celui de la marque et des actions. */
  naranja:
    "bg-[linear-gradient(135deg,var(--color-sol-300),var(--color-sol-500)_62%,var(--color-sol-700))]",
  /* Le brûlé du soir — le plus profond, pour ce qui doit peser. */
  tostado:
    "bg-[linear-gradient(135deg,var(--color-sol-400),var(--color-sol-600)_62%,var(--color-sol-900))]",
  green: "bg-[linear-gradient(135deg,#d9f99d,#84cc16_62%,#4d7c0f)]",
};

export function GlassIcon({
  name,
  tone = "amber",
  size = "md",
  className = "",
}: {
  name: IconName;
  tone?: GlassTone;
  size?: "sm" | "md";
  className?: string;
}) {
  const box = size === "sm" ? "size-10" : "size-12";
  const glyph = size === "sm" ? "size-[18px]" : "size-[22px]";
  const rect = `${size === "sm" ? "size-7" : "size-8"} rounded-[10px]`;
  return (
    <span
      aria-hidden
      className={`relative inline-flex shrink-0 ${box} ${className}`}
    >
      <span
        className={`absolute -top-2 -left-2.5 rotate-[10deg] ${rect} ${RECT[tone]} opacity-90`}
      />
      <span className="relative z-[1] flex flex-1 items-center justify-center rounded-[14px] border border-white/60 bg-white/30 shadow-[inset_1px_1px_1px_rgb(255_255_255/0.65),0_10px_22px_-10px_rgb(23_56_76/0.25)] backdrop-blur-[7px] backdrop-saturate-150">
        <Icon name={name} className={`${glyph} text-ink-800`} />
      </span>
    </span>
  );
}
