"use client";

import { useSearchParams } from "next/navigation";
import { BookingPanel } from "@/components/trip/BookingPanel";
import type { Corridor } from "@/lib/corridors";
import { formatDuration, formatUsd } from "@/lib/pricing";
import { findSegment, segmentCap } from "@/lib/segments";
import {
  formatDayLabel,
  formatTime,
  fullMatch,
  matchFor,
  type Trip,
  type TripMatch,
} from "@/lib/trips";

/**
 * PAGE DU TRAJET, VUE PAR SEGMENT
 *
 * Un même trajet se lit différemment selon d'où l'on vient. Celui qui cherche
 * Penonomé → Santiago ne veut pas voir « Panamá → David » en titre : il veut
 * savoir à quelle heure on passe le prendre, où on le laisse, et combien il
 * donne pour CES kilomètres-là.
 *
 * Mais il doit aussi voir le trajet complet — c'est ce qui rend l'horaire
 * crédible et permet de juger d'un retard possible. On affiche donc tout
 * l'itinéraire, avec la portion réservée en évidence et le reste en retrait.
 *
 * Le segment vient de l'URL (`?desde=&hacia=`). Sans paramètres, ou avec des
 * villes que ce conducteur ne dessert pas, on retombe sur le trajet complet :
 * un lien partagé ou tronqué ne doit jamais mener à une page cassée.
 */
export function TripDetail({
  trip,
  corridor,
  children,
}: {
  trip: Trip;
  corridor: Corridor;
  /** La fiche du conducteur, rendue côté serveur. */
  children: React.ReactNode;
}) {
  const params = useSearchParams();
  const requested = findSegment(
    trip.servedStops,
    params.get("desde") ?? "",
    params.get("hacia") ?? "",
  );

  const match: TripMatch | null =
    (requested && matchFor(trip, requested)) ?? fullMatch(trip);
  if (!match) return null;

  const { segment } = match;
  const date = trip.departureAt.slice(0, 10);
  const cap = segmentCap(segment, trip.vehicle.category, trip.seatsOffered);
  const durationMin = Math.round(
    (new Date(match.droppingAt).getTime() -
      new Date(match.boardingAt).getTime()) /
      60_000,
  );

  return (
    <div className="grid gap-5 min-[900px]:grid-cols-[1.35fr_1fr] min-[900px]:items-start">
      <div className="grid gap-5">
        {/* --- Itinéraire --- */}
        <section className="border border-plate-200 bg-white p-5 sm:p-6">
          <p className="mb-1 text-[11.5px] font-bold tracking-[0.14em] text-plate-600 uppercase">
            {formatDayLabel(date)}
          </p>
          <h1 className="mb-1 text-[clamp(24px,4.6vw,32px)] leading-tight font-extrabold tracking-[-0.035em]">
            {segment.from.name} → {segment.to.name}
          </h1>
          <p className="cote mb-5 text-[14px] text-plate-600">
            {segment.km} km · {formatDuration(durationMin)} de camino
            {match.isPartial && (
              <>
                {" "}
                · tramo de un viaje {trip.servedStops[0].name} →{" "}
                {trip.servedStops[trip.servedStops.length - 1].name}
              </>
            )}
          </p>

          <ol className="relative">
            <span
              aria-hidden
              className="absolute top-4 bottom-4 left-[62px] w-0.5 rounded-full bg-plate-200 sm:left-[70px]"
            />
            {trip.servedStops.map((stop, index) => {
              const inSegment =
                index >= segment.fromIndex && index <= segment.toIndex;
              const isBoarding = index === segment.fromIndex;
              const isDropping = index === segment.toIndex;

              return (
                <Stop
                  key={stop.citySlug}
                  time={formatTime(timeAt(trip, corridor, stop.km))}
                  title={stop.name}
                  detail={
                    isBoarding
                      ? index === 0
                        ? `Salida · ${trip.stops[0] ?? "punto por confirmar"}`
                        : "Aquí te recoge"
                      : isDropping
                        ? index === trip.servedStops.length - 1
                          ? "Llegada estimada"
                          : "Aquí te bajas"
                        : inSegment
                          ? "Parada en el camino"
                          : "Pasa por aquí sin ti"
                  }
                  tone={
                    isBoarding
                      ? "start"
                      : isDropping
                        ? "end"
                        : inSegment
                          ? "on"
                          : "off"
                  }
                />
              );
            })}
          </ol>
        </section>

        {children}

        {/* --- Comment se calcule le montant --- */}
        <section className="border border-plate-200 bg-white p-5 sm:p-6">
          <h2 className="mb-4 text-[18px] font-bold">
            De dónde sale ese monto
          </h2>
          <dl className="text-[14.5px]">
            <Row
              label={
                segment.tollCents > 0
                  ? `${segment.km} km de recorrido, más peajes`
                  : `${segment.km} km de recorrido, sin peajes en ese tramo`
              }
            >
              {formatUsd(cap.costTotalCents)}
            </Row>
            <Row label={`Entre ${cap.occupants} ocupantes, con el conductor`}>
              {formatUsd(cap.maxPriceCents)}
            </Row>
            <Row label="Tope de la plataforma" strong>
              {formatUsd(cap.maxPriceCents)}
            </Row>
            <Row label={`${trip.driver.firstName} pide`} strong>
              {formatUsd(match.priceCents)}
            </Row>
          </dl>
          <p className="mt-3 text-[13px] leading-relaxed text-plate-600">
            {match.isPartial
              ? `Pagas los kilómetros que viajas, no el viaje completo de ${trip.driver.firstName}. `
              : ""}
            {trip.driver.firstName} no gana plata con este viaje. El monto cubre
            gasolina y peajes, y la app lo limita para que así sea.
          </p>
        </section>
      </div>

      <BookingPanel
        tripId={trip.id}
        driverName={trip.driver.firstName}
        priceCents={match.priceCents}
        seatsLeft={match.seatsFree}
        // Les points de rendez-vous sont ceux de la ville où l'on monte. Au
        // départ, ce sont ceux que le conducteur a déclarés ; en cours de
        // route, ceux de la ville — proposer Costa del Este à quelqu'un qui
        // monte à Penonomé n'a aucun sens.
        stops={segment.fromIndex === 0 ? trip.stops : segment.from.pickupPoints}
        baseKm={segment.km}
        tollCents={segment.tollCents}
        category={trip.vehicle.category}
        seatsOffered={trip.seatsOffered}
        instantBooking={trip.instantBooking}
      />
    </div>
  );
}

