"use client";

import { useCallback, useRef, useState } from "react";
import { computePriceCap, formatUsd } from "@/lib/pricing";
import { NETWORK, pathBetween, station, type Station } from "@/lib/network";

/**
 * LE PROFIL — l'objet signature de la planche.
 *
 * Ce n'est pas une illustration posée à côté d'un champ de recherche : c'est
 * LE champ de recherche. On tire deux stations le long du tracé, le segment
 * s'allume, et sa ligne de cote se résout dessous avec le plafond des
 * kilomètres réellement sélectionnés.
 *
 * Pourquoi cette forme plutôt qu'un hero : le mécanisme du produit est qu'un
 * prix sort d'une distance mesurée. Un formulaire le raconte, une ligne de
 * cote le démontre. Quelqu'un qui quitte la page après ce seul écran doit
 * pouvoir dire « c'est le site où on tire le long de la route et il te dit le
 * maximum qu'on peut te demander », pas « c'était bleu et sympathique ».
 *
 * ── ACCESSIBILITÉ ──────────────────────────────────────────────────────────
 * Le glissement est un ENRICHISSEMENT, jamais le seul chemin. Chaque station
 * est un bouton atteignable au clavier avec son état pressé ; la cote résolue
 * est annoncée dans une région vivante. Une carte utilisable seulement au
 * doigt n'est pas une carte, c'est un obstacle.
 *
 * ── DEUX ORIENTATIONS, UN SEUL CODE ────────────────────────────────────────
 * Le profil est horizontal et le téléphone est vertical : c'est le risque
 * assumé de cette direction. Les deux orientations partagent le même chemin
 * de rendu — l'axe primaire porte les kilomètres, l'axe transverse porte la
 * branche. Les deux sont rendues et l'affichage bascule en CSS : aucun calcul
 * de largeur au chargement, donc aucun décalage de mise en page ni risque
 * d'hydratation.
 */

type Orientation = "horizontal" | "vertical";

type Props = {
  fromSlug: string;
  toSlug: string;
  onPick: (fromCitySlug: string, toCitySlug: string) => void;
  /** Ce que le prochain geste va renseigner. */
  picking: "origin" | "destination";
  onPickingChange: (next: "origin" | "destination") => void;
};

/**
 * Géométrie de chaque orientation.
 *
 * Les deux ne sont pas le même dessin pivoté. En horizontal, le tracé se lit
 * comme un profil ; en vertical, comme une nomenclature de stations — les noms
 * du tronc partent à droite du trait, ceux de la branche se calent contre le
 * bord opposé. Sans ça, Santiago et Chitré, qui sont au même kilomètre sur
 * deux routes différentes, s'écrivent l'un sur l'autre.
 */
const GEO = {
  horizontal: {
    viewW: 1000,
    viewH: 286,
    padStart: 74,
    span: 852,
    trunkCross: 72,
    azueroCross: 146,
    coteAt: 226,
  },
  vertical: {
    viewW: 340,
    viewH: 548,
    padStart: 34,
    span: 466,
    trunkCross: 86,
    azueroCross: 198,
    coteAt: 20,
  },
} as const;

export function RouteProfile(props: Props) {
  return (
    <>
      <div className="hidden min-[760px]:block">
        <Profile {...props} orientation="horizontal" />
      </div>
      <div className="min-[760px]:hidden">
        <Profile {...props} orientation="vertical" />
      </div>
    </>
  );
}

