"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { Icon } from "@/components/ui/Icon";
import { BookingPanel } from "@/components/trip/BookingPanel";
import { encuadre, linkPath, mapCity, MAP_LINKS } from "@/lib/map";
import { routePoints } from "@/lib/desvio";
import { findSegment } from "@/lib/segments";
import { formatDuration, formatUsd } from "@/lib/pricing";
import {
  formatDayLabel,
  formatTime,
  fullMatch,
  matchFor,
  type Trip,
} from "@/lib/trips";
import type { Corridor } from "@/lib/corridors";

/**
 * VIAJE — la fiche, version app.
 *
 * Elle répond dans cet ordre aux questions qu'on se pose vraiment avant
 * de monter dans la voiture d'un inconnu : par où on passe, à quelle
 * heure on me prend, qui conduit, dans quoi, et combien.
 *
 * L'EN-TÊTE N'EST PAS UNE PHOTO. La maquette montre une image ; nous
 * n'avons pas de photo de CE conducteur ni de CETTE voiture, et poser
 * une image de banque d'images en tête d'une fiche revient à laisser
 * croire que c'est la sienne. On met le trajet à la place — c'est ce
 * qu'on a de vrai, et c'est même plus utile.
 *
 * ELLE NE RÉIMPLÉMENTE RIEN. Le prix vient de `matchFor`, comme la
 * recherche et la carte ; la réservation est le `BookingPanel` du site,
 * tel quel, dans une feuille. Trois canaux de paiement, un plafond de
 * prix, un calcul de détour : c'est le code le plus délicat du produit,
 * et il n'en existe qu'un exemplaire.
 */

