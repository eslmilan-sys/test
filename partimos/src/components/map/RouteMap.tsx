"use client";

import { useId } from "react";
import {
  MAP_CITIES,
  MAP_LINKS,
  MAP_VIEWBOX,
  linkPath,
  mapCity,
} from "@/lib/map";
import { MAPBOX_TOKEN, panamaOverviewUrl } from "@/lib/mapbox";

/**
 * Carte des corridors — sélection de l'origine et de la destination.
 *
 * Elle sert de contrôle de formulaire, pas d'illustration : chaque ville est
 * un <button> avec son état pressé, donc atteignable au clavier et annoncé
 * par un lecteur d'écran. Les listes déroulantes restent en place à côté ;
 * la carte est une seconde voie vers la même valeur, jamais la seule.
 */

type Props = {
  originSlug: string;
  destinationSlug: string;
  onPick: (slug: string) => void;
  /** Ce que le prochain clic va renseigner. */
  picking: "origin" | "destination";
  className?: string;
};

export function RouteMap({
  originSlug,
  destinationSlug,
  onPick,
  picking,
  className = "",
}: Props) {
  const id = useId();
  const origin = mapCity(originSlug);
  const destination = mapCity(destinationSlug);

  const activeLink = MAP_LINKS.find(
    (l) => l.from.slug === originSlug && l.to.slug === destinationSlug,
  );

  return (
    <div className={`relative ${className}`}>
      {/* La vraie carte, sous les pastilles. Même cadre, même Mercator, même
          caméra que la projection des villes : l'alignement est un théorème,
          pas un réglage. Sans clé au build, le fond reste nu — les positions
          sont vraies dans les deux cas. */}
      {MAPBOX_TOKEN && (
        <img
          src={panamaOverviewUrl()}
          alt=""
          aria-hidden
          width={MAP_VIEWBOX.width}
          height={MAP_VIEWBOX.height}
          loading="lazy"
          decoding="async"
          className="pointer-events-none absolute inset-0 h-full w-full rounded-[14px] object-cover opacity-90"
        />
      )}
      <svg
        viewBox={`0 0 ${MAP_VIEWBOX.width} ${MAP_VIEWBOX.height}`}
        className="relative w-full"
        role="group"
        aria-label="Mapa de rutas de Panamá"
      >
        <defs>
          <linearGradient id={`${id}-active`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#20A8F8" />
            <stop offset="1" stopColor="#A0D838" />
          </linearGradient>
        </defs>

        {/* Corridors existants, en fond. Ils montrent d'un coup d'œil ce que
            la plateforme couvre — l'information que les listes déroulantes,
            elles, ne donnent jamais. */}
        <g fill="none" strokeLinecap="round">
          {MAP_LINKS.map((link) => (
            <path
              key={link.slug}
              d={linkPath(link.from, link.to)}
              stroke="currentColor"
              strokeWidth={link.isPriority ? 3 : 2}
              className="text-ink-200"
              strokeDasharray={link.isPriority ? undefined : "6 8"}
            />
          ))}

          {activeLink && (
            <path
              d={linkPath(activeLink.from, activeLink.to)}
              stroke={`url(#${id}-active)`}
              strokeWidth={5}
              className="[stroke-dasharray:1000] [stroke-dashoffset:0] motion-safe:animate-[draw_0.7s_ease-out]"
            />
          )}
        </g>

        {MAP_CITIES.map((city) => {
          const isOrigin = city.slug === originSlug;
          const isDestination = city.slug === destinationSlug;
          const selected = isOrigin || isDestination;
          const anchorEnd = city.x > MAP_VIEWBOX.width * 0.78;

          return (
            <g key={city.slug}>
              <text
                x={anchorEnd ? city.x - 18 : city.x + 18}
                y={city.y + 5}
                textAnchor={anchorEnd ? "end" : "start"}
                stroke="#ffffff"
                strokeWidth={4}
                className={`pointer-events-none text-[19px] [paint-order:stroke] ${
                  selected
                    ? "fill-ink-900 font-bold"
                    : "fill-ink-600 font-semibold"
                }`}
              >
                {city.shortName}
              </text>

              <circle
                cx={city.x}
                cy={city.y}
                r={selected ? 11 : 7}
                className={
                  isOrigin
                    ? "fill-accent"
                    : isDestination
                      ? "fill-brand-green-deep"
                      : "fill-ink-300"
                }
              />
              {selected && (
                <circle
                  cx={city.x}
                  cy={city.y}
                  r={17}
                  fill="none"
                  strokeWidth={2}
                  className={
                    isOrigin ? "stroke-accent/40" : "stroke-brand-green-deep/40"
                  }
                />
              )}

              {/* Zone de clic généreuse : la pastille visible fait 14 px, la
                  cible en fait 44. */}
              <circle
                cx={city.x}
                cy={city.y}
                r={22}
                fill="transparent"
                className="cursor-pointer outline-offset-2"
                role="button"
                tabIndex={0}
                aria-label={`${city.name} — ${
                  isOrigin
                    ? "origen actual"
                    : isDestination
                      ? "destino actual"
                      : picking === "origin"
                        ? "elegir como origen"
                        : "elegir como destino"
                }`}
                aria-pressed={selected}
                onClick={() => onPick(city.slug)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onPick(city.slug);
                  }
                }}
              />
            </g>
          );
        })}
      </svg>

      <p className="mt-2 text-center text-[12.5px] text-ink-500">
        {picking === "origin" ? "Toca tu punto de salida" : "Toca a dónde vas"}
        {origin && destination && (
          <>
            {" · "}
            <b className="font-semibold text-ink-900">
              {origin.shortName} → {destination.shortName}
            </b>
          </>
        )}
      </p>
    </div>
  );
}
