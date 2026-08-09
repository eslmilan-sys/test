"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/site/Section";
import { SearchSummary } from "@/components/search/SearchSummary";
import { TripCard } from "@/components/trip/TripCard";
import { AvisameForm } from "@/components/AvisameForm";
import { Icon } from "@/components/ui/Icon";
import { ButtonLink } from "@/components/ui/Button";
import { CORRIDORS, ALL_CITIES } from "@/lib/corridors";
import { getTripsFor, formatDayLabel, seatsLeft } from "@/lib/trips";
import { isSupabaseConfigured } from "@/lib/supabase";

/**
 * PAGE DE RÉSULTATS — la boucle principale du produit.
 *
 * Elle manquait, et c'est ce qui rendait le site « flou » : on cherchait un
 * trajet et on tombait sur une page d'article. Ici on choisit une personne,
 * une heure et un montant.
 *
 * Trois cas, et aucun n'est une impasse :
 *   · des trajets → la liste ;
 *   · un corridor ouvert mais rien ce jour-là → les jours voisins ;
 *   · un corridor inexistant → collecte du signal de demande.
 */

type SortKey = "hora" | "aporte" | "calificacion";

export function SearchResults() {
  const router = useRouter();
  const params = useSearchParams();

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const criteria = {
    from: params.get("desde") ?? "panama-city",
    to: params.get("hacia") ?? "chitre",
    date: params.get("fecha") ?? today,
    seats: Number(params.get("puestos")) || 1,
  };

  const [sort, setSort] = useState<SortKey>("hora");
  const [onlyWomen, setOnlyWomen] = useState(false);
  const [onlyInstant, setOnlyInstant] = useState(false);

  const corridor = CORRIDORS.find(
    (c) =>
      c.origin.slug === criteria.from && c.destination.slug === criteria.to,
  );

  const trips = useMemo(() => {
    if (!corridor) return [];
    return getTripsFor(corridor.slug, criteria.date).filter(
      (trip) => seatsLeft(trip) >= criteria.seats,
    );
  }, [corridor, criteria.date, criteria.seats]);

  const visible = useMemo(() => {
    const filtered = trips.filter(
      (trip) =>
        (!onlyWomen || trip.womenOnly) && (!onlyInstant || trip.instantBooking),
    );
    const sorted = [...filtered];
    if (sort === "aporte") sorted.sort((a, b) => a.priceCents - b.priceCents);
    if (sort === "calificacion")
      sorted.sort((a, b) => b.driver.rating - a.driver.rating);
    return sorted;
  }, [trips, sort, onlyWomen, onlyInstant]);

  /** Jours voisins qui, eux, ont des trajets. */
  const nearbyDays = useMemo(() => {
    if (!corridor) return [];
    return [-2, -1, 1, 2, 3]
      .map((offset) => {
        const d = new Date(`${criteria.date}T12:00:00`);
        d.setDate(d.getDate() + offset);
        const iso = d.toISOString().slice(0, 10);
        if (iso < today) return null;
        const count = getTripsFor(corridor.slug, iso).length;
        return count > 0 ? { date: iso, count } : null;
      })
      .filter((v): v is { date: string; count: number } => v !== null)
      .slice(0, 3);
  }, [corridor, criteria.date, today]);

  function apply(next: typeof criteria) {
    const q = new URLSearchParams({
      desde: next.from,
      hacia: next.to,
      fecha: next.date,
      puestos: String(next.seats),
    });
    router.push(`/buscar?${q}`);
  }

  const fromCity = ALL_CITIES.find((c) => c.slug === criteria.from);
  const toCity = ALL_CITIES.find((c) => c.slug === criteria.to);

  return (
    <>
      <div className="sticky top-[57px] z-30 border-b border-ink-200 bg-white/97 py-3">
        <Container>
          <SearchSummary criteria={criteria} onApply={apply} />
        </Container>
      </div>

      <Container className="pt-6">
        {!isSupabaseConfigured && (
          <p className="mb-4 flex items-start gap-2.5 rounded-[14px] border border-ink-200 bg-white px-4 py-3 text-[13px] leading-relaxed text-ink-500">
            <Icon name="bell" className="mt-0.5 size-4 shrink-0" />
            <span>
              <b className="font-semibold text-ink-900">Viajes de ejemplo.</b>{" "}
              La base de datos todavía no está conectada, así que estos
              conductores son de muestra. Todo lo demás —el cálculo del aporte,
              las reglas, los desvíos— funciona de verdad.
            </span>
          </p>
        )}

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-[20px] font-bold tracking-[-0.02em]">
            {corridor
              ? `${visible.length} ${visible.length === 1 ? "viaje" : "viajes"} · ${formatDayLabel(criteria.date)}`
              : "Sin resultados"}
          </h1>

          {trips.length > 0 && (
            <label className="flex items-center gap-2 text-[13.5px] text-ink-500">
              Ordenar por
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="cursor-pointer rounded-[10px] border border-ink-200 bg-white px-2.5 py-1.5 font-semibold text-ink-900 focus:border-accent focus:outline-none"
              >
                <option value="hora">Hora de salida</option>
                <option value="aporte">Aporte más bajo</option>
                <option value="calificacion">Mejor calificación</option>
              </select>
            </label>
          )}
        </div>

        {trips.length > 0 && (
          <div className="mb-5 flex flex-wrap gap-2">
            <Filter
              active={onlyInstant}
              onClick={() => setOnlyInstant((v) => !v)}
            >
              Reserva al instante
            </Filter>
            <Filter active={onlyWomen} onClick={() => setOnlyWomen((v) => !v)}>
              Solo mujeres
            </Filter>
          </div>
        )}

        {visible.length > 0 ? (
          <ul className="grid gap-3">
            {visible.map((trip) => (
              <li key={trip.id}>
                <TripCard trip={trip} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-[20px] border border-ink-200 bg-white p-6">
            <h2 className="mb-2 font-display text-[19px] font-bold">
              {corridor
                ? "Nadie sale ese día por ahora"
                : "Todavía no abrimos esa ruta"}
            </h2>
            <p className="mb-5 max-w-[54ch] text-[15px] leading-relaxed text-ink-500">
              {corridor
                ? "Los viajes se publican sobre la marcha, casi siempre con dos o tres días de anticipación. Déjanos tu número y te escribimos apenas alguien publique."
                : `Guardamos tu búsqueda de ${fromCity?.shortName} a ${toCity?.shortName}. Cuando varias personas piden la misma ruta, es la próxima que abrimos.`}
            </p>

            {nearbyDays.length > 0 && (
              <div className="mb-5">
                <p className="mb-2 text-[13px] font-semibold text-ink-900">
                  Sí hay viajes estos días:
                </p>
                <div className="flex flex-wrap gap-2">
                  {nearbyDays.map((day) => (
                    <button
                      key={day.date}
                      onClick={() => apply({ ...criteria, date: day.date })}
                      className="rounded-[12px] border border-ink-200 px-3.5 py-2 text-[13.5px] font-semibold transition-colors hover:border-accent hover:text-accent-ink"
                    >
                      {formatDayLabel(day.date)} · {day.count}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <AvisameForm
              originSlug={criteria.from}
              destinationSlug={criteria.to}
              corridorSlug={corridor?.slug}
              requestedDate={criteria.date}
              seats={criteria.seats}
              source="buscar"
            />
          </div>
        )}

        {corridor && (
          <div className="mt-8 rounded-[20px] border border-ink-200 bg-white p-5">
            <h2 className="mb-1.5 font-display text-[17px] font-bold">
              ¿Vas manejando por esta ruta?
            </h2>
            <p className="mb-4 max-w-[52ch] text-[14.5px] leading-relaxed text-ink-500">
              Hay gente buscando {corridor.origin.shortName} →{" "}
              {corridor.destination.shortName} justo ahora. Publicar toma menos
              de un minuto.
            </p>
            <ButtonLink href={`/publicar/nuevo?ruta=${corridor.slug}`}>
              Publicar mi viaje
            </ButtonLink>
          </div>
        )}

        {corridor && (
          <p className="mt-6 text-center text-[13.5px] text-ink-500">
            ¿Quieres saber más de esta ruta?{" "}
            <Link
              href={`/viajes/${corridor.slug}`}
              className="font-semibold text-accent-ink hover:underline"
            >
              Puntos de recogida, tiempos y cómo se calcula el aporte
            </Link>
          </p>
        )}
      </Container>
    </>
  );
}

function Filter({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-full border-[1.5px] px-3.5 py-2 text-[13.5px] font-semibold transition-colors ${
        active
          ? "border-ink-900 bg-ink-900 text-white"
          : "border-ink-200 bg-white text-ink-500 hover:border-accent hover:text-accent-ink"
      }`}
    >
      {children}
    </button>
  );
}
