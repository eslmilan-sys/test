import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/site/Section";
import { Icon } from "@/components/ui/Icon";
import { TripDetail } from "@/components/trip/TripDetail";
import { getCorridor } from "@/lib/corridors";
import { demoTripIds, getTrip } from "@/lib/trips";

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

        {/* Le segment réservé vient de l'URL, donc du client. Le repli montre
            la structure de la page pendant l'hydratation plutôt qu'un vide qui
            ferait sauter la mise en page. */}
        <Suspense fallback={<DetailSkeleton />}>
          <TripDetail trip={trip} corridor={corridor}>
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
          </TripDetail>
        </Suspense>
      </Container>
    </main>
  );
}

function DetailSkeleton() {
  return (
    <div
      aria-hidden
      className="grid gap-5 min-[900px]:grid-cols-[1.35fr_1fr] min-[900px]:items-start"
    >
      <div className="grid gap-5">
        <div className="h-[340px] rounded-[20px] border border-ink-200 bg-white" />
        <div className="h-[220px] rounded-[20px] border border-ink-200 bg-white" />
        <div className="h-[260px] rounded-[20px] border border-ink-200 bg-white" />
      </div>
      <div className="h-[520px] rounded-[20px] border border-ink-200 bg-white" />
    </div>
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
