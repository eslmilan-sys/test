import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { formatUsd, formatDuration } from "@/lib/pricing";
import { getCorridor } from "@/lib/corridors";
import { formatTime, seatsLeft, type Trip } from "@/lib/trips";

/**
 * Carte de trajet.
 *
 * La colonne de gauche est une échelle de temps : heure de départ, durée,
 * heure d'arrivée, reliées par un trait. On lit « quand je pars, quand
 * j'arrive » d'un seul coup d'œil, avant même le prix — c'est l'ordre dans
 * lequel on décide.
 *
 * Le prix est en gras à droite, aligné en chiffres tabulaires pour que les
 * montants se comparent verticalement d'une carte à l'autre.
 */
export function TripCard({ trip }: { trip: Trip }) {
  const corridor = getCorridor(trip.corridorSlug);
  if (!corridor) return null;

  const left = seatsLeft(trip);
  const durationMin = Math.round(
    (new Date(trip.arrivalAt).getTime() -
      new Date(trip.departureAt).getTime()) /
      60_000,
  );

  return (
    <Link
      href={`/viaje/${trip.id}`}
      className="group block rounded-[18px] border border-ink-200 bg-white p-4 transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-accent hover:shadow-card sm:p-5"
    >
      <div className="flex gap-4">
        {/* Échelle de temps */}
        <div className="flex shrink-0 flex-col items-center pt-1">
          <span className="tnum font-display text-[17px] font-bold">
            {formatTime(trip.departureAt)}
          </span>
          <span
            aria-hidden
            className="my-1 w-0.5 flex-1 rounded-full bg-ink-200"
            style={{ minHeight: 26 }}
          />
          <span className="tnum font-display text-[17px] font-bold">
            {formatTime(trip.arrivalAt)}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-display text-[16px] font-bold tracking-[-0.015em]">
                {corridor.origin.shortName}
              </p>
              <p className="tnum mb-1.5 text-[12.5px] text-ink-500">
                {formatDuration(durationMin)} de camino
              </p>
              <p className="truncate font-display text-[16px] font-bold tracking-[-0.015em]">
                {corridor.destination.shortName}
              </p>
            </div>

            <div className="shrink-0 text-right">
              <p className="tnum font-display text-[22px] font-extrabold tracking-[-0.03em]">
                {formatUsd(trip.priceCents)}
              </p>
              <p className="text-[11.5px] text-ink-500">por puesto</p>
            </div>
          </div>

          <div className="mt-3.5 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-ink-200 pt-3.5">
            <span
              aria-hidden
              className="brand-gradient flex size-8 shrink-0 items-center justify-center rounded-full font-display text-[13px] font-bold text-white"
            >
              {trip.driver.initial}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[14.5px] font-semibold">
                {trip.driver.firstName} {trip.driver.lastInitial}.
              </span>
              <span className="tnum flex items-center gap-1 text-[12.5px] text-ink-500">
                <Icon name="star" className="size-3.5" />
                {trip.driver.rating.toFixed(1)} · {trip.driver.ridesCount}{" "}
                viajes
              </span>
            </span>

            <span className="ml-auto flex flex-wrap items-center justify-end gap-1.5">
              {trip.driver.isSuperDriver && (
                <Chip tone="brand">Super conductor</Chip>
              )}
              {trip.womenOnly && <Chip>Solo mujeres</Chip>}
              {trip.instantBooking && <Chip>Reserva al instante</Chip>}
              <Chip tone={left === 1 ? "urgent" : "plain"}>
                {left === 1 ? "Queda 1 puesto" : `${left} puestos`}
              </Chip>
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function Chip({
  children,
  tone = "plain",
}: {
  children: React.ReactNode;
  tone?: "plain" | "brand" | "urgent";
}) {
  const styles = {
    plain: "bg-ink-50 text-ink-600",
    brand: "bg-accent-soft text-accent-ink",
    // Le seul état qui mérite d'être signalé par une couleur : il change
    // la décision (réserver maintenant ou pas).
    urgent: "bg-danger-soft text-danger",
  } as const;
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[11.5px] font-semibold whitespace-nowrap ${styles[tone]}`}
    >
      {children}
    </span>
  );
}
