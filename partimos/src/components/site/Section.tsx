import type { ReactNode } from "react";

/**
 * Deux tons, et deux seulement : `light` sur fond blanc ou niebla, `dark` sur
 * fond asphalte. Le ton est une propriété explicite plutôt qu'une classe
 * ajoutée à l'appel — deux classes de couleur sur le même élément se
 * départagent par l'ordre de la feuille de style, pas par l'intention, et
 * c'est comme ça qu'un texte finit gris foncé sur fond gris foncé.
 */
export type Tone = "light" | "dark";

/** Conteneur unique du site : 1120 px, gouttière de 20 px. */
export function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-[1120px] px-5 ${className}`}>
      {children}
    </div>
  );
}

type SectionProps = {
  id?: string;
  children: ReactNode;
  /** Marque la section comme une « parada » du ruban d'asphalte. */
  stop?: boolean;
  /** Couleur de l'anneau du point d'arrêt : il doit disparaître dans le fond. */
  stopRing?: string;
  className?: string;
  /** Décale le contenu pour laisser passer le ruban sur grand écran. */
  inset?: boolean;
  /** Apparition à l'entrée dans le champ. À couper au-dessus de la ligne de
   *  flottaison, où il n'y a rien à révéler. */
  reveal?: boolean;
};

export function Section({
  id,
  children,
  stop = false,
  stopRing = "#fff",
  className = "",
  inset = true,
  reveal = true,
}: SectionProps) {
  return (
    <section id={id} className={`relative py-16 md:py-[76px] ${className}`}>
      <Container>
        <div
          className={[
            "relative z-[2]",
            stop && "parada",
            inset && "pl-[var(--rail-gutter)]",
            reveal && "reveal",
          ]
            .filter(Boolean)
            .join(" ")}
          style={
            stop
              ? ({ "--stop-ring": stopRing } as React.CSSProperties)
              : undefined
          }
        >
          {children}
        </div>
      </Container>
    </section>
  );
}

/* Le sur-titre de section a été retiré du système, pas seulement de ses
   appels : le titre porte son propre poids, et un libellé en capitales
   au-dessus de lui n'ajoute qu'une ligne à lire avant la vraie. Laisser le
   composant en place aurait garanti son retour au premier ajout de section. */

export function SectionTitle({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={`mb-3.5 max-w-[17ch] text-[clamp(28px,5.2vw,44px)] leading-[1.05] font-extrabold ${className}`}
    >
      {children}
    </h2>
  );
}

export function Lead({
  children,
  tone = "light",
  className = "",
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <p
      className={`max-w-[54ch] text-[17px] leading-relaxed ${tone === "dark" ? "text-plate-300" : "text-plate-600"} ${className}`}
    >
      {children}
    </p>
  );
}
