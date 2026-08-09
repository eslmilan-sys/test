/**
 * Bandeau des viajes publiés — preuve de vie de la plateforme.
 *
 * Les cartes sont volontairement NON cliquables. Une cible qui défile en
 * continu se rate au doigt : au survol l'animation se met en pause, mais sur
 * un écran tactile il n'y a pas de survol, et la carte se dérobe sous le
 * pouce. Le bandeau montre qu'il se passe quelque chose ; la section « Rutas »
 * juste en dessous est là pour cliquer.
 *
 * La liste est dupliquée pour boucler sans saut, et le second jeu est masqué
 * aux lecteurs d'écran. L'animation disparaît sous `prefers-reduced-motion`.
 *
 * Le bandeau reste dans le registre de la PLANCHE, en continuité du premier
 * écran : il était écrit pour un fond sombre (bordures et texte blancs), et
 * le poser sur le tirage clair faisait tomber six libellés sous le contraste
 * AA. Deux bandes sombres qui se suivent donnent aussi le bon rythme avant que
 * la page ne bascule en tirage de travail.
 */

const TRIPS = [
  {
    initial: "A",
    route: "Panamá → Chitré",
    when: "Vie 6:00 · 2 puestos",
    price: "$13",
    slug: "panama-chitre",
  },
  {
    initial: "J",
    route: "Panamá → David",
    when: "Vie 5:30 · 3 puestos",
    price: "$21",
    slug: "panama-david",
  },
  {
    initial: "Y",
    route: "Panamá → Las Tablas",
    when: "Vie 17:00 · 2 puestos",
    price: "$14",
    slug: "panama-las-tablas",
  },
  {
    initial: "C",
    route: "Panamá → Penonomé",
    when: "Sáb 8:00 · 1 puesto",
    price: "$8",
    slug: "panama-penonome",
  },
  {
    initial: "R",
    route: "Panamá → Santiago",
    when: "Dom 15:00 · 3 puestos",
    price: "$13",
    slug: "panama-santiago",
  },
  {
    initial: "M",
    route: "Panamá → Coronado",
    when: "Sáb 7:30 · 2 puestos",
    price: "$5",
    slug: "panama-coronado",
  },
];

function Card({
  trip,
  clone,
}: {
  trip: (typeof TRIPS)[number];
  clone?: boolean;
}) {
  return (
    <li
      aria-hidden={clone}
      className="flex shrink-0 items-center gap-2.5 border border-plate-600 px-3.5 py-2.5 whitespace-nowrap"
    >
      <span
        aria-hidden
        className="flex size-7.5 shrink-0 items-center justify-center border border-ochre-400 text-[12.5px] font-bold text-ochre-300"
      >
        {trip.initial}
      </span>
      <span>
        <span className="block text-[13px] font-semibold text-plate-100">
          {trip.route}
        </span>
        <span className="block text-[11.5px] text-plate-300">{trip.when}</span>
      </span>
      <span className="cote ml-1 text-base font-bold text-ochre-300">
        {trip.price}
      </span>
    </li>
  );
}

export function LiveStrip() {
  return (
    <div
      className="plate group overflow-hidden border-b-2 border-plate-700 px-5 pt-5 pb-7 [mask-image:linear-gradient(90deg,transparent,#000_4%,#000_96%,transparent)]"
      aria-label="Viajes publicados recientemente"
    >
      <p className="mb-3.5 flex items-center gap-2 text-[11.5px] font-bold tracking-[0.14em] text-plate-200 uppercase">
        <span
          aria-hidden
          className="size-1.5 animate-pulse rounded-full bg-ochre-400"
        />
        Publicados hoy
      </p>
      <ul className="flex w-max animate-[strip_42s_linear_infinite] gap-2.5 group-hover:[animation-play-state:paused]">
        {TRIPS.map((trip) => (
          <Card key={trip.slug} trip={trip} />
        ))}
        {TRIPS.map((trip) => (
          <Card key={`${trip.slug}-clone`} trip={trip} clone />
        ))}
      </ul>
    </div>
  );
}
