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

export type GlassTone = "amber" | "sky" | "green";

const DROP: Record<GlassTone, string> = {
  amber: "bg-[radial-gradient(circle_at_32%_30%,#fde68a,#f59e0b_72%)]",
  sky: "bg-[radial-gradient(circle_at_32%_30%,#bae6fd,#0284c7_78%)]",
  green: "bg-[radial-gradient(circle_at_32%_30%,#d9f99d,#4d7c0f_80%)]",
};

/** La goutte secondaire répond à la principale — couleur voisine. */
const PAIR: Record<GlassTone, GlassTone> = {
  amber: "sky",
  sky: "green",
  green: "amber",
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
  return (
    <span
      aria-hidden
      className={`relative inline-flex shrink-0 ${box} ${className}`}
    >
      <span
        className={`absolute -top-1.5 -left-2 size-6 rounded-full ${DROP[tone]}`}
      />
      <span
        className={`absolute -right-1.5 -bottom-1 size-4 rounded-full ${DROP[PAIR[tone]]} opacity-90`}
      />
      <span className="relative z-[1] flex flex-1 items-center justify-center rounded-[14px] border border-white/60 bg-white/30 shadow-[inset_1px_1px_1px_rgb(255_255_255/0.65),0_10px_22px_-10px_rgb(23_56_76/0.25)] backdrop-blur-[7px] backdrop-saturate-150">
        <Icon name={name} className={`${glyph} text-ink-800`} />
      </span>
    </span>
  );
}
