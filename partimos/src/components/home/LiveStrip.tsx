import Link from "next/link";

/**
 * Bandeau des viajes publiés — preuve de vie de la plateforme.
 *
 * Le défilement est décoratif : la liste est dupliquée pour boucler sans
 * saut, et le second jeu est masqué aux lecteurs d'écran. L'animation
 * s'arrête au survol et disparaît sous `prefers-reduced-motion`.
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
    <Link
      href={`/viajes/${trip.slug}`}
      aria-hidden={clone}
      tabIndex={clone ? -1 : undefined}
      className="flex shrink-0 items-center gap-2.5 rounded-[14px] border border-white/12 bg-white/6 px-3.5 py-2.5 whitespace-nowrap transition-colors hover:border-white/25 hover:bg-white/10"
    >
      <span
        aria-hidden
        className="brand-gradient flex size-7.5 shrink-0 items-center justify-center rounded-full font-display text-[12.5px] font-bold text-white"
      >
        {trip.initial}
      </span>
      <span>
        <span className="block text-[13px] font-semibold text-white">
          {trip.route}
        </span>
        <span className="block text-[11.5px] text-ink-300">{trip.when}</span>
      </span>
      <span className="tnum ml-1 font-display text-base font-bold text-white">
        {trip.price}
      </span>
    </Link>
  );
}

export function LiveStrip() {
  return (
    <div
      className="group mt-8 overflow-hidden border-t border-white/12 pt-4 pb-7.5 [mask-image:linear-gradient(90deg,transparent,#000_6%,#000_94%,transparent)]"
      aria-label="Viajes publicados recientemente"
    >
      <p className="mb-3.5 flex items-center gap-2 text-[11.5px] font-bold tracking-[0.14em] text-ink-300 uppercase">
        <span
          aria-hidden
          className="size-1.5 animate-pulse rounded-full bg-brand-green"
        />
        Publicados hoy
      </p>
      <div className="flex w-max animate-[strip_42s_linear_infinite] gap-2.5 group-hover:[animation-play-state:paused]">
        {TRIPS.map((trip) => (
          <Card key={trip.slug} trip={trip} />
        ))}
        {TRIPS.map((trip) => (
          <Card key={`${trip.slug}-clone`} trip={trip} clone />
        ))}
      </div>
    </div>
  );
}