function Profile({
  fromSlug,
  toSlug,
  onPick,
  picking,
  onPickingChange,
  orientation,
}: Props & { orientation: Orientation }) {
  const g = GEO[orientation];
  const horizontal = orientation === "horizontal";
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragging, setDragging] = useState<"from" | "to" | null>(null);

  /** Kilomètre → position sur l'axe primaire. */
  const at = useCallback(
    (km: number) => g.padStart + (km / NETWORK.maxKm) * g.span,
    [g],
  );

  /** Coordonnées d'une station, selon l'orientation. */
  const pos = useCallback(
    (s: Station) => {
      const along = at(s.km);
      const cross = s.branch === "azuero" ? g.azueroCross : g.trunkCross;
      return horizontal
        ? { x: along, y: cross }
        : { x: cross, y: along };
    },
    [at, g, horizontal],
  );

  /** Le coude de la fourche, inséré dès qu'un tracé quitte le tronc. */
  const bend = useCallback(
    (a: Station, b: Station) => {
      if (a.branch !== "trunk" || b.branch !== "azuero") return null;
      const start = pos(a);
      return horizontal
        ? { x: start.x + 62, y: g.azueroCross }
        : { x: g.azueroCross, y: start.y + 62 };
    },
    [pos, horizontal, g],
  );

  const path = pathBetween(fromSlug, toSlug);
  const from = station(fromSlug);
  const to = station(toSlug);

  /** La cote résolue : plafond d'un carro standard à trois puestos. */
  const quote =
    path && from && to
      ? computePriceCap(
          Math.round((to.km - from.km) * 10) / 10,
          Math.max(0, to.tollCents - from.tollCents),
          "standard",
          3,
        )
      : null;

  function select(slug: string) {
    if (picking === "origin") {
      onPick(slug, pathBetween(slug, toSlug) ? toSlug : "");
      onPickingChange("destination");
    } else {
      onPick(fromSlug, slug);
      onPickingChange("origin");
    }
  }

  /** Glissement : on cherche la station atteignable la plus proche. */
  function moveHandle(clientX: number, clientY: number, which: "from" | "to") {
    const svg = svgRef.current;
    if (!svg) return;
    const box = svg.getBoundingClientRect();
    const scale = horizontal ? g.viewW / box.width : g.viewH / box.height;
    const along = horizontal
      ? (clientX - box.left) * scale
      : (clientY - box.top) * scale;

    // Seules les stations qui donnent un trajet valide sont candidates : une
    // poignée ne doit jamais produire un contresens ni sauter de branche.
    const other = which === "from" ? toSlug : fromSlug;
    const reachable = ALL_STATIONS_LOCAL.filter((s) =>
      which === "from"
        ? pathBetween(s.citySlug, other) !== null
        : pathBetween(other, s.citySlug) !== null,
    );
    if (reachable.length === 0) return;

    const nearest = reachable.reduce((best, s) =>
      Math.abs(at(s.km) - along) < Math.abs(at(best.km) - along) ? s : best,
    );
    if (which === "from" && nearest.citySlug !== fromSlug) {
      onPick(nearest.citySlug, toSlug);
    }
    if (which === "to" && nearest.citySlug !== toSlug) {
      onPick(fromSlug, nearest.citySlug);
    }
  }

  return (
    <figure className="m-0">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${g.viewW} ${g.viewH}`}
        className="w-full touch-none select-none"
        role="group"
        aria-label="Trazado de la Panamericana. Escoge tu estación de salida y la de llegada."
        onPointerMove={(e) =>
          dragging && moveHandle(e.clientX, e.clientY, dragging)
        }
        onPointerUp={() => setDragging(null)}
        onPointerLeave={() => setDragging(null)}
      >
        <defs>
          {/* Les flèches d'une ligne de cote sont des traits obliques, pas des
              pointes pleines : c'est la convention du dessin technique. */}
          <marker
            id={`tick-${orientation}`}
            markerWidth="12"
            markerHeight="12"
            refX="6"
            refY="6"
            orient="auto"
          >
            <line
              x1="3"
              y1="9"
              x2="9"
              y2="3"
              stroke="var(--color-ochre-400)"
              strokeWidth="1.5"
            />
          </marker>
        </defs>

        {/* ---- Le tracé : le tronc, puis la fourche d'Azuero ----
            La branche part par un coude court juste après la station de
            fourche, puis file parallèlement au tronc. Sans ce coude, la
            divergence est une longue diagonale qui se lit comme un croisement
            plutôt que comme un embranchement. */}
        <g fill="none" strokeLinecap="square" stroke="var(--color-plate-700)">
          <polyline points={points(NETWORK.trunk, pos)} strokeWidth={2} />
          {NETWORK.azuero.length > 0 && (
            <polyline
              points={points([NETWORK.fork, ...NETWORK.azuero], pos, bend)}
              strokeWidth={2}
            />
          )}

          {/* Le segment choisi : la seule chose en ocre sur tout le tracé. */}
          {path && (
            <polyline
              key={`${fromSlug}-${toSlug}`}
              points={points(path, pos, bend)}
              stroke="var(--color-ochre-400)"
              strokeWidth={5}
            />
          )}
        </g>

        {/* ---- Les stations ---- */}
        {ALL_STATIONS_LOCAL.map((s) => {
          const p = pos(s);
          const onPath = path?.some((x) => x.citySlug === s.citySlug) ?? false;
          const isEnd = s.citySlug === fromSlug || s.citySlug === toSlug;
          const lab = labelFor(s, p, horizontal, g.viewW);

          return (
            <g
              key={s.citySlug}
              role="button"
              tabIndex={0}
              aria-pressed={isEnd}
              aria-label={`${s.name}, kilómetro ${s.km}`}
              className="cursor-pointer"
              onClick={() => select(s.citySlug)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  select(s.citySlug);
                }
              }}
              onPointerDown={(e) => {
                if (!isEnd) return;
                (e.target as Element).releasePointerCapture?.(e.pointerId);
                setDragging(s.citySlug === fromSlug ? "from" : "to");
              }}
            >
              {/* Cible tactile invisible : la pastille fait 12 px, le doigt en
                  demande 44. */}
              <circle cx={p.x} cy={p.y} r={26} fill="transparent" />

              {/* Le trait de station, perpendiculaire au tracé. */}
              <line
                x1={horizontal ? p.x : p.x - 11}
                y1={horizontal ? p.y - 11 : p.y}
                x2={horizontal ? p.x : p.x + 11}
                y2={horizontal ? p.y + 11 : p.y}
                stroke={
                  isEnd
                    ? "var(--color-ochre-400)"
                    : onPath
                      ? "var(--color-plate-200)"
                      : "var(--color-plate-500)"
                }
                strokeWidth={isEnd ? 3 : 1.5}
              />

              {isEnd && (
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={6}
                  fill="var(--color-ochre-400)"
                  stroke="var(--color-plate-900)"
                  strokeWidth={3}
                />
              )}

              <text
                x={lab.nameX}
                y={lab.nameY}
                textAnchor={lab.anchor}
                fontSize={15}
                fontWeight={700}
                style={{ fontStretch: "112%" }}
                fill={
                  isEnd
                    ? "var(--color-ochre-300)"
                    : onPath
                      ? "var(--color-plate-100)"
                      : "var(--color-plate-300)"
                }
              >
                {s.name}
              </text>

              <text
                x={lab.kmX}
                y={lab.kmY}
                textAnchor={lab.kmAnchor}
                fontSize={12}
                className="cote"
                fill="var(--color-plate-400)"
              >
                {s.km}
              </text>
            </g>
          );
        })}

        {/* ---- La ligne de cote : le seul geste animé de la page ----
            Lignes d'attache, traits de rappel qui se rejoignent, chiffre qui
            se pose. Depuis un état déjà visible : sans animation, la cote est
            simplement là, entière. */}
        {path && from && to && quote && (
          <g key={`cote-${fromSlug}-${toSlug}`}>
            {[from, to].map((end) => {
              const p = pos(end);
              return (
                <line
                  key={end.citySlug}
                  x1={horizontal ? p.x : p.x - 14}
                  y1={horizontal ? p.y + 14 : p.y}
                  x2={horizontal ? p.x : g.coteAt}
                  y2={horizontal ? g.coteAt : p.y}
                  stroke="var(--color-plate-500)"
                  strokeWidth={1}
                  strokeDasharray="3 4"
                />
              );
            })}

            <line
              className="cote-rule"
              x1={horizontal ? at(from.km) : g.coteAt}
              y1={horizontal ? g.coteAt : at(from.km)}
              x2={horizontal ? at(to.km) : g.coteAt}
              y2={horizontal ? g.coteAt : at(to.km)}
              stroke="var(--color-ochre-400)"
              strokeWidth={1.5}
              markerStart={`url(#tick-${orientation})`}
              markerEnd={`url(#tick-${orientation})`}
            />

            {/* Le chiffre de cote ne s'écrit sur le trait qu'en horizontal,
                là où il y a la largeur. En vertical, 340 unités ne suffisent
                pas : la cote reste muette et sa valeur part dans la note
                encadrée sous le dessin. C'est ce que fait une planche quand
                une cote n'a pas la place de porter son chiffre — elle le
                renvoie en note, elle ne l'écrit pas par-dessus le tracé. */}
            {horizontal && (
              <g className="cote-figure">
                <text
                  x={(at(from.km) + at(to.km)) / 2}
                  y={g.coteAt + 26}
                  textAnchor="middle"
                  fontSize={17}
                  fontWeight={700}
                  className="cote"
                  fill="var(--color-ochre-300)"
                >
                  {quote.distanceKm} km
                </text>
                <text
                  x={(at(from.km) + at(to.km)) / 2}
                  y={g.coteAt + 48}
                  textAnchor="middle"
                  fontSize={13}
                  className="cote"
                  fill="var(--color-plate-300)"
                >
                  aporte máx. {formatUsd(quote.maxPriceCents)}
                </text>
              </g>
            )}
          </g>
        )}
      </svg>

      {/* La note de cote, en vertical seulement : c'est là que la valeur que
          le trait ne peut pas porter va se lire. */}
      {!horizontal && (
        <figcaption className="mt-2 border border-plate-500 px-3 py-2.5">
          {quote && from && to ? (
            <>
              <span className="cote block text-[17px] font-bold text-ochre-300">
                {quote.distanceKm} km
              </span>
              <span className="cote mt-0.5 block text-[13px] text-plate-300">
                {from.name} → {to.name} · aporte máx.{" "}
                {formatUsd(quote.maxPriceCents)}
              </span>
            </>
          ) : (
            <span className="text-[13px] text-plate-300">
              Escoge una estación de salida y una de llegada.
            </span>
          )}
        </figcaption>
      )}

      <p className="sr-only" aria-live="polite">
        {quote && from && to
          ? `${from.name} a ${to.name}: ${quote.distanceKm} kilómetros, aporte máximo ${formatUsd(quote.maxPriceCents)} por puesto en carro estándar de tres puestos.`
          : "Escoge una estación de salida y una de llegada sobre el trazado."}
      </p>
    </figure>
  );
}

