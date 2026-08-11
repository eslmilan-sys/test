"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { AuthDialog } from "@/components/site/AuthDialog";
import { useSession } from "@/lib/session";
import { formatUsd, type VehicleCategory } from "@/lib/pricing";
import { quoteDetour } from "@/lib/detour";
import { bookingDisclaimer } from "@/lib/content";

/**
 * Panneau de réservation.
 *
 * Trois choses doivent tenir ensemble sans que l'utilisateur ait à chercher :
 * le montant, le point de prise en charge, et le fait que RIEN n'est prélevé
 * ici. La dernière est celle qui rassure le plus dans un modèle sans paiement
 * en ligne, donc elle est écrite à côté du bouton, pas en bas de page.
 *
 * La connexion est demandée AU MOMENT de réserver, pas à l'entrée du site :
 * on laisse chercher, comparer et calculer sans compte. Un mur de connexion
 * à l'accueil coûte plus de visiteurs qu'il n'en qualifie.
 */

type Props = {
  tripId: string;
  driverName: string;
  priceCents: number;
  seatsLeft: number;
  stops: string[];
  baseKm: number;
  tollCents: number;
  category: VehicleCategory | number;
  seatsOffered: number;
  instantBooking: boolean;
};

export function BookingPanel({
  driverName,
  priceCents,
  seatsLeft,
  stops,
  baseKm,
  tollCents,
  category,
  seatsOffered,
  instantBooking,
}: Props) {
  const { session, isDemo } = useSession();
  const [seats, setSeats] = useState(1);
  const [stopIndex, setStopIndex] = useState(0);
  const [customPoint, setCustomPoint] = useState("");
  const [extraKm, setExtraKm] = useState(5);
  const [booked, setBooked] = useState(false);

  const isCustom = stopIndex === stops.length;
  const quote = quoteDetour(baseKm, tollCents, extraKm, category, seatsOffered);
  const unitCents = isCustom ? priceCents + quote.extraCents : priceCents;
  const totalCents = unitCents * seats;
  const blocked = isCustom && !quote.accepted;

  if (booked) {
    return (
      <aside className="rounded-[20px] border border-ink-200 bg-white p-6 min-[900px]:sticky min-[900px]:top-[80px]">
        <span className="mb-3 flex size-11 items-center justify-center rounded-full bg-ink-900 text-white">
          <Icon name="check" className="size-5" />
        </span>
        <h2 className="mb-2 font-display text-[20px] font-bold">
          {instantBooking ? "Puesto confirmado" : "Solicitud enviada"}
        </h2>
        <p className="mb-4 text-[14.5px] leading-relaxed text-ink-500">
          {instantBooking
            ? `Ya tienes tu puesto. Te compartimos el número de ${driverName} para que coordinen la hora y el punto exacto.`
            : `${driverName} tiene 24 horas para confirmarte. Te avisamos por WhatsApp apenas responda.`}
        </p>
        {instantBooking && (
          <p className="tnum mb-4 inline-flex items-center gap-2 rounded-[10px] bg-ink-50 px-3 py-2 text-[14px] font-semibold">
            <Icon name="phone" className="size-4" />
            {driverName} · +507 6XXX-4471
          </p>
        )}
        <p className="rounded-[14px] bg-ink-50 px-4 py-3 text-[13.5px] leading-relaxed text-ink-500">
          <b className="font-semibold text-ink-900">No pagaste nada aquí.</b> Le
          entregas {formatUsd(totalCents)} a {driverName} el día del viaje, en
          efectivo o por Yappy.
        </p>
      </aside>
    );
  }

  return (
    <aside className="rounded-[20px] border border-ink-200 bg-white p-5 sm:p-6 min-[900px]:sticky min-[900px]:top-[80px]">
      <div className="flex items-baseline justify-between gap-3">
        <span className="tnum font-display text-[30px] font-extrabold tracking-[-0.035em]">
          {formatUsd(unitCents)}
        </span>
        <span className="text-[13.5px] text-ink-500">por puesto</span>
      </div>
      <p className="mt-1 mb-5 text-[13px] text-ink-500">
        {seatsLeft === 1 ? "Queda 1 puesto" : `Quedan ${seatsLeft} puestos`} ·{" "}
        {instantBooking ? "Reserva al instante" : "El conductor confirma"}
      </p>

      <label className="mb-4 block">
        <span className="mb-1.5 block text-[11.5px] font-bold tracking-[0.11em] text-ink-500 uppercase">
          Cuántos puestos
        </span>
        <select
          value={seats}
          onChange={(e) => setSeats(Number(e.target.value))}
          className="w-full cursor-pointer rounded-[12px] border border-ink-200 px-3.5 py-2.5 text-[15px] font-semibold focus:border-accent focus:outline-none"
        >
          {Array.from({ length: seatsLeft }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n} {n === 1 ? "puesto" : "puestos"}
            </option>
          ))}
        </select>
      </label>

      <fieldset className="mb-4">
        <legend className="mb-1.5 text-[11.5px] font-bold tracking-[0.11em] text-ink-500 uppercase">
          Dónde te recoge
        </legend>
        <div className="grid gap-1.5">
          {[...stops, "Propongo mi punto"].map((stop, index) => (
            <label
              key={stop}
              className={`flex cursor-pointer items-center gap-2.5 rounded-[12px] border px-3.5 py-2.5 text-[14.5px] transition-colors ${
                stopIndex === index
                  ? "border-ink-900 bg-ink-50 font-semibold"
                  : "border-ink-200 hover:border-accent"
              }`}
            >
              <input
                type="radio"
                name="stop"
                checked={stopIndex === index}
                onChange={() => setStopIndex(index)}
                className="sr-only"
              />
              <span
                aria-hidden
                className={`size-3.5 shrink-0 rounded-full border-[3px] ${
                  stopIndex === index
                    ? "border-ink-900 bg-white"
                    : "border-ink-200"
                }`}
              />
              {stop}
            </label>
          ))}
        </div>
      </fieldset>

      {isCustom && (
        <div className="mb-4 rounded-[14px] bg-ink-50 p-4">
          <input
            type="text"
            value={customPoint}
            onChange={(e) => setCustomPoint(e.target.value)}
            placeholder="Ej. Vía Israel, frente al parque"
            aria-label="Tu punto de recogida"
            className="mb-3 w-full rounded-[10px] border border-ink-200 bg-white px-3 py-2 text-[14.5px] focus:border-accent focus:outline-none"
          />
          <div className="mb-1 flex items-baseline justify-between">
            <label
              htmlFor="book-km"
              className="text-[12px] font-semibold text-ink-500"
            >
              Cuánto se desvía
            </label>
            <b className="tnum text-[14px]">+{extraKm.toFixed(1)} km</b>
          </div>
          <input
            id="book-km"
            type="range"
            min={1}
            max={Math.round(baseKm * 0.22)}
            step={0.5}
            value={extraKm}
            onChange={(e) => setExtraKm(Number(e.target.value))}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-ink-200 [&::-moz-range-thumb]:size-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-4 [&::-moz-range-thumb]:border-accent [&::-moz-range-thumb]:bg-white [&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-accent [&::-webkit-slider-thumb]:bg-white"
          />
          <p
            className="mt-2 text-[12.5px] leading-relaxed text-ink-500"
            aria-live="polite"
          >
            {quote.accepted ? (
              <>
                Los kilómetros de más los pones tú, no el conductor:{" "}
                <b className="font-semibold text-ink-900">
                  +{formatUsd(quote.extraCents)}
                </b>{" "}
                sobre el aporte de la ruta. No es un cargo por recogerte.
              </>
            ) : (
              <span className="text-danger">{quote.reason}</span>
            )}
          </p>
        </div>
      )}

      <dl className="mb-4 border-t border-ink-200 pt-3.5 text-[14.5px]">
        <div className="flex justify-between gap-3 py-1">
          <dt className="text-ink-500">
            {seats} × {formatUsd(unitCents)}
          </dt>
          <dd className="tnum font-semibold">{formatUsd(totalCents)}</dd>
        </div>
        <div className="flex justify-between gap-3 py-1">
          <dt className="text-ink-500">Comisión de Partimos</dt>
          <dd className="tnum font-semibold">$0.00</dd>
        </div>
        <div className="flex justify-between gap-3 border-t border-ink-200 py-2">
          <dt className="font-semibold">Le entregas al conductor</dt>
          <dd className="tnum font-display text-[18px] font-bold">
            {formatUsd(totalCents)}
          </dd>
        </div>
      </dl>

      {session ? (
        <Button
          size="lg"
          full
          disabled={blocked}
          onClick={() => setBooked(true)}
        >
          {instantBooking ? "Reservar mi puesto" : "Pedir el puesto"}
        </Button>
      ) : (
        <AuthDialog
          trigger={
            <button
              disabled={blocked}
              className="inline-flex w-full items-center justify-center rounded-[14px] bg-ink-900 px-7 py-4 font-display text-[17px] font-bold text-white transition-colors hover:bg-ink-800 disabled:pointer-events-none disabled:opacity-50"
            >
              Entrar y reservar
            </button>
          }
        />
      )}

      <p className="mt-3 text-center text-[12.5px] leading-relaxed text-ink-500">
        Reservar es gratis y no pide tarjeta.
      </p>

      <p className="mt-4 rounded-[14px] bg-ink-50 px-4 py-3 text-[13px] leading-relaxed text-ink-500">
        {bookingDisclaimer(driverName)}
      </p>

      {isDemo && (
        <p className="mt-3 text-center text-[12px] text-ink-500">
          Modo demostración: no se crea ninguna cuenta ni reserva real.
        </p>
      )}
    </aside>
  );
}
