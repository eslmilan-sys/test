"use client";

import { useState } from "react";
import Link from "next/link";
import { Container } from "@/components/site/Section";
import { Icon } from "@/components/ui/Icon";
import { AuthDialog } from "@/components/site/AuthDialog";
import { useSession, carsOf } from "@/lib/session";
import { ALL_CITIES, buildRoute } from "@/lib/corridors";
import { computePriceCap, formatUsd } from "@/lib/pricing";
import {
  searchTrips,
  formatTime,
  formatDayLabel,
  SEARCH_HORIZON_DAYS,
  type TripMatch,
} from "@/lib/trips";
import {
  agedConsumption,
  findCar,
  rateFromConsumption,
} from "@/lib/cars";

/**
 * LA VOIE EXPRESS — deux taps entre « j'ouvre » et « c'est réservé ».
 *
 * La page ne demande RIEN qu'elle sait déjà : la rutina donne la paire
 * de villes, les jours et l'heure ; la recherche est déjà faite à
 * l'arrivée ; le premier résultat utile est déjà en avant. Tap 1 :
 * « Pedir mi puesto ». Tap 2 : confirmer sur la page du viaje (canal de
 * paiement déjà présélectionné par le favori du compte). C'est la
 * métrique du produit — le temps-jusqu'au-premier-viaje — transformée
 * en écran.
 *
 * Trois états, du plus pauvre au plus riche :
 *   · pas de session   → on explique et on invite à entrer ;
 *   · pas de rutina    → mini-réglage en place (deux villes, jours,
 *                        heure), sauvé une fois pour toutes ;
 *   · rutina           → LE puesto du prochain jour de rutina, énorme,
 *                        et les alternatives en dessous.
 *
 * Le miroir conducteur vit en bas : publier SA rutina en un toque, avec
 * le chiffre qui compte (« recuperas hasta … al mes »).
 */

const DAY_CHIPS = [
  [1, "L"],
  [2, "M"],
  [3, "X"],
  [4, "J"],
  [5, "V"],
  [6, "S"],
  [7, "D"],
] as const;

/** Jour ISO (1 = lundi … 7 = dimanche) d'une date locale. */
function isoDay(d: Date): number {
  return ((d.getDay() + 6) % 7) + 1;
}

