"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/site/Section";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { RouteMap } from "@/components/map/RouteMap";
import { AuthDialog } from "@/components/site/AuthDialog";
import { useSession } from "@/lib/session";
import { CORRIDORS, ALL_CITIES, getCorridor } from "@/lib/corridors";
import {
  computePriceCap,
  formatUsd,
  VEHICLE_LABELS,
  PRICE_RULE,
  type VehicleCategory,
} from "@/lib/pricing";
import { formatDayLabel, servedPairCount } from "@/lib/trips";

/**
 * PUBLICATION EN QUATRE ÉTAPES (§6 du brief).
 *
 * La contrainte du plafond est appliquée à l'endroit où elle se comprend :
 * au moment de choisir le montant, avec le calcul visible. Un conducteur qui
 * découvre la limite au moment de valider la vit comme un blocage ; celui qui
 * voit d'où elle sort la vit comme une règle du jeu.
 *
 * Le curseur du montant ne peut pas dépasser le plafond — la base le
 * refuserait de toute façon (`CHECK price_within_cap`), autant l'empêcher
 * avant plutôt que d'afficher une erreur après.
 */

const STEPS = ["Ruta", "Paradas", "Hora y puestos", "Aporte"] as const;

function nextDays(count = 14) {
  const today = new Date();
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const value = d.toISOString().slice(0, 10);
    return { value, label: formatDayLabel(value) };
  });
}

