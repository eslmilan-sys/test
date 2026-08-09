import Link from "next/link";

/**
 * La marque : goutte + point de rendez-vous.
 *
 * La FORME est un engagement : le pin ne change pas. Sa couleur, elle, suivait
 * l'ancienne palette bleu-vert et n'engageait rien — elle passe donc à la clé
 * du monde, l'ocre de la Culebra, comme tout ce qui marque une action ou un
 * point choisi. C'est le seul objet rond d'une interface qui n'a plus aucun
 * rayon ailleurs, et c'est ce qui le fait lire comme une marque plutôt que
 * comme un composant.
 *
 * Le mot-symbole est en Archivo dilaté, jamais en mono : le monospace de ce
 * système est la fonte des quantités mesurées, et « Partimos » n'en est pas
 * une.
 */
export function LogoMark({
  className = "h-[30px] w-[25px]",
  tone = "key",
  dotColor,
}: {
  className?: string;
  /** `key` sur fond sombre ou clair ; `ink` pour les surfaces monochromes. */
  tone?: "key" | "ink";
  dotColor?: string;
}) {
  const fill =
    tone === "key" ? "var(--color-ochre-400)" : "var(--color-plate-900)";
  return (
    <svg viewBox="0 0 100 120" className={className} aria-hidden="true">
      <path
        d="M50 3C26 3 7 22 7 46c0 32 43 71 43 71s43-39 43-71C93 22 74 3 50 3z"
        fill={fill}
      />
      <circle
        cx="50"
        cy="43"
        r="15"
        fill={dotColor ?? "var(--color-plate-900)"}
      />
    </svg>
  );
}

export function Logo({
  tone,
  dotColor,
  className = "",
}: {
  tone?: "key" | "ink";
  dotColor?: string;
  className?: string;
}) {
  return (
    <Link
      href="/"
      className={`flex shrink-0 items-center gap-2.5 ${className}`}
      aria-label="Partimos — inicio"
    >
      <LogoMark tone={tone} dotColor={dotColor} />
      <span
        className="text-[21px] font-extrabold"
        style={{ fontStretch: "112%" }}
      >
        Partimos
      </span>
    </Link>
  );
}
