"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { MAP_LINKS, encuadre, linkPath, mapCity } from "@/lib/map";
import { findSegment } from "@/lib/segments";
import { formatTime, matchFor, type TripMatch } from "@/lib/trips";
import { formatUsd } from "@/lib/pricing";

/**
 * MAPA — les mêmes résultats, vus sur le pays.
 *
 * POURQUOI UNE CARTE, ET CE QU'ELLE DOIT DIRE. Une liste répond à
 * « quand ». Une carte répond à « par où » — et sur un trajet
 * inter-urbain c'est une vraie question : le viaje passe-t-il près de
 * chez moi, et combien si je descends avant la fin. C'est exactement ce
 * que montrent les pastilles : l'aporte depuis TON point de montée
 * jusqu'à chaque arrêt suivant. Il baisse quand on descend plus tôt,
 * parce qu'il sort des kilomètres — jamais de la demande.
 *
 * LES POSITIONS SONT VRAIES. `lib/map.ts` projette les villes en Web
 * Mercator depuis leurs coordonnées réelles ; la caméra est calculée
 * dans le même repère. Sans clé Mapbox le fond reste nu, et c'est une
 * carte honnête quand même : un plan de métro ne ment pas parce qu'il
 * n'est pas une photo satellite.
 *
 * CE QU'ELLE NE FAIT PAS. Aucune position de personne, aucun suivi en
 * direct : nous n'avons ni le droit ni les serveurs pour ça, et une
 * carte qui prétend suivre une voiture sans la suivre est pire que pas
 * de carte.
 */

type Props = {
  matches: TripMatch[];
  /** L'index du viaje mis en avant dans la bande du bas. */
  activo: number;
  onActivo: (i: number) => void;
  desde: string;
};

/** Une pastille de prix : ce que coûte de descendre à cet arrêt. */
type Pastilla = {
  slug: string;
  nombre: string;
  x: number;
  y: number;
  precio: number | null;
  esOrigen: boolean;
  esDestino: boolean;
};

