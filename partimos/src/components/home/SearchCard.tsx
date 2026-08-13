"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ALL_CITIES, buildRoute, CORRIDORS } from "@/lib/corridors";
import { useSession } from "@/lib/session";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { CityCombobox } from "@/components/ui/CityCombobox";
import { RouteMap } from "@/components/map/RouteMap";
import { AvisameForm } from "@/components/AvisameForm";
import { SEARCH_HORIZON_DAYS } from "@/lib/trips";

/** L'horizon de recherche, libellé en espagnol du Panama. */
function nextDays(count = SEARCH_HORIZON_DAYS) {
  const out: { value: string; label: string }[] = [];
  const today = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const value = d.toISOString().slice(0, 10);
    const label =
      i === 0
        ? "Hoy"
        : i === 1
          ? "Mañana"
          : new Intl.DateTimeFormat("es-PA", {
              weekday: "long",
              day: "numeric",
              month: "short",
            }).format(d);
    out.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) });
  }
  return out;
}

const FIELD_LABEL =
  "block text-[10.5px] font-bold tracking-[0.11em] text-ink-500 uppercase";
const FIELD_INPUT =
  "w-full cursor-pointer appearance-none border-none bg-transparent py-px text-[16px] font-semibold text-ink-900 focus:outline-none";

