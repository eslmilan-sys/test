import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

/**
 * Boutons — trois variantes, pas plus.
 *
 * L'action principale est de l'ENCRE, pas de la couleur : un aplat d'asphalte
 * sur fond clair, du blanc sur fond sombre. C'est le contraste le plus élevé
 * possible, et cela libère le bleu pour signaler ce qui est cliquable ailleurs.
 * Le dégradé de marque ne sert jamais de fond de bouton — répété six fois sur
 * une page, il cesse d'être une signature et devient du bruit.
 */

type Variant = "primary" | "secondary" | "onDark";
type Size = "sm" | "md" | "lg";

/**
 * `inline-flex` est posé ici, donc passer `hidden` par `className` NE MARCHE
 * PAS : les deux utilitaires visent `display`, et c'est l'ordre de la feuille
 * de style qui tranche, pas l'ordre des classes. Pour masquer un bouton selon
 * la taille d'écran, envelopper l'appel dans un élément qui porte la règle.
 * `whitespace-nowrap` garantit qu'un libellé ne passe jamais sur deux lignes.
 */
/**
 * Les boutons appartiennent au monde de la planche : angles vifs, bordure
 * franche, aucune ombre portée. Un bouton flottant à coins arrondis dans une
 * interface qui n'a plus un seul rayon serait le composant d'origine resté
 * en place — c'est exactement ce que cette refonte remplace.
 *
 * L'ocre porte l'action principale, et rien d'autre : c'est la clé de lecture
 * du système. La bordure de 2 px est ce qui donne la présence que l'ombre
 * donnait avant.
 */
const BASE =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-bold " +
  "border-2 transition-[background-color,border-color,color] duration-150 " +
  "disabled:opacity-50 disabled:pointer-events-none select-none";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-ochre-400 border-ochre-400 text-plate-950 hover:bg-ochre-300 hover:border-ochre-300",
  secondary:
    "bg-transparent border-plate-300 text-plate-900 hover:border-ochre-500 hover:text-ochre-700",
  onDark:
    "bg-ochre-400 border-ochre-400 text-plate-950 hover:bg-ochre-300 hover:border-ochre-300",
};

const SIZES: Record<Size, string> = {
  sm: "px-4 py-2 text-[14.5px]",
  md: "px-5.5 py-3 text-[16px]",
  lg: "px-7 py-3.5 text-[17px]",
};

type BaseProps = {
  variant?: Variant;
  size?: Size;
  full?: boolean;
  children: ReactNode;
  className?: string;
};

function classes({
  variant = "primary",
  size = "md",
  full,
  className,
}: BaseProps) {
  return [BASE, VARIANTS[variant], SIZES[size], full && "w-full", className]
    .filter(Boolean)
    .join(" ");
}

export function Button({
  variant,
  size,
  full,
  className,
  children,
  ...rest
}: BaseProps & Omit<ComponentProps<"button">, "className" | "children">) {
  return (
    <button
      className={classes({ variant, size, full, className, children })}
      style={{ fontStretch: "112%" }}
      {...rest}
    >
      {children}
    </button>
  );
}

export function ButtonLink({
  variant,
  size,
  full,
  className,
  children,
  href,
  ...rest
}: BaseProps & Omit<ComponentProps<typeof Link>, "className" | "children">) {
  return (
    <Link
      href={href}
      className={classes({ variant, size, full, className, children })}
      style={{ fontStretch: "112%" }}
      {...rest}
    >
      {children}
    </Link>
  );
}
