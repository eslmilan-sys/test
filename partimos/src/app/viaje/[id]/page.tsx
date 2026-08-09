import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/site/Section";
import { Icon } from "@/components/ui/Icon";
import { BookingPanel } from "@/components/trip/BookingPanel";
import { getCorridor } from "@/lib/corridors";
import { computePriceCap, formatDuration, formatUsd } from "@/lib/pricing";
import {
  demoTripIds,
  formatDayLabel,
  formatTime,
  getTrip,
  seatsLeft,
} from "@/lib/trips";

export const dynamicParams = false;

export function generateStaticParams() {
  return demoTripIds().map((id) => ({ id }));
}

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const trip = getTrip(id);
  const corridor = trip && getCorridor(trip.corridorSlug);
  if (!trip || !corridor) return {};
  return {
    title: `${corridor.origin.shortName} → ${corridor.destination.shortName} con ${trip.driver.firstName}`,
    robots: { index: false, follow: true },
  };
}

export default async function TripPage({ params }: Params) {
  const { id } = await params;
  const trip = getTrip(id);
  if (!trip) notFound();
  const corridor = getCorridor(trip.corridorSlug);
  if (!corridor) notFound();

  const date = trip.departureAt.slice(0, 10);
  const left = seatsLeft(trip);
  const cap = computePriceCap(
    corridor.distanceKm,
    corridor.tollCents,
    trip.vehicle.category,
    trip.seatsOffered,
  );
  const durationMin = Math.round(
    (new Date(trip.arrivalAt).getTime() -
      new Date(trip.departureAt).getTime()) /
      60_000,
  );

  return (
    <main id="contenido" className="bg-ink-50 pb-16">
      <Container className="pt-5">
        <nav
          aria-label="Ruta de navegación"
          className="mb-4 text-[13px] text-ink-500"
        >
          <Link
            href={`/buscar?desde=${corridor.origin.slug}&hacia=${corridor.destination.slug}&fecha=${date}`}
            className="inline-flex items-center gap-1.5 py-1 font-semibold hover:text-ink-900"
          >
            <Icon name="arrowRight" className="size-4 rotate-180" />
            Volver a los resultados
          </Link>
        </nav>

        <div className="grid gap-5 min-[900px]:grid-cols-[1.35fr_1fr] min-[900px]:items-start">
          <div className="grid gap-5">
            {/* --- Itinéraire --- */}
            <section className="rounded-[20px] border border-ink-200 bg-white p-5 sm:p-6">
              <p className="mb-1 text-[11.5px] font-bold tracking-[0.14em] text-ink-500 uppercase">
                {formatDayLabel(date)}
              </p>
              <h1 className="mb-5 font-display text-[clamp(24px,4.6vw,32px)] leading-tight font-extrabold tracking-[-0.035em]">
                {corridor.origin.shortName} → {corridor.destination.shortName}
              </h1>

              <ol className="relative">
                <span
                  aria-hidden
                  className="absolute top-4 bottom-4 left-[62px] w-0.5 rounded-full bg-ink-200 sm:left-[70px]"
                />
                <Leg
                  time={formatTime(trip.departureAt)}
                  title={corridor.origin.name}
                  detail={`Salida · ${trip.stops[0] ?? "punto por confirmar"}`}
                  tone="start"
                />
                <li className="flex gap-4 py-1">
                  <span className="w-[50px] shrink-0 sm:w-[58px]" />
                  <span className="tnum py-2 text-[13px] text-ink-500">
                    {formatDuration(durationMin)} de camino
                  </span>
                </li>
                <Leg
                  time={formatTime(trip.arrivalAt)}
                  title={corridor.destination.name}
                  detail="Llegada estimada"
                  tone="end"
                />
              </ol>
            </section>

            {/* --- Conducteur --- */}
            <section className="rounded-[20px] border border-ink-200 bg-white p-5 sm:p-6">
              <h2 className="mb-4 font-display text-[18px] font-bold">
                Quién maneja
              </h2>
              <div className="flex items-center gap-4">
                <span
                  aria-hidden
                  className="brand-gradient flex size-14 shrink-0 items-center justify-center rounded-full font-display text-[21px] font-bold text-white"
                >
                  {trip.driver.initial}
                </span>
                <div className="min-w-0">
                  <p className="font-display text-[19px] font-bold">
                    {trip.driver.firstName} {trip.driver.lastInitial}.
                  </p>
                  <p className="tnum flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[13.5px] text-ink-500">
                    <span className="flex items-center gap-1">
                      <Icon name="star" className="size-3.5" />
                      {trip.driver.rating.toFixed(1)}
                    </span>
                    · {trip.driver.ridesCount} viajes
                  </p>
                </div>
              </div>

              <ul className="mt-4 grid gap-2 border-t border-ink-200 pt-4">
                {trip.driver.isVerified && (
                  <Badge icon="id">
                    Cédula verificada por un proveedor externo
                  </Badge>
                )}
                {trip.driver.isSuperDriver && (
                  <Badge icon="star">
                    Super conductor — más de 50 viajes sin incidencias
                  </Badge>
                )}
                <Badge icon="car">
                  {trip.vehicle.make} {trip.vehicle.model} {trip.vehicle.color}
                </Badge>
                {trip.womenOnly && (
                  <Badge icon="users">Este viaje es solo para mujeres</Badge>
                )}
              </ul>
            </section>

            {/* --- Comment se calcule le montant --- */}
            <section className="rounded-[20px] border border-ink-200 bg-white p-5 sm:p-6">
              <h2 className="mb-4 font-display text-[18px] font-bold">
                De dónde sale ese monto
              </h2>
              <dl className="text-[14.5px]">
                <Row
                  label={`${corridor.distanceKm} km de recorrido, más peajes`}
                >
                  {formatUsd(cap.costTotalCents)}
                </Row>
                <Row
                  label={`Entre ${cap.occupants} ocupantes, con el conductor`}
                >
                  {formatUsd(cap.maxPriceCents)}
                </Row>
                <Row label="Tope de la plataforma" strong>
                  {formatUsd(cap.maxPriceCents)}
                </Row>
                <Row label={`${trip.driver.firstName} pide`} strong>
                  {formatUsd(trip.priceCents)}
                </Row>
              </dl>
              <p className="mt-3 text-[13px] leading-relaxed text-ink-500">
                {trip.driver.firstName} no gana plata con este viaje. El monto
                cubre gasolina y peajes, y la app lo limita para que así sea.
              </p>
            </section>
          </div>

          <BookingPanel
            tripId={trip.id}
            driverName={trip.driver.firstName}
            priceCents={trip.priceCents}
            seatsLeft={left}
            stops={trip.stops}
            baseKm={corridor.distanceKm}
            tollCents={corridor.tollCents}
            category={trip.vehicle.category}
            seatsOffered={trip.seatsOffered}
            instantBooking={trip.instantBooking}
          />
        </div>
      </Container>
    </main>
  );
}