export function Viaje({ trip, corridor }: { trip: Trip; corridor: Corridor }) {
  const router = useRouter();
  const params = useSearchParams();
  const [abierto, setAbierto] = useState(false);

  const pedido = findSegment(
    trip.servedStops,
    params.get("desde") ?? "",
    params.get("hacia") ?? "",
  );
  /* Un lien tronqué ou partagé ne doit jamais mener à une page cassée :
     sans segment lisible, on retombe sur le trajet complet. */
  const match = (pedido && matchFor(trip, pedido)) ?? fullMatch(trip);
  if (!match) return null;

  const { segment } = match;
  const paradas = trip.servedStops.slice(
    segment.fromIndex,
    segment.toIndex + 1,
  );
  const caja = encuadre(
    paradas.map((p) => p.citySlug),
    { margen: 55, ratioMin: 1.7, ratioMax: 2.4 },
  );
  const puntos = paradas
    .map((p) => mapCity(p.citySlug))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  const minutos = Math.round(
    (new Date(match.droppingAt).getTime() -
      new Date(match.boardingAt).getTime()) /
      60_000,
  );
  const fecha = trip.departureAt.slice(0, 10);

  return (
    <div className="pb-[104px]">
      {/* L'EN-TÊTE : le tracé du segment réservé, et rien d'autre. */}
      <div className="relative bg-verde-perfil">
        {caja && (
          <svg
            viewBox={`${caja.x} ${caja.y} ${caja.w} ${caja.h}`}
            className="block w-full"
            aria-hidden
          >
            <g fill="none" strokeLinecap="round">
              {MAP_LINKS.map((l) => (
                <path
                  key={l.slug}
                  d={linkPath(l.from, l.to)}
                  stroke="#ffffff"
                  strokeOpacity={0.12}
                  strokeWidth={4}
                />
              ))}
              <path
                d={puntos.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")}
                stroke="#f26419"
                strokeWidth={9}
                strokeLinejoin="round"
              />
            </g>
            {puntos.map((p, i) => (
              <circle
                key={p.slug}
                cx={p.x}
                cy={p.y}
                r={i === 0 || i === puntos.length - 1 ? 13 : 8}
                fill={i === 0 ? "#ffffff" : i === puntos.length - 1 ? "#f26419" : "#ffffff"}
                fillOpacity={i === 0 || i === puntos.length - 1 ? 1 : 0.55}
              />
            ))}
          </svg>
        )}

        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Volver"
          className="absolute top-[calc(12px+env(safe-area-inset-top))] left-4 flex size-10 items-center justify-center rounded-full bg-white/90 text-ink-900 backdrop-blur-sm"
        >
          <Icon name="arrowRight" className="size-5 rotate-180" />
        </button>

        <div className="px-5 pt-3 pb-5 text-white">
          <p className="font-display text-[24px] leading-tight font-extrabold tracking-[-0.03em]">
            {segment.from.name} → {segment.to.name}
          </p>
          <p className="mt-1 text-[13.5px] text-white/75">
            {formatDayLabel(fecha)} · sale {formatTime(match.boardingAt)} ·{" "}
            {formatDuration(minutos)}
          </p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[520px] px-4 pt-4">
        {/* QUI MANEJA — avant le prix : on choisit une personne. */}
        <section className="rounded-[18px] border border-ink-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-verde-perfil font-display text-[18px] font-bold text-white">
              {trip.driver.initial}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-[17px] font-bold">
                {trip.driver.firstName} {trip.driver.lastInitial}.
              </p>
              <p className="flex items-center gap-1 text-[13px] text-ink-500">
                <Icon name="star" className="size-[13px] text-action" />
                <span className="tnum">{trip.driver.rating.toFixed(1)}</span>
                <span>({trip.driver.ridesCount} viajes)</span>
              </p>
            </div>
            {trip.driver.isVerified && (
              <span className="flex shrink-0 items-center gap-1 rounded-full bg-verde-suave px-2.5 py-1 text-[11.5px] font-bold text-verde-ok">
                <Icon name="shield" className="size-3.5" />
                Verificado
              </span>
            )}
          </div>

          <ul className="mt-3 grid gap-1.5 border-t border-ink-100 pt-3">
            {trip.driver.isSuperDriver && (
              <Linea icon="star">Super conductor — más de 50 viajes</Linea>
            )}
            <Linea icon="car">
              {trip.vehicle.make} {trip.vehicle.model} {trip.vehicle.year},{" "}
              {trip.vehicle.color}
            </Linea>
            {trip.womenOnly && (
              <Linea icon="users">Este viaje es solo para mujeres</Linea>
            )}
            <Linea icon="chat">
              El chat se abre en Mis viajes. Nadie da su número.
            </Linea>
          </ul>
        </section>

        {/* EL RECORRIDO — les heures de passage, arrêt par arrêt. */}
        <section className="mt-3 rounded-[18px] border border-ink-200 bg-white p-4">
          <h2 className="mb-3 font-display text-[16px] font-bold">
            El recorrido
          </h2>
          <ol className="grid gap-0">
            {paradas.map((p, i) => {
              const seg = findSegment(
                trip.servedStops,
                paradas[0].citySlug,
                p.citySlug,
              );
              const hasta = seg ? matchFor(trip, seg) : null;
              const ultimo = i === paradas.length - 1;
              return (
                <li key={p.citySlug} className="flex gap-3">
                  <span className="flex w-3 flex-col items-center">
                    <span
                      className={`mt-1.5 size-[9px] shrink-0 rounded-full ${
                        i === 0
                          ? "bg-verde-ok"
                          : ultimo
                            ? "bg-naranja"
                            : "bg-ink-300"
                      }`}
                    />
                    {!ultimo && <span className="w-px flex-1 bg-ink-200" />}
                  </span>
                  <span className={`min-w-0 flex-1 ${ultimo ? "" : "pb-4"}`}>
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="truncate text-[14.5px] font-semibold">
                        {p.name}
                      </span>
                      <span className="tnum shrink-0 text-[13px] text-ink-500">
                        {hasta ? formatTime(hasta.droppingAt) : ""}
                      </span>
                    </span>
                    {/* CE QUE ÇA COÛTE DE DESCENDRE LÀ. Le même calcul que
                        la carte des résultats — un seul moteur de prix. */}
                    {i > 0 && hasta && (
                      <span className="tnum block text-[12.5px] text-ink-400">
                        {formatUsd(hasta.priceCents)} desde {paradas[0].name}
                      </span>
                    )}
                  </span>
                </li>
              );
            })}
          </ol>
        </section>

        {/* EL APORTE — d'où il sort, en une phrase. */}
        <section className="mt-3 rounded-[18px] bg-naranja-suave p-4">
          <div className="flex items-baseline justify-between gap-3">
            <span className="font-display text-[15.5px] font-bold text-naranja-hondo">
              Aporte por puesto
            </span>
            <span className="tnum font-display text-[24px] font-extrabold text-naranja-hondo">
              {formatUsd(match.priceCents)}
            </span>
          </div>
          <p className="mt-1 text-[12.5px] leading-snug text-ink-600">
            Sale de los {Math.round(segment.km)} km de este tramo, del carro y
            de los peajes, repartidos entre los ocupantes. No sube con la
            demanda ni con la fecha.
          </p>
        </section>

        <p className="mt-3 px-1 text-[12px] leading-snug text-ink-400">
          {corridor.origin.shortName} → {corridor.destination.shortName} es el
          recorrido completo de {trip.driver.firstName}; tú vas de{" "}
          {segment.from.name} a {segment.to.name}.
        </p>
      </div>

      {/* LA BARRE DE RÉSERVATION. Elle est au-dessus de la barre
          d'onglets — sur cet écran, l'action est réserver, pas naviguer. */}
      <div className="fixed inset-x-0 bottom-0 z-[60] border-t border-ink-200 bg-white/95 px-4 pt-3 backdrop-blur-md" style={{ paddingBottom: "calc(12px + env(safe-area-inset-bottom))" }}>
        <div className="mx-auto flex w-full max-w-[520px] items-center gap-3">
          <span className="min-w-0">
            <span className="tnum block font-display text-[21px] leading-none font-extrabold">
              {formatUsd(match.priceCents)}
            </span>
            <span className="block text-[12px] text-ink-500">
              por puesto ·{" "}
              {match.seatsFree === 1
                ? "queda 1 puesto"
                : `quedan ${match.seatsFree} puestos`}
            </span>
          </span>
          <Dialog.Root open={abierto} onOpenChange={setAbierto}>
            <Dialog.Trigger asChild>
              <button
                type="button"
                disabled={match.seatsFree < 1}
                className="ml-auto flex h-[50px] flex-1 items-center justify-center gap-2 rounded-[16px] bg-naranja font-display text-[15.5px] font-bold text-white transition-colors hover:bg-naranja-hondo disabled:opacity-45"
              >
                {trip.instantBooking ? "Reservar" : "Pedir el puesto"}
                <Icon name="arrowRight" className="size-[17px]" />
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-[70] bg-ink-900/45" />
              <Dialog.Content className="hoja-abajo fixed inset-x-0 bottom-0 z-[80] max-h-[92vh] overflow-y-auto rounded-t-[24px] bg-ink-50 p-4">
                <div className="mx-auto w-full max-w-[520px]">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <Dialog.Title className="font-display text-[18px] font-bold">
                      Tu reserva
                    </Dialog.Title>
                    <Dialog.Close
                      aria-label="Cerrar"
                      className="flex size-9 items-center justify-center rounded-full text-ink-500 hover:bg-ink-100"
                    >
                      <Icon name="cross" className="size-5" />
                    </Dialog.Close>
                  </div>
                  <Dialog.Description className="sr-only">
                    Escoge cuántos puestos, dónde te recoge y cómo pagas.
                  </Dialog.Description>

                  {/* LE PANNEAU DU SITE, TEL QUEL. Les trois canaux de
                      paiement, le plafond de prix et le calcul de détour
                      vivent là — les recopier pour l'app aurait créé une
                      deuxième vérité sur l'argent. */}
                  <BookingPanel
                    key={`${trip.id}-${segment.fromIndex}-${segment.toIndex}`}
                    tripId={trip.id}
                    initialPoint={params.get("punto") ?? ""}
                    fromSlug={segment.from.citySlug}
                    toSlug={segment.to.citySlug}
                    boardingAt={match.boardingAt}
                    driverName={trip.driver.firstName}
                    priceCents={match.priceCents}
                    seatsLeft={match.seatsFree}
                    stops={
                      segment.fromIndex === 0
                        ? trip.stops
                        : segment.from.pickupPoints
                    }
                    citySlug={segment.from.citySlug}
                    baseKm={segment.km}
                    tollCents={segment.tollCents}
                    category={trip.vehicle.ratePerKmCents}
                    seatsOffered={trip.seatsOffered}
                    instantBooking={trip.instantBooking}
                    flexibleStops={trip.flexibleStops}
                    route={routePoints(trip.servedStops.map((s) => s.citySlug))}
                  />
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </div>

      {/* La sortie de secours vers la recherche : sur un lien ouvert de
          l'extérieur, `router.back()` n'a nulle part où revenir. */}
      <Link href="/" className="sr-only">
        Volver al inicio
      </Link>
    </div>
  );
}

function Linea({
  icon,
  children,
}: {
  icon: "star" | "car" | "users" | "chat";
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-start gap-2.5 text-[13.5px] leading-snug text-ink-600">
      <Icon name={icon} className="mt-0.5 size-4 shrink-0 text-ink-400" />
      {children}
    </li>
  );
}
