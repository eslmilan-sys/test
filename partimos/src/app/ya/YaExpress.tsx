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
import { agedConsumption, findCar, rateFromConsumption } from "@/lib/cars";
import { saveLastSearch, useLastSearch } from "@/lib/lastsearch";

/**
 * /ya — LA RECHERCHE EXPRESS, pour tout le monde.
 *
 * La leçon du propriétaire : la plupart des gens cherchent UN viaje, une
 * fois. La page ne demande donc plus de « déclarer sa rutina » à
 * l'entrée — elle fait le geste minimal : deux villes, hoy ou mañana,
 * combien de personnes, et les résultats apparaissent SANS bouton, à
 * mesure qu'on choisit. Épuré : le héros (le prochain puesto) + trois
 * alternatives, rien d'autre.
 *
 * La rutina devient ce qu'elle aurait toujours dû être : une OPTION
 * d'automatisation, proposée APRÈS la recherche (« ¿Lo haces seguido?
 * Guárdalo ») — pour celui qui y va tous les jours. Quand elle existe,
 * la page s'ouvre directement sur SON puesto, déjà cherché.
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

function isoDate(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

const cityName = (slug: string) =>
  ALL_CITIES.find((c) => c.slug === slug)?.shortName ?? slug;

export function YaExpress() {
  const { session } = useSession();
  const routine = session?.routine ?? null;
  /* L'habitué peut aussi chercher UN viaje hors rutina : bascule locale,
     jamais destructrice — la rutina reste. */
  const [oneOff, setOneOff] = useState(false);
  const showRoutine = routine && !oneOff;

  return (
    <Container className="pt-8 pb-16">
      <div className="mx-auto max-w-[560px]">
        <h1 className="mb-1.5 font-display text-[clamp(28px,6vw,38px)] leading-[1.05] font-extrabold tracking-[-0.03em]">
          Tu próximo viaje
        </h1>
        <p className="mb-6 text-[15px] leading-relaxed text-ink-500">
          {showRoutine
            ? `${cityName(routine.from)} → ${cityName(routine.to)} · tu rutina de ${routine.days
                .map((d) => DAY_CHIPS.find(([v]) => v === d)?.[1])
                .join(" ")}`
            : "Elige la ruta y mira quién ya va para allá — sin cuenta y sin pagar nada por reservar."}
        </p>

        {showRoutine ? (
          <RoutineHero routine={routine} onSearchOther={() => setOneOff(true)} />
        ) : (
          <>
            <ExpressSearch />
            {routine && (
              <p className="mt-4 text-center text-[13px] text-ink-500">
                <button
                  onClick={() => setOneOff(false)}
                  className="font-semibold text-accent-ink hover:underline"
                >
                  ← Volver a mi rutina
                </button>
              </p>
            )}
          </>
        )}
      </div>
    </Container>
  );
}

/* ══════════════ La recherche express — le cas « une fois » ══════════════ */