export function YaExpress() {
  const { session, updateSession } = useSession();
  const routine = session?.routine ?? null;

  /* La recherche est faite AVANT le premier tap : pour chaque jour de
     l'horizon, si c'est un jour de rutina, on cherche — et on s'arrête
     au premier jour qui a des viajes. Pas de useMemo : le calcul lit
     l'horloge (il doit — « le prochain jour » bouge), et il est assez
     léger pour se refaire à chaque rendu. */
  let found: { date: string | null; matches: TripMatch[] } | null = null;
  if (routine) {
    found = { date: null, matches: [] };
    for (let i = 0; i < SEARCH_HORIZON_DAYS; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      if (!routine.days.includes(isoDay(d))) continue;
      const date = d.toISOString().slice(0, 10);
      const matches = searchTrips(routine.from, routine.to, date);
      if (matches.length > 0) {
        found = { date, matches };
        break;
      }
    }
  }

  const cityName = (slug: string) =>
    ALL_CITIES.find((c) => c.slug === slug)?.shortName ?? slug;

  /* Le chiffre conducteur : au tope de SON carro, 3 puestos. */
  const car = carsOf(session)[0];
  const carRef = car ? findCar(car.make, car.model) : null;
  const rate = carRef
    ? rateFromConsumption(agedConsumption(carRef.l100, car!.year))
    : null;
  const route = routine ? buildRoute(routine.from, routine.to) : null;
  const monthlyCents =
    route && routine
      ? Math.round(
          computePriceCap(route.distanceKm, route.tollCents, rate ?? "standard", 3)
            .maxPriceCents *
            3 *
            routine.days.length *
            4.3,
        )
      : 0;

  return (
    <Container className="pt-8 pb-16">
      <div className="mx-auto max-w-[560px]">
        <h1 className="mb-1.5 font-display text-[clamp(28px,6vw,38px)] leading-[1.05] font-extrabold tracking-[-0.03em]">
          {routine ? "Tu próximo viaje" : "Dos taps y estás montado"}
        </h1>
        <p className="mb-6 text-[15px] leading-relaxed text-ink-500">
          {routine
            ? `${cityName(routine.from)} → ${cityName(routine.to)} · tu rutina de ${routine.days
                .map((d) => DAY_CHIPS.find(([v]) => v === d)?.[1])
                .join(" ")}`
            : "Declara tu rutina una vez. Después, esta página ya buscó por ti: abres, tocas, viajas."}
        </p>

        {!session ? (
          <div className="glass liquid rounded-[22px] p-6 [--glass-alpha:0.92]">
            <p className="mb-4 text-[15px] leading-relaxed text-ink-500">
              Con una cuenta, Partimos recuerda tu ruta de siempre, tus días y
              cómo prefieres pagar — y esta página se convierte en tu atajo:
              el puesto de mañana, listo en dos taps.
            </p>
            <AuthDialog
              trigger={
                <button className="w-full rounded-[14px] bg-ink-900 px-6 py-3.5 font-display text-[16px] font-bold text-white transition-colors hover:bg-ink-800">
                  Conectarme o crear cuenta
                </button>
              }
            />
            <p className="mt-3 text-center text-[13px] text-ink-500">
              ¿Solo mirando?{" "}
              <Link href="/buscar" className="font-semibold text-accent-ink hover:underline">
                Buscar sin cuenta
              </Link>
            </p>
          </div>
        ) : !routine ? (
          <RutinaSetup
            onSave={(r) => updateSession({ routine: r })}
          />
        ) : (
          <>
            {found?.matches.length ? (
              <>
                {/* LE puesto — un seul héros, tout le reste en dessous. */}
                <ExpressCard
                  match={found.matches[0]}
                  date={found.date!}
                  hero
                />
                {found.matches.length > 1 && (
                  <div className="mt-3 grid gap-2">
                    {found.matches.slice(1, 4).map((m) => (
                      <ExpressCard
                        key={m.trip.id}
                        match={m}
                        date={found.date!}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-[20px] border border-ink-200 bg-white p-6">
                <p className="text-[15px] leading-relaxed text-ink-500">
                  Todavía no hay viajes publicados en tu rutina para los
                  próximos días. Puedes{" "}
                  <Link
                    href={`/buscar?desde=${routine.from}&hacia=${routine.to}`}
                    className="font-semibold text-accent-ink hover:underline"
                  >
                    mirar todas las fechas
                  </Link>{" "}
                  — o publicarla tú, abajo.
                </p>
              </div>
            )}

            <p className="mt-4 text-center text-[13px] text-ink-500">
              <Link href="/cuenta" className="font-semibold text-accent-ink hover:underline">
                Cambiar mi rutina
              </Link>
              {" · "}
              <Link
                href={`/buscar?desde=${routine.from}&hacia=${routine.to}`}
                className="font-semibold text-accent-ink hover:underline"
              >
                Ver todas las salidas
              </Link>
            </p>

            {/* Le miroir conducteur : la même rutina, côté volant. */}
            <div className="relative mt-8">
              <span
                aria-hidden
                className="absolute -top-3 -left-4 size-16 rotate-[-8deg] rounded-[16px] bg-[linear-gradient(135deg,#fde68a,#f59e0b_58%,#d97706)] opacity-70"
              />
              <div className="glass relative rounded-[20px] p-5 [--glass-alpha:0.88]">
                <h2 className="mb-1 font-display text-[18px] font-bold">
                  ¿Manejas tú ese camino?
                </h2>
                <p className="mb-3 text-[14px] leading-relaxed text-ink-500">
                  Publica tu rutina en un toque
                  {monthlyCents > 0 && (
                    <>
                      {" "}
                      — recuperas hasta{" "}
                      <b className="tnum font-display font-bold text-ink-900">
                        {formatUsd(monthlyCents, { compact: true })}
                      </b>{" "}
                      al mes de gasolina y peajes, con los puestos llenos.
                      Nunca más que eso.
                    </>
                  )}
                </p>
                <Link
                  href={`/publicar/nuevo?desde=${routine.from}&hacia=${routine.to}`}
                  className="inline-flex rounded-[13px] border-[1.5px] border-ink-200 bg-white px-5 py-2.5 font-display text-[15px] font-bold transition-colors hover:border-accent hover:text-accent-ink"
                >
                  Publicar mi rutina
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </Container>
  );
}

/** La carte d'un puesto — héros ou alternative compacte. */
function ExpressCard({
  match,
  date,
  hero = false,
}: {
  match: TripMatch;
  date: string;
  hero?: boolean;
}) {
  const { trip, segment, priceCents, seatsFree, boardingAt } = match;
  const href = `/viaje/${trip.id}?desde=${segment.from.citySlug}&hacia=${segment.to.citySlug}`;

  if (!hero) {
    return (
      <Link
        href={href}
        className="flex items-center gap-3.5 rounded-[15px] border border-ink-200 bg-white px-4 py-3 transition-colors hover:border-accent"
      >
        <span className="tnum font-display text-[17px] font-bold">
          {formatTime(boardingAt)}
        </span>
        <span className="min-w-0 flex-1 text-[13.5px] text-ink-500">
          {trip.driver.firstName} {trip.driver.lastInitial}. ·{" "}
          {trip.vehicle.make} {trip.vehicle.model} · {seatsFree}{" "}
          {seatsFree === 1 ? "puesto" : "puestos"}
        </span>
        <span className="tnum font-display text-[16px] font-bold">
          {formatUsd(priceCents, { compact: true })}
        </span>
      </Link>
    );
  }

  return (
    <div className="glass liquid relative rounded-[22px] p-5 [--glass-alpha:0.92] sm:p-6">
      <p className="mb-3 flex items-center gap-2 text-[11.5px] font-bold tracking-[0.13em] text-ink-500 uppercase">
        <span aria-hidden className="size-1.5 rounded-full bg-brand-green" />
        Tu puesto para {formatDayLabel(date)}
      </p>
      <div className="flex items-baseline justify-between gap-3">
        <p className="tnum font-display text-[34px] leading-none font-extrabold tracking-[-0.03em]">
          {formatTime(boardingAt)}
        </p>
        <p className="tnum text-right font-display text-[26px] leading-none font-extrabold text-action-deep">
          {formatUsd(priceCents)}
          <span className="block text-[11.5px] font-semibold tracking-normal text-ink-500">
            por puesto
          </span>
        </p>
      </div>
      <p className="tnum mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[14px] text-ink-600">
        <span className="flex size-8 items-center justify-center rounded-full bg-ink-900 font-display text-[13px] font-bold text-ink-50">
          {trip.driver.initial}
        </span>
        {trip.driver.firstName} {trip.driver.lastInitial}.
        {trip.driver.rating > 0 && (
          <span className="flex items-center gap-1 text-ink-500">
            <Icon name="star" className="size-3.5" />
            {trip.driver.rating.toFixed(1)}
          </span>
        )}
        <span className="text-ink-500">
          · {trip.vehicle.make} {trip.vehicle.model} · {seatsFree}{" "}
          {seatsFree === 1 ? "puesto libre" : "puestos libres"}
        </span>
      </p>
      <Link
        href={href}
        className="mt-4 flex w-full items-center justify-center rounded-[14px] bg-ink-900 px-6 py-4 font-display text-[17px] font-bold text-white transition-colors hover:bg-ink-800"
      >
        Pedir mi puesto
      </Link>
      <p className="mt-2.5 text-center text-[12.5px] text-ink-500">
        Un tap más y queda pedido — tu forma de pago ya está preseleccionada.
      </p>
    </div>
  );
}

/** Le mini-réglage de rutina, en place — une seule fois. */
function RutinaSetup({
  onSave,
}: {
  onSave: (r: { from: string; to: string; days: number[]; hour: string }) => void;
}) {
  const [from, setFrom] = useState("la-chorrera");
  const [to, setTo] = useState("panama-city");
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [hour, setHour] = useState("06:15");

  return (
    <div className="glass liquid rounded-[22px] p-5 [--glass-alpha:0.92] sm:p-6">
      <h2 className="mb-1 font-display text-[18px] font-bold">
        Tu rutina, una sola vez
      </h2>
      <p className="mb-4 text-[13.5px] leading-relaxed text-ink-500">
        El viaje que repites cada semana. Con esto, esta página busca por ti
        antes de que llegues.
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {(
          [
            ["Salgo de", from, setFrom],
            ["Voy a", to, setTo],
          ] as const
        ).map(([label, value, set]) => (
          <label key={label} className="block">
            <span className="mb-1 block text-[11.5px] font-bold tracking-[0.11em] text-ink-500 uppercase">
              {label}
            </span>
            <select
              value={value}
              onChange={(e) => set(e.target.value)}
              className="w-full appearance-none rounded-[12px] border-[1.5px] border-ink-200 bg-white px-3.5 py-2.5 text-[15px] font-semibold focus:border-accent focus:outline-none"
            >
              {ALL_CITIES.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.shortName}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {DAY_CHIPS.map(([value, label]) => {
          const active = days.includes(value);
          return (
            <button
              key={value}
              type="button"
              aria-pressed={active}
              onClick={() =>
                setDays((d) =>
                  active ? d.filter((x) => x !== value) : [...d, value].sort(),
                )
              }
              className={`flex size-9 items-center justify-center rounded-full border-[1.5px] text-[13.5px] font-bold transition-colors ${
                active
                  ? "border-ink-900 bg-ink-900 text-white"
                  : "border-ink-200 text-ink-500 hover:border-accent"
              }`}
            >
              {label}
            </button>
          );
        })}
        <input
          type="time"
          value={hour}
          onChange={(e) => setHour(e.target.value)}
          aria-label="Hora habitual"
          className="tnum ml-1 rounded-[10px] border-[1.5px] border-ink-200 bg-white px-2.5 py-1.5 text-[14px] font-semibold focus:border-accent focus:outline-none"
        />
      </div>
      <button
        disabled={from === to || days.length === 0}
        onClick={() => onSave({ from, to, days, hour })}
        className="mt-4 w-full rounded-[14px] bg-ink-900 px-6 py-3.5 font-display text-[16px] font-bold text-white transition-colors hover:bg-ink-800 disabled:opacity-50"
      >
        Guardar y buscar por mí
      </button>
    </div>
  );
}