function Leg({
  time,
  title,
  detail,
  tone,
}: {
  time: string;
  title: string;
  detail: string;
  tone: "start" | "end";
}) {
  return (
    <li className="flex gap-4">
      <span className="tnum w-[50px] shrink-0 pt-0.5 text-right font-display text-[16px] font-bold sm:w-[58px]">
        {time}
      </span>
      <span
        aria-hidden
        className={`relative z-[1] mt-1.5 size-3.5 shrink-0 rounded-full border-[3px] border-white ${
          tone === "start" ? "bg-accent" : "bg-brand-green-deep"
        }`}
      />
      <span className="min-w-0 flex-1 pb-1">
        <span className="block font-display text-[16px] font-bold">
          {title}
        </span>
        <span className="block text-[13.5px] text-ink-500">{detail}</span>
      </span>
    </li>
  );
}

function Badge({
  icon,
  children,
}: {
  icon: "id" | "star" | "car" | "users";
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-center gap-2.5 text-[14px] text-ink-600">
      <Icon name={icon} className="size-4.5 shrink-0 text-ink-500" />
      {children}
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
      className={`flex justify-between gap-4 py-2 ${strong ? "border-t border-ink-200 font-semibold" : ""}`}
    >
      <dt className={strong ? "text-ink-900" : "text-ink-500"}>{label}</dt>
      <dd className="tnum text-right whitespace-nowrap">{children}</dd>
    </div>
  );
}