const ALL_STATIONS_LOCAL: Station[] = [...NETWORK.trunk, ...NETWORK.azuero];

/**
 * Où poser le nom et le kilomètre d'une station sans qu'ils se rentrent
 * dedans.
 *
 * Trois collisions réelles ont été observées et sont traitées ici :
 *   · en horizontal, deux stations voisines de la branche (Chitré 250 et
 *     Las Tablas 285) se touchent — leurs libellés alternent donc de hauteur ;
 *   · en vertical, Santiago et Chitré sont au MÊME kilomètre sur deux routes
 *     différentes, donc à la même hauteur — les noms de branche se calent
 *     contre le bord droit, ceux du tronc partent du trait ;
 *   · « Las Tablas » sortait du cadre : le calage à droite le ramène dedans.
 */
function labelFor(
  s: Station,
  p: { x: number; y: number },
  horizontal: boolean,
  viewW: number,
) {
  const azuero = s.branch === "azuero";

  if (horizontal) {
    // Sur la branche, les libellés passent SOUS le trait et alternent, pour
    // ne jamais croiser ceux du tronc ni ceux du voisin.
    if (azuero) {
      // Le décalage suit le rang DANS la branche, pas dans la liste globale :
      // la première station reste haute et la suivante descend, ce qui se lit
      // dans le sens de la marche.
      const rank = NETWORK.azuero.findIndex((a) => a.citySlug === s.citySlug);
      const stagger = rank % 2 === 0 ? 0 : 19;
      return {
        nameX: p.x,
        nameY: p.y + 26 + stagger,
        anchor: "middle" as const,
        kmX: p.x,
        kmY: p.y - 18,
        kmAnchor: "middle" as const,
      };
    }
    return {
      nameX: p.x,
      nameY: p.y - 24,
      anchor: "middle" as const,
      kmX: p.x,
      kmY: p.y + 32,
      kmAnchor: "middle" as const,
    };
  }

  if (azuero) {
    return {
      nameX: viewW - 12,
      nameY: p.y + 5,
      anchor: "end" as const,
      kmX: viewW - 12,
      kmY: p.y + 22,
      kmAnchor: "end" as const,
    };
  }
  return {
    nameX: p.x + 20,
    nameY: p.y + 5,
    anchor: "start" as const,
    kmX: p.x - 20,
    kmY: p.y + 5,
    kmAnchor: "end" as const,
  };
}

/**
 * Les points d'une polyligne, avec le coude de fourche inséré là où le tracé
 * change de branche. `bend` renvoie `null` partout ailleurs, donc le tronc et
 * la branche seule sortent inchangés.
 */
function points(
  stations: Station[],
  pos: (s: Station) => { x: number; y: number },
  bend?: (a: Station, b: Station) => { x: number; y: number } | null,
): string {
  const out: string[] = [];
  stations.forEach((s, i) => {
    const previous = stations[i - 1];
    if (previous && bend) {
      const knee = bend(previous, s);
      if (knee) out.push(`${knee.x},${knee.y}`);
    }
    const p = pos(s);
    out.push(`${p.x},${p.y}`);
  });
  return out.join(" ");
}