export function SearchCard() {
  const router = useRouter();
  const { session } = useSession();
  const days = useMemo(() => nextDays(), []);

  const [mode, setMode] = useState<"buscar" | "ofrecer">("buscar");
  const [from, setFrom] = useState("panama-city");
  const [to, setTo] = useState("chitre");
  const [date, setDate] = useState(days[0].value);
  const [seats, setSeats] = useState(1);
  const [noRoute, setNoRoute] = useState(false);
  const [showMap, setShowMap] = useState(false);
  // Sur la carte, le premier clic renseigne l'origine, le suivant la
  // destination. Alterner évite un sélecteur « je choisis quoi » de plus.
  const [picking, setPicking] = useState<"origin" | "destination">("origin");

  const sameCity = from === to;

  function pickOnMap(slug: string) {
    setNoRoute(false);
    if (picking === "origin") {
      setFrom(slug);
      if (slug === to) setTo("");
      setPicking("destination");
    } else {
      setTo(slug);
      setPicking("origin");
    }
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (sameCity || !from || !to) return;

    if (mode === "ofrecer") {
      router.push(`/publicar/nuevo?desde=${from}&hacia=${to}`);
      return;
    }

    const corridor = CORRIDORS.find(
      (c) => c.origin.slug === from && c.destination.slug === to,
    );

    if (corridor) {
      router.push(
        `/buscar?desde=${from}&hacia=${to}&fecha=${date}&puestos=${seats}`,
      );
      return;
    }

    // Aucun corridor ouvert : la recherche infructueuse est le signal le plus
    // utile du produit. On ne renvoie pas une page vide, on collecte.
    setNoRoute(true);
  }

  const fromCity = ALL_CITIES.find((c) => c.slug === from);
  const toCity = ALL_CITIES.find((c) => c.slug === to);
  const routine = session?.routine ?? null;

  return (
    <div className="glass liquid rounded-[22px] p-2.5 shadow-float [--glass-alpha:0.82]">
      {/* La voie express, pour qui a une rutina : la carte de recherche
          reste, mais le raccourci passe devant — c'est lui qui réduit le
          temps-jusqu'au-viaje à deux taps. */}
      {routine && (
        <Link
          href="/ya"
          className="mx-3 mt-2.5 flex items-center gap-2.5 rounded-[13px] bg-ink-900 px-4 py-3 text-white transition-colors hover:bg-ink-800"
        >
          <Icon name="route" className="size-4.5 shrink-0" />
          <span className="min-w-0 flex-1 text-[14px] font-semibold">
            Tu rutina:{" "}
            {ALL_CITIES.find((c) => c.slug === routine.from)?.shortName} →{" "}
            {ALL_CITIES.find((c) => c.slug === routine.to)?.shortName}
            <span className="block text-[12px] font-normal text-white/70">
              Tu próximo puesto ya está buscado
            </span>
          </span>
          <Icon name="arrowRight" className="size-4 shrink-0" />
        </Link>
      )}
      <div className="px-3 pt-2.5 pb-2">
        <div
          role="group"
          aria-label="¿Qué quieres hacer?"
          className="flex rounded-xl bg-ink-50 p-0.5"
        >
          {(
            [
              ["buscar", "Busco puesto"],
              ["ofrecer", "Ofrezco puestos"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={mode === value}
              onClick={() => setMode(value)}
              className={`flex-1 rounded-[9px] px-3 py-2.5 text-[13.5px] font-semibold whitespace-nowrap transition-colors ${
                mode === value
                  ? "bg-white text-ink-900 shadow-[0_1px_4px_rgb(14_42_53/0.12)]"
                  : "text-ink-500 hover:text-ink-900"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 px-3 pb-2">
        <div
          role="group"
          aria-label="Cómo escoger las ciudades"
          className="flex gap-1"
        >
          {(
            [
              [false, "Escribir", "search"],
              [true, "Mapa", "pin"],
            ] as const
          ).map(([value, label, icon]) => (
            <button
              key={label}
              type="button"
              aria-pressed={showMap === value}
              onClick={() => setShowMap(value)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold transition-colors ${
                showMap === value
                  ? "bg-ink-900 text-white"
                  : "text-ink-500 hover:bg-ink-50"
              }`}
            >
              <Icon name={icon} className="size-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <CityCombobox
          id="desde"
          label="Desde"
          value={from}
          exclude={to}
          tone="origin"
          onChange={(slug) => {
            setFrom(slug);
            setNoRoute(false);
          }}
        />

        <div className="border-t border-ink-200">
          <CityCombobox
            id="hacia"
            label="Hacia"
            value={to}
            exclude={from}
            tone="destination"
            onChange={(slug) => {
              setTo(slug);
              setNoRoute(false);
            }}
          />
        </div>

        <div className="flex border-t border-ink-200">
          <div className="flex flex-1 items-center gap-3 rounded-[14px] px-3.5 py-3 transition-colors hover:bg-ink-50">
            <Icon
              name="calendar"
              className="size-[19px] shrink-0 text-ink-500"
            />
            <div className="min-w-0 flex-1">
              <label htmlFor="fecha" className={FIELD_LABEL}>
                Fecha
              </label>
              <select
                id="fecha"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={FIELD_INPUT}
              >
                {days.map((day) => (
                  <option key={day.value} value={day.value}>
                    {day.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex max-w-[176px] items-center gap-3 rounded-[14px] border-l border-ink-200 py-3 pl-3.5 transition-colors hover:bg-ink-50">
            <div className="min-w-0 flex-1">
              <label htmlFor="puestos" className={FIELD_LABEL}>
                Puestos
              </label>
              <select
                id="puestos"
                value={seats}
                onChange={(e) => setSeats(Number(e.target.value))}
                className={FIELD_INPUT}
              >
                {[1, 2, 3, 4].map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? "puesto" : "puestos"}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* La carte n'est pas un extra caché derrière un lien : c'est l'autre
            façon de renseigner les deux mêmes champs. Elle mérite donc une
            place égale, et elle montre d'un coup d'œil ce que couvre la
            plateforme — ce que sept lignes de liste ne diront jamais. */}
        {showMap && (
          <div className="mt-2 rounded-[18px] border border-ink-200 bg-ink-50/70 p-3">
            <RouteMap
              originSlug={from}
              destinationSlug={to}
              route={buildRoute(from, to) ?? undefined}
              picking={picking}
              onPick={pickOnMap}
            />
          </div>
        )}

        {sameCity && (
          <p
            role="alert"
            className="mt-2 rounded-xl bg-danger-soft px-3.5 py-2.5 text-[13.5px] font-medium text-danger"
          >
            El origen y el destino no pueden ser el mismo.
          </p>
        )}

        <Button
          type="submit"
          size="lg"
          full
          className="mt-2"
          disabled={sameCity || !from || !to}
        >
          {mode === "buscar" ? "Buscar viaje" : "Publicar mi viaje"}
        </Button>

        <p className="px-1.5 pt-3 pb-1 text-center text-[12.5px] text-ink-500">
          Buscar y reservar es <b className="text-ink-900">gratis</b>. Le pagas
          directo a la persona.
        </p>
      </form>

      {noRoute && fromCity && toCity && (
        <div className="border-t border-ink-200 px-3.5 pt-4 pb-2">
          <p className="mb-3 text-[14.5px] leading-relaxed text-ink-500">
            Todavía no tenemos viajes publicados entre{" "}
            <b className="text-ink-900">{fromCity.shortName}</b> y{" "}
            <b className="text-ink-900">{toCity.shortName}</b>. Déjanos tu
            número y te escribimos apenas alguien salga para allá.
          </p>
          <AvisameForm
            originSlug={from}
            destinationSlug={to}
            requestedDate={date}
            seats={seats}
            source="home-search"
          />
        </div>
      )}
    </div>
  );
}