function ExpressSearch() {
  const { session, updateSession } = useSession();
  /* La mémoire courte : la page s'ouvre sur la DERNIÈRE recherche faite
     n'importe où sur le site — dérivée, jamais copiée. */
  const last = useLastSearch();
  const [fromChoice, setFromChoice] = useState<string | null>(null);
  const [toChoice, setToChoice] = useState<string | null>(null);
  const [seatsChoice, setSeatsChoice] = useState<number | null>(null);
  const from = fromChoice ?? last?.from ?? "panama-city";
  const to = toChoice ?? last?.to ?? "chitre";
  const seats = seatsChoice ?? last?.seats ?? 1;
  const [when, setWhen] = useState<0 | 1>(0);
  const [savingRoutine, setSavingRoutine] = useState(false);

  const valid = from !== to;
  const date = isoDate(when);
  /* Les résultats se calculent EN RENDANT — pas de bouton, pas
     d'attente : choisir, c'est chercher. */
  const matches = valid ? searchTrips(from, to, date, seats) : [];

  return (
    <>
      <div className="glass liquid rounded-[22px] p-4 [--glass-alpha:0.92] sm:p-5">
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              ["Desde", from, setFromChoice, to],
              ["Hacia", to, setToChoice, from],
            ] as const
          ).map(([label, value, set, other]) => (
            <label key={label} className="block">
              <span className="mb-1 block text-[11px] font-bold tracking-[0.11em] text-ink-500 uppercase">
                {label}
              </span>
              <select
                value={value}
                onChange={(e) => {
                  set(e.target.value);
                  saveLastSearch({
                    from: label === "Desde" ? e.target.value : from,
                    to: label === "Hacia" ? e.target.value : to,
                    seats,
                  });
                }}
                className="w-full appearance-none rounded-[12px] border-[1.5px] border-ink-200 bg-white px-3 py-2.5 text-[15px] font-semibold focus:border-accent focus:outline-none"
              >
                {ALL_CITIES.map((c) => (
                  <option key={c.slug} value={c.slug} disabled={c.slug === other}>
                    {c.shortName}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>

        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          {([0, 1] as const).map((offset) => (
            <button
              key={offset}
              type="button"
              aria-pressed={when === offset}
              onClick={() => setWhen(offset)}
              className={`rounded-full border-[1.5px] px-3.5 py-2 text-[13.5px] font-semibold transition-colors ${
                when === offset
                  ? "border-ink-900 bg-ink-900 text-white"
                  : "border-ink-200 text-ink-500 hover:border-accent"
              }`}
            >
              {offset === 0 ? "Hoy" : "Mañana"}
            </button>
          ))}
          <span aria-hidden className="mx-1 h-5 w-px bg-ink-200" />
          <Icon name="users" aria-hidden className="size-4 text-ink-400" />
          {[1, 2, 3, 4].map((n) => (
            <button
              key={n}
              type="button"
              aria-pressed={seats === n}
              aria-label={`${n} ${n === 1 ? "persona" : "personas"}`}
              onClick={() => {
                setSeatsChoice(n);
                saveLastSearch({ from, to, seats: n });
              }}
              className={`flex size-9 items-center justify-center rounded-full border-[1.5px] text-[13.5px] font-bold transition-colors ${
                seats === n
                  ? "border-ink-900 bg-ink-900 text-white"
                  : "border-ink-200 text-ink-500 hover:border-accent"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Les résultats, tout de suite. */}
      <div className="mt-4">
        {matches.length > 0 ? (
          <>
            <ExpressCard match={matches[0]} date={date} seats={seats} hero />
            {matches.length > 1 && (
              <div className="mt-3 grid gap-2">
                {matches.slice(1, 4).map((m) => (
                  <ExpressCard
                    key={m.trip.id}
                    match={m}
                    date={date}
                    seats={seats}
                  />
                ))}
              </div>
            )}
            <p className="mt-3 text-center text-[13px] text-ink-500">
              <Link
                href={`/buscar?desde=${from}&hacia=${to}&fecha=${date}&puestos=${seats}`}
                className="font-semibold text-accent-ink hover:underline"
              >
                Ver todas las salidas y fechas
              </Link>
            </p>
          </>
        ) : valid ? (
          <div className="rounded-[18px] border border-ink-200 bg-white px-5 py-4">
            <p className="text-[14.5px] leading-relaxed text-ink-500">
              Nada {when === 0 ? "para hoy" : "para mañana"} en esa ruta
              todavía.{" "}
              <Link
                href={`/buscar?desde=${from}&hacia=${to}`}
                className="font-semibold text-accent-ink hover:underline"
              >
                Mira las demás fechas
              </Link>{" "}
              — o pon la alerta ahí y te avisamos.
            </p>
          </div>
        ) : null}
      </div>

      {/* L'automatisation, en OPTION — pour celui qui y va tous les
          jours. Jamais exigée, jamais en travers du chemin. */}
      <div className="mt-8 rounded-[18px] border border-ink-200 bg-white p-5">
        {!savingRoutine ? (
          <div className="flex flex-wrap items-center gap-3">
            <Icon name="route" className="size-5 shrink-0 text-ink-500" />
            <p className="min-w-0 flex-1 text-[14px] leading-snug text-ink-500">
              <b className="font-semibold text-ink-900">
                ¿Este viaje lo haces seguido?
              </b>{" "}
              Guárdalo como rutina y esta página te tendrá el puesto listo,
              sin buscar nada.
            </p>
            {session ? (
              <button
                onClick={() => setSavingRoutine(true)}
                className="rounded-[12px] border-[1.5px] border-ink-200 px-4 py-2.5 text-[13.5px] font-bold transition-colors hover:border-accent hover:text-accent-ink"
              >
                Guardar rutina
              </button>
            ) : (
              <AuthDialog
                trigger={
                  <button className="rounded-[12px] border-[1.5px] border-ink-200 px-4 py-2.5 text-[13.5px] font-bold transition-colors hover:border-accent hover:text-accent-ink">
                    Crear cuenta y guardarlo
                  </button>
                }
              />
            )}
          </div>
        ) : (
          <RoutineDays
            from={from}
            to={to}
            onSave={(days, hour) => {
              updateSession({ routine: { from, to, days, hour } });
            }}
            onCancel={() => setSavingRoutine(false)}
          />
        )}
      </div>
    </>
  );
}

/** Jours + heure — la seule chose que la recherche ne connaît pas. */
function RoutineDays({
  from,
  to,
  onSave,
  onCancel,
}: {
  from: string;
  to: string;
  onSave: (days: number[], hour: string) => void;
  onCancel: () => void;
}) {
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [hour, setHour] = useState("06:15");
  return (
    <div>
      <p className="mb-2.5 text-[14px] font-semibold">
        {cityName(from)} → {cityName(to)} — ¿qué días y a qué hora?
      </p>
      <div className="flex flex-wrap items-center gap-1.5">
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
          className="tnum ml-1 rounded-[10px] border-[1.5px] border-ink-200 px-2.5 py-1.5 text-[14px] font-semibold focus:border-accent focus:outline-none"
        />
      </div>
      <div className="mt-3 flex gap-2.5">
        <button
          disabled={days.length === 0}
          onClick={() => onSave(days, hour)}
          className="rounded-[12px] bg-ink-900 px-4 py-2.5 text-[14px] font-bold text-white transition-colors hover:bg-ink-800 disabled:opacity-50"
        >
          Guardar
        </button>
        <button
          onClick={onCancel}
          className="rounded-[12px] border-[1.5px] border-ink-200 px-4 py-2.5 text-[14px] font-bold transition-colors hover:border-accent"
        >
          Ahora no
        </button>
      </div>
    </div>
  );
}

/* ══════════════ Le héros de rutina — le cas « tous les jours » ══════════════ */

function RoutineHero({
  routine,
  onSearchOther,
}: {
  routine: { from: string; to: string; days: number[]; hour: string };
  onSearchOther: () => void;
}) {
  const { session } = useSession();

  let found: { date: string | null; matches: TripMatch[] } = {
    date: null,
    matches: [],
  };
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

  /* Le chiffre conducteur : au tope de SON carro, 3 puestos. */
  const car = carsOf(session)[0];
  const carRef = car ? findCar(car.make, car.model) : null;
  const rate = carRef
    ? rateFromConsumption(agedConsumption(carRef.l100, car!.year))
    : null;
  const route = buildRoute(routine.from, routine.to);
  const monthlyCents = route
    ? Math.round(
        computePriceCap(route.distanceKm, route.tollCents, rate ?? "standard", 3)
          .maxPriceCents *
          3 *
          routine.days.length *
          4.3,
      )
    : 0;

  return (
    <>
      {found.matches.length > 0 ? (
        <>
          <ExpressCard match={found.matches[0]} date={found.date!} hero />
          {found.matches.length > 1 && (
            <div className="mt-3 grid gap-2">
              {found.matches.slice(1, 4).map((m) => (
                <ExpressCard key={m.trip.id} match={m} date={found.date!} />
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="rounded-[20px] border border-ink-200 bg-white p-6">
          <p className="text-[15px] leading-relaxed text-ink-500">
            Todavía no hay viajes publicados en tu rutina para los próximos
            días. Puedes{" "}
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
        <Link
          href="/cuenta"
          className="font-semibold text-accent-ink hover:underline"
        >
          Cambiar mi rutina
        </Link>
        {" · "}
        <button
          onClick={onSearchOther}
          className="font-semibold text-accent-ink hover:underline"
        >
          Buscar otro viaje
        </button>
        {" · "}
        <Link
          href={`/buscar?desde=${routine.from}&hacia=${routine.to}`}
          className="font-semibold text-accent-ink hover:underline"
        >
          Todas las salidas
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
                al mes de gasolina y peajes, con los puestos llenos. Nunca más
                que eso.
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
  );
}

/* ══════════════ La carte d'un puesto — héros ou alternative ══════════════ */

function ExpressCard({
  match,
  date,
  seats = 1,
  hero = false,
}: {
  match: TripMatch;
  date: string;
  seats?: number;
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
        {seats > 1 ? `${seats} puestos` : "Tu puesto"} para{" "}
        {formatDayLabel(date)}
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
        {seats > 1 ? "Pedir los puestos" : "Pedir mi puesto"}
      </Link>
      <p className="mt-2.5 text-center text-[12.5px] text-ink-500">
        Un tap más y queda pedido — reservar no cuesta nada.
      </p>
    </div>
  );
}