/** Heure de passage à un kilomètre du corridor — même règle que la recherche. */
function timeAt(trip: Trip, corridor: Corridor, km: number): string {
  const minutes = Math.round(
    (km / corridor.distanceKm) * corridor.typicalDurationMin,
  );
  return new Date(
    new Date(trip.departureAt).getTime() + minutes * 60_000,
  ).toISOString();
}

function Stop({
  time,
  title,
  detail,
  tone,
}: {
  time: string;
  title: string;
  detail: string;
  tone: "start" | "end" | "on" | "off";
}) {
  // Les arrêts hors du segment réservé s'effacent : ils expliquent l'horaire
  // sans se disputer l'attention avec la montée et la descente, les deux
  // seules lignes que le passager doit retenir.
  //
  // Effacer par la COULEUR et non par l'opacité : un `opacity-55` sur un texte
  // déjà secondaire le fait tomber sous le contraste AA, et axe le signalait.
  // Un ton du nuancier reste sous contrôle.
  const off = tone === "off";
  const dot = {
    start: "bg-ochre-500",
    end: "bg-plate-500",
    on: "bg-plate-300",
    off: "bg-plate-200",
  }[tone];

  return (
    <li className="flex gap-4">
      <span
        className={`cote w-[50px] shrink-0 pt-0.5 text-right text-[16px] font-bold sm:w-[58px] ${off ? "text-plate-600" : ""}`}
      >
        {time}
      </span>
      <span
        aria-hidden
        className={`relative z-[1] mt-1.5 size-3.5 shrink-0 rounded-full border-[3px] border-white ${dot}`}
      />
      <span className="min-w-0 flex-1 pb-3">
        <span
          className={`block text-[16px] ${off ? "font-semibold text-plate-600" : "font-bold"}`}
        >
          {title}
        </span>
        <span className="block text-[13.5px] text-plate-600">{detail}</span>
      </span>
    </li>
  );
}

function Row({
  label,
  children,
  strong = false,
}: {
  label: string;
  children: React.ReactNode;
  strong?: boolean;
}) {
  return (
    <div
      className={`flex justify-between gap-4 py-2 ${strong ? "border-t border-plate-200 font-semibold" : ""}`}
    >
      <dt className={strong ? "text-plate-900" : "text-plate-600"}>{label}</dt>
      <dd className="cote text-right whitespace-nowrap">{children}</dd>
    </div>
  );
}