export function Mapa({ matches, activo, onActivo, desde }: Props) {
  const m = matches[activo];

  /* LES ARRÊTS DU TRAJET MIS EN AVANT, et le prix jusqu'à chacun. Le
     prix d'un arrêt intermédiaire n'est pas une règle de trois sur le
     total : on redemande un vrai segment au moteur, pour que la carte et
     la fiche viaje ne puissent pas diverger. */
  const pastillas: Pastilla[] = useMemo(() => {
    if (!m) return [];
    const stops = m.trip.servedStops;
    const out: Pastilla[] = [];
    for (let i = m.segment.fromIndex; i <= m.segment.toIndex; i++) {
      const stop = stops[i];
      const ciudad = mapCity(stop.citySlug);
      if (!ciudad) continue;
      let precio: number | null = null;
      if (i > m.segment.fromIndex) {
        const seg = findSegment(stops, desde, stop.citySlug);
        const parcial = seg ? matchFor(m.trip, seg) : null;
        precio = parcial ? parcial.priceCents : null;
      }
      out.push({
        slug: stop.citySlug,
        nombre: ciudad.shortName,
        x: ciudad.x,
        y: ciudad.y,
        precio,
        esOrigen: i === m.segment.fromIndex,
        esDestino: i === m.segment.toIndex,
      });
    }
    return out;
  }, [m, desde]);

  /* LE CADRE. Il se règle sur TOUS les résultats, pas sur le trajet
     choisi : changer de viaje dans la bande du bas ne doit pas faire
     sauter la caméra. Le calcul vit dans `lib/map.ts` — la fiche viaje
     cadre avec le même, sans quoi les deux écrans finiraient par ne plus
     montrer le même pays. */
  const caja = useMemo(
    () =>
      encuadre(
        matches.flatMap((x) =>
          x.trip.servedStops
            .slice(x.segment.fromIndex, x.segment.toIndex + 1)
            .map((s) => s.citySlug),
        ),
      ),
    [matches],
  );

  if (!m || !caja) {
    return (
      <div className="rounded-[18px] border border-ink-200 bg-white px-5 py-8 text-center">
        <p className="font-display text-[16.5px] font-bold">
          Nada que dibujar todavía
        </p>
        <p className="mx-auto mt-1.5 max-w-[34ch] text-[13.5px] leading-relaxed text-ink-500">
          Cuando haya viajes en esta ruta, aquí ves por dónde pasan y cuánto se
          aporta hasta cada parada.
        </p>
      </div>
    );
  }

  /* Position d'une pastille en pourcentage du cadre : les épingles sont
     du HTML par-dessus le SVG, donc leur texte garde la même taille quel
     que soit le zoom. Le cadre du conteneur a EXACTEMENT les proportions
     du viewBox, sans quoi ce calcul dériverait. */
  const pos = (x: number, y: number) => ({
    left: `${((x - caja.x) / caja.w) * 100}%`,
    top: `${((y - caja.y) / caja.h) * 100}%`,
  });

  const trazo = pastillas
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  return (
    <div>
      <div
        className="relative overflow-hidden rounded-[18px] border border-ink-200 bg-white"
        style={{ aspectRatio: `${caja.w} / ${caja.h}` }}
      >
        <svg
          viewBox={`${caja.x} ${caja.y} ${caja.w} ${caja.h}`}
          className="absolute inset-0 h-full w-full"
          role="img"
          aria-label={`Recorrido de ${pastillas[0]?.nombre} a ${pastillas[pastillas.length - 1]?.nombre}`}
        >
          {/* LE RESTE DU RÉSEAU, en sourdine : sans lui le tracé flotte
              dans le vide et on ne sait plus où on est dans le pays. */}
          <g fill="none" strokeLinecap="round">
            {MAP_LINKS.map((l) => (
              <path
                key={l.slug}
                d={linkPath(l.from, l.to)}
                stroke="currentColor"
                strokeWidth={3}
                className="text-ink-100"
              />
            ))}
            <path
              d={trazo}
              stroke="currentColor"
              strokeWidth={7}
              strokeLinejoin="round"
              className="text-naranja"
            />
          </g>
          {pastillas.map((p) => (
            <circle
              key={p.slug}
              cx={p.x}
              cy={p.y}
              r={p.esOrigen || p.esDestino ? 11 : 7}
              className={
                p.esOrigen
                  ? "fill-verde-ok"
                  : p.esDestino
                    ? "fill-naranja"
                    : "fill-ink-300"
              }
            />
          ))}
        </svg>

        {/* LES ÉPINGLES. Le montant au-dessus, LE NOM DE LA VILLE en
            dessous : un prix sans lieu ne se lit pas, et c'est le couple
            qui rend la carte utile — « descendre à Penonomé, $11.50 ».
            Celle du départ ne porte pas de montant : à ton point de
            montée tu n'as encore rien parcouru. */}
        {pastillas.map((p) => (
          <span key={p.slug}>
            <span
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-[calc(100%+11px)] whitespace-nowrap"
              style={pos(p.x, p.y)}
            >
              <span
                className={`block rounded-full px-2 py-[3px] font-display text-[11.5px] font-bold shadow-card ${
                  p.esDestino
                    ? "bg-naranja text-white"
                    : p.esOrigen
                      ? "bg-verde-ok text-white"
                      : "bg-white text-ink-900"
                }`}
              >
                {p.esOrigen
                  ? "Sales aquí"
                  : p.precio !== null
                    ? formatUsd(p.precio)
                    : p.nombre}
              </span>
            </span>
            <span
              /* Un halo blanc, pas un contour : `-webkit-text-stroke`
                 dessine par-dessus le glyphe et amaigrit la lettre. Le
                 halo passe derrière. */
              className="pointer-events-none absolute mt-2.5 -translate-x-1/2 whitespace-nowrap text-[11.5px] font-semibold text-ink-600"
              style={{
                ...pos(p.x, p.y),
                textShadow:
                  "0 0 3px #fff, 0 0 3px #fff, 0 0 3px #fff, 0 0 3px #fff",
              }}
            >
              {p.nombre}
            </span>
          </span>
        ))}
      </div>

      <p className="mt-2 px-1 text-[12px] leading-snug text-ink-500">
        Cada pastilla es el aporte desde tu punto de salida hasta esa parada.
        Baja si te bajas antes, porque sale de los kilómetros.
      </p>

      {/* LA BANDE DES VIAJES. Elle défile à l'horizontale et s'aimante :
          on passe d'un viaje à l'autre au pouce, et la carte suit. */}
      <ul
        aria-label="Viajes en el mapa"
        className="-mx-4 mt-3 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-4 pb-1"
      >
        {matches.map((x, i) => {
          const on = i === activo;
          return (
            <li key={`${x.trip.id}-${x.segment.to.citySlug}`} className="snap-start">
              <button
                type="button"
                onClick={() => onActivo(i)}
                aria-pressed={on}
                className={`w-[224px] rounded-[16px] border bg-white p-3 text-left transition-colors ${
                  on ? "border-naranja" : "border-ink-200"
                }`}
              >
                <span className="flex items-baseline justify-between gap-2">
                  <span className="tnum font-display text-[14.5px] font-bold text-naranja">
                    {formatTime(x.boardingAt)}
                  </span>
                  <span className="tnum font-display text-[17px] font-extrabold">
                    {formatUsd(x.priceCents)}
                  </span>
                </span>
                <span className="mt-1 flex items-center gap-2">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-verde-perfil font-display text-[12px] font-bold text-white">
                    {x.trip.driver.initial}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[13px] font-semibold">
                    {x.trip.driver.firstName} {x.trip.driver.lastInitial}.
                  </span>
                  <span className="flex shrink-0 items-center gap-1 text-[12px] text-ink-500">
                    <Icon name="star" className="size-[12px] text-action" />
                    <span className="tnum">{x.trip.driver.rating.toFixed(1)}</span>
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {/* LE VIAJE MIS EN AVANT — la sortie vers sa fiche, en clair. */}
      <Link
        href={`/viaje/${m.trip.id}?desde=${m.segment.from.citySlug}&hacia=${m.segment.to.citySlug}`}
        className="mt-3 flex h-[52px] w-full items-center justify-center gap-2 rounded-[16px] bg-naranja font-display text-[15.5px] font-bold text-white transition-colors hover:bg-naranja-hondo"
      >
        Ver el viaje de {m.trip.driver.firstName}
        <Icon name="arrowRight" className="size-[17px]" />
      </Link>
    </div>
  );
}
