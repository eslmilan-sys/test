/**
 * LES DEUX MOYENS DE PAIEMENT
 *
 * Le paiement se fait hors plateforme, en espèces ou par Yappy. Ces deux
 * marques sont donc de l'information de premier plan, pas de la décoration :
 * c'est la réponse à « et je paie comment, concrètement ? ».
 *
 * ── SUR LE LOGO YAPPY ─────────────────────────────────────────────────────
 * Yappy est une marque déposée de Banco General. Je ne l'ai pas dessinée, et
 * je ne l'invente pas : un logo approximatif est une contrefaçon maladroite,
 * pas un placeholder.
 *
 * Ce composant pose donc le NOM en toutes lettres, ce qui est un usage
 * nominatif parfaitement légitime — on a le droit de dire qu'on accepte
 * Yappy. Le jour où tu as le fichier officiel :
 *
 *   1. dépose-le dans `public/marks/yappy.svg` ;
 *   2. remplace le contenu de `<YappyMark>` par
 *      `<img src={asset("/marks/yappy.svg")} alt="Yappy" className="h-4" />`.
 *
 * Banco General fournit ses actifs de marque sur demande. Ne récupère pas le
 * fichier depuis une page web au hasard : les conditions d'usage comptent
 * autant que le fichier.
 */

/** Un billet et une pièce. Aucune marque, donc dessinable sans réserve. */
export function CashMark({ className = "size-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Le billet, légèrement en retrait pour laisser voir la pièce. */}
      <rect x="1.8" y="6.4" width="16.4" height="10.6" rx="2" />
      <circle cx="10" cy="11.7" r="2.4" />
      <path d="M5.2 11.7h.01M14.8 11.7h.01" />
      {/* La pièce derrière : c'est elle qui fait lire « efectivo » plutôt que
          « carte » — un rectangle seul se lit comme une carte bancaire. */}
      <circle cx="18.6" cy="15.4" r="3.6" />
      <path d="M18.6 13.9v3M17.7 14.7h1.6M17.9 16.1h1.6" strokeWidth={1.5} />
    </svg>
  );
}

/**
 * Le mot-symbole Yappy.
 *
 * Composé dans la police de titre, à la graisse maximale : c'est ce qui le
 * fait lire comme un NOM DE MARQUE et non comme un mot de la phrase, sans
 * prétendre reproduire le logo officiel.
 */
export function YappyMark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`font-display text-[15px] leading-none font-extrabold tracking-[-0.03em] ${className}`}
    >
      Yappy
    </span>
  );
}

/**
 * La paire, telle qu'elle s'affiche partout où l'on explique le paiement.
 * `tone` suit la surface : `dark` sur la section paiement, `light` ailleurs.
 */
export function PayMarks({ tone = "light" }: { tone?: "light" | "dark" }) {
  const chip =
    tone === "dark"
      ? "border-white/18 bg-white/8 text-white"
      : "border-ink-200 bg-white text-ink-900";
  const muted = tone === "dark" ? "text-ink-300" : "text-ink-500";

  return (
    <ul className="flex flex-wrap justify-center gap-2.5">
      <li
        className={`flex items-center gap-2.5 rounded-[12px] border px-3.5 py-2.5 ${chip}`}
      >
        <CashMark className={`size-5 shrink-0 ${muted}`} />
        <span className="text-[13.5px] font-semibold">
          Efectivo el día del viaje
        </span>
      </li>
      <li
        className={`flex items-center gap-2.5 rounded-[12px] border px-3.5 py-2.5 ${chip}`}
      >
        <YappyMark />
        <span className={`text-[13.5px] font-semibold ${muted}`}>
          directo a su número
        </span>
      </li>
    </ul>
  );
}
