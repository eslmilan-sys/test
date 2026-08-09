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

const BASE =
  "inline-flex items-center justify-center gap-2 font-display font-bold tracking-[-0.01em] " +
  "rounded-[14px] transition-[transform,background-color,border-color,box-shadow] duration-150 " +
  "active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none select-none";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-ink-900 text-white shadow-[0_6px_18px_-8px_rgb(14_42_53/0.55)] hover:bg-ink-800 hover:-translate-y-px",
  secondary:
    "bg-white text-ink-900 border-[1.5px] border-ink-200 hover:border-accent hover:text-accent-ink",
  onDark:
    "bg-white text-ink-900 shadow-[0_8px_24px_-10px_rgb(0_0_0/0.6)] hover:bg-ink-50 hover:-translate-y-px",
};

const SIZES: Record<Size, string> = {
  sm: "px-4 py-2.5 text-[14.5px] rounded-[11px]",
  md: "px-5.5 py-3.5 text-[16px]",
  lg: "px-7 py-4 text-[17px]",
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
      {...rest}
    >
      {children}
    </Link>
  );
}
