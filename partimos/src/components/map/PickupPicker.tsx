"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { formatUsd } from "@/lib/pricing";
import { quoteDetour, DETOUR_LIMITS } from "@/lib/detour";
import type { VehicleCategory } from "@/lib/pricing";

/**
 * Choix du point de prise en charge, présenté comme une ligne : les arrêts
 * habituels dans l'ordre où le conducteur les rencontre, plus la possibilité
 * de proposer le sien.
 *
 * SUR LE SUPPLÉMENT — la question qui revient toujours.
 * Un point personnalisé n'est pas facturé comme un service. Ce qui change,
 * c'est la DISTANCE du trajet, donc le coût réel, donc le plafond calculé par
 * la même formule que partout ailleurs. L'écart est porté par le passager qui
 * l'a demandé, jamais par le conducteur ni par les autres passagers.
 *
 * L'affichage dit donc « tu ajoutes 8,4 km » avant de dire combien ça fait,
 * et jamais « recogida a domicilio : +2 $ ». Ce n'est pas une pudeur de
 * langage : un service de prise en charge tarifé serait du transport
 * rémunéré, et c'est exactement la ligne que tout le modèle évite.
 */

type Props = {
  stops: string[];
  baseKm: number;
  tollCents: number;
  category?: VehicleCategory;
  seats?: number;
};

export function PickupPicker({
  stops,
  baseKm,
  tollCents,
  category = "standard",
  seats = 3,
}: Props) {
  const [selected, setSelected] = useState(0);
  const [custom, setCustom] = useState("");
  // Distance que le point proposé ajoute au trajet. Dans la version connectée,
  // elle vient du calcul d'itinéraire ; ici le passager l'estime au curseur,
  // ce qui montre honnêtement de quoi dépend le montant.
  const [extraKm, setExtraKm] = useState(6);
  const isCustom = selected === stops.length;

  const quote = quoteDetour(baseKm, tollCents, extraKm, category, seats);

  return (
    <div className="rounded-[20px] border border-ink-200 bg-white p-5">
      <h3 className="mb-1.5 font-display text-[18px] font-bold tracking-[-0.02em]">
        ¿Dónde te recogemos?
      </h3>
      <p className="mb-4 text-[13.5px] leading-relaxed text-ink-500">
        Estos son los puntos por donde el conductor ya va a pasar. Máximo cuatro
        por viaje, ninguno en terminal.
      </p>

      <ol className="relative mb-4">
        {/* La ligne verticale reprend le ruban d'asphalte : le trajet est une
            route, les arrêts sont des paradas. */}
        <span
          aria-hidden
          className="absolute top-3 bottom-3 left-[11px] w-0.5 rounded-full bg-ink-200"
        />
        {[...stops, "Propongo mi punto"].map((stop, index) => {
          const active = selected === index;
          const proposal = index === stops.length;
          return (
            <li key={stop} className="relative">
              <button
                type="button"
                aria-pressed={active}
                onClick={() => setSelected(index)}
                className={`flex w-full items-start gap-3.5 rounded-[12px] py-2.5 pr-3 pl-0 text-left transition-colors ${
                  active ? "bg-ink-50" : "hover:bg-ink-50/60"
                }`}
              >
                <span
                  aria-hidden
                  className={`relative z-[1] mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border-4 border-white ${
                    active
                      ? proposal
                        ? "bg-accent"
                        : "bg-brand-green"
                      : "bg-ink-300"
                  }`}
                />
                <span className="min-w-0 flex-1">
                  <span
                    className={`block text-[15px] ${active ? "font-semibold" : "font-medium text-ink-600"}`}
                  >
                    {stop}
                  </span>
                  {proposal && (
                    <span className="block text-[13px] leading-snug text-ink-500">
                      El conductor decide si le queda de paso
                    </span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      {isCustom ? (
        <div className="rounded-[16px] bg-ink-50 p-4">
          <label
            htmlFor="pickup-custom"
            className="mb-1.5 block text-[11.5px] font-bold tracking-[0.11em] text-ink-500 uppercase"
          >
            Tu punto
          </label>
          <input
            id="pickup-custom"
            type="text"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder="Ej. Vía Israel, frente al parque"
            className="mb-4 w-full rounded-[12px] border border-ink-200 bg-white px-3.5 py-2.5 text-[15px] font-medium focus:border-accent focus:outline-none"
          />

          <div className="mb-1.5 flex items-baseline justify-between">
            <label
              htmlFor="pickup-km"
              className="text-[11.5px] font-bold tracking-[0.11em] text-ink-500 uppercase"
            >
              Cuánto se desvía
            </label>
            <b className="tnum font-display text-[16px] font-bold">
              +{extraKm.toFixed(1)} km
            </b>
          </div>
          <input
            id="pickup-km"
            type="range"
            min={1}
            max={Math.round(baseKm * 0.22)}
            step={0.5}
            value={extraKm}
            onChange={(e) => setExtraKm(Number(e.target.value))}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-ink-200 [&::-moz-range-thumb]:size-6 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-4 [&::-moz-range-thumb]:border-accent [&::-moz-range-thumb]:bg-white [&::-webkit-slider-thumb]:size-6 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-accent [&::-webkit-slider-thumb]:bg-white"
          />

          <div
            className="mt-4 border-t border-ink-200 pt-3.5"
            aria-live="polite"
          >
            {quote.accepted ? (
              <>
                <dl className="text-[14px]">
                  <div className="flex justify-between gap-3 py-1">
                    <dt className="text-ink-500">Aporte de la ruta</dt>
                    <dd className="tnum font-semibold">
                      {formatUsd(quote.baseCents)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3 py-1">
                    <dt className="text-ink-500">
                      Tu desvío suma {extraKm.toFixed(1)} km al recorrido
                    </dt>
                    <dd className="tnum font-semibold">
                      +{formatUsd(quote.extraCents)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3 border-t border-ink-200 py-2">
                    <dt className="font-semibold">Tu aporte</dt>
                    <dd className="tnum font-display text-[17px] font-bold">
                      {formatUsd(quote.requesterCents)}
                    </dd>
                  </div>
                </dl>
                <p className="mt-2 text-[12.5px] leading-relaxed text-ink-500">
                  No es un cargo por recogerte: es el costo de los kilómetros de
                  más, y lo pone quien los pidió. Los demás pasajeros siguen
                  aportando {formatUsd(quote.baseCents)}, y el conductor no
                  pierde nada por hacerte el favor.
                </p>
              </>
            ) : (
              <p className="flex items-start gap-2.5 text-[14px] leading-relaxed text-danger">
                <Icon name="cross" className="mt-0.5 size-4 shrink-0" />
                {quote.reason}
              </p>
            )}
          </div>
        </div>
      ) : (
        <p className="rounded-[16px] bg-ink-50 px-4 py-3.5 text-[14px] leading-relaxed text-ink-500">
          Este punto está en el camino del conductor, así que no cambia nada:
          aportas{" "}
          <b className="tnum font-semibold text-ink-900">
            {formatUsd(quote.baseCents)}
          </b>
          , igual que los demás.
        </p>
      )}

      <p className="mt-3.5 text-[12px] leading-relaxed text-ink-500">
        Un desvío se rechaza si pasa del {DETOUR_LIMITS.maxExtraKmPct} % del
        kilometraje o de {DETOUR_LIMITS.maxExtraMinutes} minutos. Si la hora de
        llegada se mueve más de {DETOUR_LIMITS.notifyPassengersAfterMinutes}{" "}
        minutos, avisamos a quien ya reservó y puede cancelar sin costo.
      </p>
    </div>
  );
}