export function PublishFlow() {
  const params = useSearchParams();
  const { session, isDemo } = useSession();
  const days = useMemo(() => nextDays(), []);

  const preset = getCorridor(params.get("ruta") ?? "");
  const [step, setStep] = useState(0);
  const [from, setFrom] = useState(preset?.origin.slug ?? "panama-city");
  const [to, setTo] = useState(preset?.destination.slug ?? "chitre");
  const [picking, setPicking] = useState<"origin" | "destination">("origin");
  const [stops, setStops] = useState<string[]>([]);
  const [cityStops, setCityStops] = useState<string[]>([]);
  const [date, setDate] = useState(days[1].value);
  const [hour, setHour] = useState("06:00");
  const [seats, setSeats] = useState(3);
  const [category, setCategory] = useState<VehicleCategory>("standard");
  const [priceCents, setPriceCents] = useState<number | null>(null);
  const [published, setPublished] = useState(false);

  const corridor = CORRIDORS.find(
    (c) => c.origin.slug === from && c.destination.slug === to,
  );
  const cap = corridor
    ? computePriceCap(corridor.distanceKm, corridor.tollCents, category, seats)
    : null;
  const price = priceCents ?? cap?.maxPriceCents ?? 0;

  /** Villes traversées entre l'origine et la destination — les arrêts possibles. */
  const innerStops = corridor ? corridor.waypoints.slice(1, -1) : [];
  /** Combien de recherches distinctes les arrêts cochés rendent possibles. */
  const pairCount = servedPairCount(2 + cityStops.length);

  const canGoNext = [
    Boolean(corridor),
    stops.length > 0,
    Boolean(date && hour && seats > 0),
    Boolean(cap),
  ][step];

  if (published && corridor && cap) {
    return (
      <Container className="pt-10">
        <div className="mx-auto max-w-[560px] border border-plate-200 bg-white p-7 text-center">
          <span className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-plate-900 text-white">
            <Icon name="check" className="size-6" />
          </span>
          <h1 className="mb-2 text-[26px] font-extrabold tracking-[-0.03em]">
            Tu viaje está publicado
          </h1>
          <p className="mb-6 text-[15px] leading-relaxed text-plate-600">
            {corridor.origin.shortName} → {corridor.destination.shortName},{" "}
            {formatDayLabel(date)} a las {hour}. {seats}{" "}
            {seats === 1 ? "puesto" : "puestos"} a {formatUsd(price)}. Te
            avisamos por WhatsApp en cuanto alguien pida un puesto.
          </p>
          {cityStops.length > 0 && (
            <p className="mb-6 bg-ochre-200 px-4 py-3 text-[13.5px] leading-relaxed text-ochre-600">
              Como paras en{" "}
              {innerStops
                .filter((s) => cityStops.includes(s.citySlug))
                .map((s) => s.name)
                .join(" y ")}
              , tu viaje sale en {pairCount} búsquedas distintas y no solo en la
              de {corridor.origin.shortName} → {corridor.destination.shortName}.
            </p>
          )}
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/cuenta"
              className="bg-plate-900 px-5 py-3 text-[15px] font-bold text-white"
            >
              Ver mis viajes
            </Link>
            <Link
              href={`/viajes/${corridor.slug}`}
              className="border-[1.5px] border-plate-200 px-5 py-3 text-[15px] font-bold"
            >
              Ver la ruta
            </Link>
          </div>
          {isDemo && (
            <p className="mt-5 text-[12.5px] text-plate-600">
              Modo demostración: nada se guardó en una base de datos.
            </p>
          )}
        </div>
      </Container>
    );
  }

  return (
    <Container className="pt-6">
      <div className="mx-auto max-w-[620px]">
        {/* Progression : quatre étapes nommées, pas une barre anonyme. */}
        <ol className="mb-6 flex gap-1.5">
          {STEPS.map((label, index) => (
            <li key={label} className="flex-1">
              <span
                className={`block h-1 rounded-full ${index <= step ? "bg-plate-900" : "bg-plate-200"}`}
              />
              <span
                className={`mt-1.5 block text-[11.5px] font-semibold ${index === step ? "text-plate-900" : "text-plate-600"}`}
              >
                {label}
              </span>
            </li>
          ))}
        </ol>

        <div className="border border-plate-200 bg-white p-5 sm:p-6">
          {step === 0 && (
            <>
              <h1 className="mb-1.5 text-[24px] font-extrabold tracking-[-0.03em]">
                ¿Por dónde vas?
              </h1>
              <p className="mb-5 text-[14.5px] leading-relaxed text-plate-600">
                Escoge tu salida y tu destino. Solo puedes publicar en las rutas
                que ya están abiertas.
              </p>
              <div className="border border-plate-200 bg-plate-50/60 p-3">
                <RouteMap
                  originSlug={from}
                  destinationSlug={to}
                  picking={picking}
                  onPick={(slug) => {
                    if (picking === "origin") {
                      setFrom(slug);
                      if (slug === to) setTo("");
                      setPicking("destination");
                    } else {
                      setTo(slug);
                      setPicking("origin");
                    }
                    setStops([]);
                    setCityStops([]);
                  }}
                />
              </div>
              {!corridor && from && to && (
                <p className="mt-3 bg-danger-soft px-4 py-3 text-[13.5px] text-danger">
                  Esa ruta todavía no está abierta.{" "}
                  {ALL_CITIES.find((c) => c.slug === from)?.shortName} →{" "}
                  {ALL_CITIES.find((c) => c.slug === to)?.shortName} no tiene
                  corredor. Escribe a hola@partimos.com y la abrimos.
                </p>
              )}
            </>
          )}

          {step === 1 && corridor && (
            <>
              <h1 className="mb-1.5 text-[24px] font-extrabold tracking-[-0.03em]">
                ¿Dónde puedes parar?
              </h1>
              <p className="mb-5 text-[14.5px] leading-relaxed text-plate-600">
                Tú decides el recorrido. Marca solo lo que ya te queda de paso.
              </p>

              {/* Villes de passage — le multiplicateur de couverture. Un
                  conducteur qui déclare deux arrêts répond à six recherches au
                  lieu d'une, sans changer une minute à son trajet. C'est
                  l'argument à lui montrer, chiffré et en direct. */}
              {innerStops.length > 0 && (
                <section className="mb-6">
                  <h2 className="mb-1 text-[11.5px] font-bold tracking-[0.11em] text-plate-600 uppercase">
                    Ciudades donde puedes dejar a alguien
                  </h2>
                  <p className="mb-3 text-[13.5px] leading-relaxed text-plate-600">
                    Pasas por estas ciudades de todas formas. Si aceptas parar,
                    alguien puede bajarse ahí y aportar por esos kilómetros.
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {innerStops.map((stop) => {
                      const active = cityStops.includes(stop.citySlug);
                      return (
                        <button
                          key={stop.citySlug}
                          type="button"
                          aria-pressed={active}
                          onClick={() =>
                            setCityStops((s) =>
                              active
                                ? s.filter((c) => c !== stop.citySlug)
                                : [...s, stop.citySlug],
                            )
                          }
                          className={`flex items-center gap-3 border px-4 py-3 text-left transition-colors ${active ? "border-plate-900 bg-plate-50" : "border-plate-200 hover:border-ochre-500"}`}
                        >
                          <span
                            aria-hidden
                            className={`flex size-5 shrink-0 items-center justify-center border-2 ${active ? "border-plate-900 bg-plate-900 text-white" : "border-plate-200"}`}
                          >
                            {active && <Icon name="check" className="size-3" />}
                          </span>
                          <span className="min-w-0">
                            <span
                              className={`block text-[15px] ${active ? "font-semibold" : ""}`}
                            >
                              {stop.name}
                            </span>
                            <span className="cote block text-[12.5px] text-plate-600">
                              km {stop.km} de tu ruta
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <p
                    className="mt-3 bg-ochre-200 px-4 py-3 text-[13.5px] leading-relaxed text-ochre-600"
                    aria-live="polite"
                  >
                    {pairCount === 1 ? (
                      <>
                        Tu viaje aparece en <b>1 búsqueda</b>. Marcando una
                        parada aparecería en 3.
                      </>
                    ) : (
                      <>
                        Con {cityStops.length}{" "}
                        {cityStops.length === 1 ? "parada" : "paradas"}, tu
                        viaje aparece en <b>{pairCount} búsquedas distintas</b>.
                        Mismo recorrido, misma hora.
                      </>
                    )}
                  </p>
                </section>
              )}

              <h2 className="mb-1 text-[11.5px] font-bold tracking-[0.11em] text-plate-600 uppercase">
                Por dónde puedes recoger
              </h2>
              <p className="mb-3 text-[13.5px] leading-relaxed text-plate-600">
                Marca los puntos por donde ya vas a pasar. Máximo{" "}
                {PRICE_RULE.maxStops}, y ninguno en una terminal de buses.
              </p>
              <div className="grid gap-2">
                {corridor.pickupPoints.map((point) => {
                  const active = stops.includes(point);
                  const full = stops.length >= PRICE_RULE.maxStops && !active;
                  return (
                    <button
                      key={point}
                      type="button"
                      aria-pressed={active}
                      disabled={full}
                      onClick={() =>
                        setStops((s) =>
                          active ? s.filter((p) => p !== point) : [...s, point],
                        )
                      }
                      className={`flex items-center gap-3 border px-4 py-3 text-left text-[15px] transition-colors disabled:opacity-40 ${active ? "border-plate-900 bg-plate-50 font-semibold" : "border-plate-200 hover:border-ochre-500"}`}
                    >
                      <span
                        aria-hidden
                        className={`flex size-5 shrink-0 items-center justify-center border-2 ${active ? "border-plate-900 bg-plate-900 text-white" : "border-plate-200"}`}
                      >
                        {active && <Icon name="check" className="size-3" />}
                      </span>
                      {point}
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-[13px] text-plate-600">
                {stops.length}/{PRICE_RULE.maxStops} paradas · si un pasajero
                propone otro punto, tú decides si te queda de paso.
              </p>
            </>
          )}

          {step === 2 && (
            <>
              <h1 className="mb-1.5 text-[24px] font-extrabold tracking-[-0.03em]">
                ¿Cuándo sales?
              </h1>
              <p className="mb-5 text-[14.5px] leading-relaxed text-plate-600">
                Tú pones la hora. Nadie te asigna un viaje ni te cambia el
                recorrido.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <label>
                  <span className="mb-1.5 block text-[11.5px] font-bold tracking-[0.11em] text-plate-600 uppercase">
                    Día
                  </span>
                  <select
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full cursor-pointer border border-plate-200 px-3.5 py-2.5 text-[15px] font-semibold focus:border-ochre-500 focus:outline-none"
                  >
                    {days.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="mb-1.5 block text-[11.5px] font-bold tracking-[0.11em] text-plate-600 uppercase">
                    Hora de salida
                  </span>
                  <input
                    type="time"
                    value={hour}
                    onChange={(e) => setHour(e.target.value)}
                    className="cote w-full border border-plate-200 px-3.5 py-2.5 text-[15px] font-semibold focus:border-ochre-500 focus:outline-none"
                  />
                </label>
              </div>

              <fieldset className="mt-5">
                <legend className="mb-2 text-[11.5px] font-bold tracking-[0.11em] text-plate-600 uppercase">
                  Puestos que ofreces
                </legend>
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4].map((n) => (
                    <button
                      key={n}
                      type="button"
                      aria-pressed={seats === n}
                      onClick={() => {
                        setSeats(n);
                        setPriceCents(null);
                      }}
                      className={pill(seats === n)}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset className="mt-5">
                <legend className="mb-2 text-[11.5px] font-bold tracking-[0.11em] text-plate-600 uppercase">
                  Tu carro
                </legend>
                <div className="flex flex-wrap gap-2">
                  {(["economy", "standard", "suv"] as const).map((code) => (
                    <button
                      key={code}
                      type="button"
                      aria-pressed={category === code}
                      onClick={() => {
                        setCategory(code);
                        setPriceCents(null);
                      }}
                      className={pill(category === code)}
                    >
                      {VEHICLE_LABELS[code]}
                    </button>
                  ))}
                </div>
              </fieldset>
            </>
          )}

          {step === 3 && cap && corridor && (
            <>
              <h1 className="mb-1.5 text-[24px] font-extrabold tracking-[-0.03em]">
                ¿Cuánto pides por puesto?
              </h1>
              <p className="mb-5 text-[14.5px] leading-relaxed text-plate-600">
                Puedes pedir menos que el tope. Más no, y no es la app siendo
                estricta: es lo que separa compartir gastos de cobrar un pasaje.
              </p>

              <div className="bg-plate-50 p-5">
                <p className="text-center text-[11.5px] font-bold tracking-[0.13em] text-plate-600 uppercase">
                  Aporte por puesto
                </p>
                <p className="cote cote text-center text-[44px] leading-tight font-extrabold tracking-[-0.04em]">
                  {formatUsd(price)}
                </p>
                <input
                  type="range"
                  min={0}
                  max={cap.maxPriceCents}
                  step={50}
                  value={price}
                  onChange={(e) => setPriceCents(Number(e.target.value))}
                  aria-label="Aporte por puesto"
                  className="mt-3 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-plate-200 [&::-moz-range-thumb]:size-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-4 [&::-moz-range-thumb]:border-ochre-500 [&::-moz-range-thumb]:bg-white [&::-webkit-slider-thumb]:size-6 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-ochre-500 [&::-webkit-slider-thumb]:bg-white"
                />
                <p className="cote mt-1 flex justify-between text-[12px] text-plate-600">
                  <span>Gratis</span>
                  <span>Tope {formatUsd(cap.maxPriceCents)}</span>
                </p>
              </div>

              <dl className="mt-4 text-[14.5px]">
                <Row label={`${corridor.distanceKm} km, peajes y desgaste`}>
                  {formatUsd(cap.costTotalCents)}
                </Row>
                <Row label={`Entre ${cap.occupants} ocupantes, tú incluido`}>
                  {formatUsd(cap.maxPriceCents)}
                </Row>
                <Row label="Recuperas con el carro lleno" strong>
                  {formatUsd(price * seats)}
                </Row>
                <Row label="Sigues poniendo de tu bolsillo">
                  {formatUsd(Math.max(0, cap.costTotalCents - price * seats))}
                </Row>
              </dl>
            </>
          )}

          <div className="mt-6 flex items-center gap-3 border-t border-plate-200 pt-5">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="border-[1.5px] border-plate-200 px-5 py-3 text-[15px] font-bold transition-colors hover:border-ochre-500"
              >
                Atrás
              </button>
            )}

            {step < 3 ? (
              <Button
                className="ml-auto"
                disabled={!canGoNext}
                onClick={() => setStep((s) => s + 1)}
              >
                Continuar
              </Button>
            ) : session ? (
              <Button className="ml-auto" onClick={() => setPublished(true)}>
                Publicar el viaje
              </Button>
            ) : (
              <AuthDialog
                trigger={
                  <button className="ml-auto inline-flex items-center justify-center bg-plate-900 px-5.5 py-3.5 text-[16px] font-bold text-white transition-colors hover:bg-plate-800">
                    Entrar y publicar
                  </button>
                }
              />
            )}
          </div>
        </div>

        <p className="mt-4 text-center text-[12.5px] leading-relaxed text-plate-600">
          Publicar es gratis. Partimos no cobra comisión y no interviene en el
          pago: el aporte te llega completo, de mano del pasajero.
        </p>
      </div>
    </Container>
  );
}

function pill(active: boolean) {
  return [
    "rounded-[12px] border-[1.5px] px-4 py-2.5 text-[14.5px] font-semibold transition-colors",
    active
      ? "border-plate-900 bg-plate-900 text-white"
      : "border-plate-200 text-plate-600 hover:border-accent hover:text-accent-ink",
  ].join(" ");
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
      className={`flex justify-between gap-4 py-1.5 ${strong ? "border-t border-plate-200 pt-2 font-semibold" : ""}`}
    >
      <dt className={strong ? "text-plate-900" : "text-plate-600"}>{label}</dt>
      <dd className="cote text-right whitespace-nowrap">{children}</dd>
    </div>
  );
}
