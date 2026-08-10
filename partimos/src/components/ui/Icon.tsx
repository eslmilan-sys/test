/**
 * Jeu d'icônes au trait — 1,9 px, `currentColor`, jamais d'émoji (§5 du brief).
 *
 * Les icônes n'ont pas de couleur propre : elles héritent de celle du texte.
 * C'est ce qui empêche l'interface de se remplir de bleus, de verts et
 * d'oranges qui ne veulent rien dire.
 */

type IconProps = {
  name: IconName;
  className?: string;
  /** Une icône décorative est masquée aux lecteurs d'écran ; une icône
   *  porteuse de sens reçoit un titre. */
  title?: string;
};

const PATHS = {
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.6-3.6" />
    </>
  ),
  chat: (
    <path d="M20 15a2 2 0 0 1-2 2H8l-4 4V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2z" />
  ),
  car: (
    <>
      <path d="M5 17h14M4 17v-4l2-5h12l2 5v4M4 17v2M20 17v2" />
      <circle cx="7.5" cy="17" r="1.6" />
      <circle cx="16.5" cy="17" r="1.6" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="16" rx="2.5" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </>
  ),
  /* Un billet SEUL se lit comme une carte bancaire — exactement ce que
     Partimos n'accepte pas. La pièce derrière lève l'ambiguïté : on lit
     « efectivo ». */
  cash: (
    <>
      <rect x="1.8" y="6.4" width="16.4" height="10.6" rx="2" />
      <circle cx="10" cy="11.7" r="2.4" />
      <path d="M5.2 11.7h.01M14.8 11.7h.01" />
      <circle cx="18.6" cy="15.4" r="3.6" />
      <path d="M18.6 13.9v3M17.7 14.7h1.6M17.9 16.1h1.6" />
    </>
  ),
  phone: (
    <>
      <rect x="6.5" y="2.5" width="11" height="19" rx="2.5" />
      <path d="M10.5 18.5h3" />
    </>
  ),
  id: (
    <>
      <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
      <circle cx="8.5" cy="11" r="2.2" />
      <path d="M5 16.2c.5-1.5 1.9-2.2 3.5-2.2s3 .7 3.5 2.2M14.5 10h4M14.5 13.5h3" />
    </>
  ),
  star: (
    <path d="M12 3.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8-5.3-2.8-5.3 2.8 1-5.8L3.5 9.7l5.9-.9z" />
  ),
  pin: (
    <>
      <path d="M12 21s7-5.7 7-11a7 7 0 1 0-14 0c0 5.3 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.6" />
    </>
  ),
  users: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-3.6 3.1-5.5 7-5.5s7 1.9 7 5.5" />
    </>
  ),
  shield: (
    <>
      <path d="M12 21s7-3.4 7-9V6l-7-3-7 3v6c0 5.6 7 9 7 9z" />
      <path d="M9.2 12l2 2 3.6-3.8" />
    </>
  ),
  route: (
    <>
      <circle cx="6" cy="6" r="2.5" />
      <circle cx="18" cy="18" r="2.5" />
      <path d="M8.5 6H15a3 3 0 0 1 0 6H9a3 3 0 0 0 0 6h6.5" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M15.5 8.5l-2 5-5 2 2-5z" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5.2l3 1.8" />
    </>
  ),
  check: <path d="M4.5 12.5l4.8 4.8L19.5 7" />,
  plus: <path d="M12 5v14M5 12h14" />,
  cross: <path d="M6 6l12 12M18 6L6 18" />,
  arrowRight: <path d="M4 12h15m-5.5-5.5L19 12l-5.5 5.5" />,
  bus: (
    <>
      <rect x="4" y="3.5" width="16" height="13" rx="2.5" />
      <path d="M4 10h16M7 20v-3.5M17 20v-3.5" />
      <circle cx="8" cy="13.5" r="1" />
      <circle cx="16" cy="13.5" r="1" />
    </>
  ),
  bell: (
    <>
      <path d="M18 15V10a6 6 0 1 0-12 0v5l-1.5 2.5h15z" />
      <path d="M10 20.5h4" />
    </>
  ),
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, className = "size-5", title }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {PATHS[name]}
    </svg>
  );
}
