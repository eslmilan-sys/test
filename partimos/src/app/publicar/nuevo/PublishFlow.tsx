"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/site/Section";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { RouteMap } from "@/components/map/RouteMap";
import { CityCombobox } from "@/components/ui/CityCombobox";
import { PlacePicker } from "@/components/ui/PlacePicker";
import { AuthDialog } from "@/components/site/AuthDialog";
import { carsOf, useSession } from "@/lib/session";
import { ALL_CITIES, buildRoute, getCorridor } from "@/lib/corridors";
import {
  computePriceCap,
  formatUsd,
  VEHICLE_LABELS,
  PRICE_RULE,
  type VehicleCategory,
} from "@/lib/pricing";
import { formatDayLabel, servedPairCount } from "@/lib/trips";
import { MAPBOX_TOKEN, corridorStopsMapUrl } from "@/lib/mapbox";
import {
  CAR_MAKES,
  CAR_YEARS,
  agedConsumption,
  findCar,
  modelsForMake,
  rateFromConsumption,
} from "@/lib/cars";

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
  const { session, isDemo, updateSession } = useSession();
  const days = useMemo(() => nextDays(), []);

  /* La route peut arriver par ?ruta= (pages corridor) OU par
     ?desde=&hacia= (la carte de la première page). Les deux comptent :
     c'est le bug qui empêchait le saut d'étape — la carte envoyait
     desde/hacia et le flux ne lisait que ruta. */
  const presetPair = buildRoute(
    params.get("desde") ?? "",
    params.get("hacia") ?? "",
  );
  const preset = getCorridor(params.get("ruta") ?? "") ?? presetPair;
  /* Route déjà choisie ? On ne la redemande pas : l'étape Ruta est
     sautée, « Atrás » y ramène si besoin. */
  const [step, setStep] = useState(preset ? 1 : 0);
  const [from, setFrom] = useState(preset?.origin.slug ?? "panama-city");
  const [to, setTo] = useState(preset?.destination.slug ?? "chitre");
  const [picking, setPicking] = useState<"origin" | "destination">("origin");
  const [stops, setStops] = useState<string[]>([]);
  const [exactFrom, setExactFrom] = useState("");
  const [exactTo, setExactTo] = useState("");
  const [cityStops, setCityStops] = useState<string[]>([]);
  const [date, setDate] = useState(days[1].value);
  const [hour, setHour] = useState("06:00");
  const [seats, setSeats] = useState(3);
  /* Le trajet du lundi est souvent celui de TOUS les lundis : la
     récurrence évite de republier le même viaje chaque semaine. Chaque
     occurrence reste un viaje à part entière (sa page, ses réservations,
     son instantané de barème). */
  const [recurrence, setRecurrence] = useState<
    "una-vez" | "diario" | "semanal" | "mensual"
  >("una-vez");
  const [category, setCategory] = useState<VehicleCategory>("standard");
  /* Comment le conducteur ACCEPTE l'aporte hors app. Le cobro dans l'app
     est toujours là (il n'a rien à gérer, l'argent lui arrive complet) ;
     le reste, c'est SON choix — dérivé de la session tant qu'il n'a pas
     cliqué, comme le canal du passager côté réservation. */
  const [outsideChoice, setOutsideChoice] = useState<
    ("yappy" | "efectivo")[] | null
  >(null);
  const acceptsOutside = outsideChoice ??
    session?.acceptsOutside ?? ["yappy", "efectivo"];
  const [carMake, setCarMake] = useState("");
  const [carModel, setCarModel] = useState("");
  const [carYear, setCarYear] = useState(2020);
  const [priceCents, setPriceCents] = useState<number | null>(null);
  const [published, setPublished] = useState(false);

  /* Le carro réel prime sur la catégorie : sa consommation de référence,
     corrigée de l'âge, donne le taux au km sur la MÊME droite que le
     barème (voir src/lib/cars.ts). Le carro ENREGISTRÉ dans Mi cuenta
     arrive prérempli — publier ne redemande pas ce qu'on sait déjà.
     « Otro carro » retombe sur les trois catégories — jamais bloquant. */
  const registeredCars = carsOf(session).filter((c) =>
    findCar(c.make, c.model),
  );
  const [useSavedCar, setUseSavedCar] = useState(true);
  const [carIndex, setCarIndex] = useState(0);
  /* S'il n'a qu'un carro, c'est lui d'office ; s'il en a plusieurs, il
     choisit lequel il prend ce jour-là. */
  const savedCar =
    registeredCars[Math.min(carIndex, registeredCars.length - 1)] ?? null;
  const pickerCar = carMake === "otro" ? undefined : findCar(carMake, carModel);
  const activeCar =
    savedCar && useSavedCar
      ? {
          ref: findCar(savedCar.make, savedCar.model)!,
          year: savedCar.year,
          fromProfile: true,
        }
      : pickerCar
        ? { ref: pickerCar, year: carYear, fromProfile: false }
        : null;
  const carL100 = activeCar
    ? agedConsumption(activeCar.ref.l100, activeCar.year)
    : null;
  const carRate = carL100 !== null ? rateFromConsumption(carL100) : null;

  /* N'IMPORTE QUELLE paire de villes marche : la ruta s'arme toute seule
     sur le réseau routier (corridor prédéfini quand il existe, synthèse
     par tronçons sinon). Il n'y a pas de « rutas cerradas ». */
  const corridor = buildRoute(from, to);
  const cap = corridor
    ? computePriceCap(
        corridor.distanceKm,
        corridor.tollCents,
        carRate ?? category,
        seats,
      )
    : null;
  const price = priceCents ?? cap?.maxPriceCents ?? 0;

  /** Villes traversées entre l'origine et la destination — les arrêts possibles. */
  const innerStops = corridor ? corridor.waypoints.slice(1, -1) : [];
  /* Sur une longue ruta le réseau dense propose une douzaine de pueblos —
     tous valables, mais une grille de 14 cases écrase l'écran. Le tri
     intelligent : les villes MAJEURES d'abord (celles que tout le monde
     connaît), les pueblos repliés derrière un bouton — et un pueblo déjà
     coché reste toujours visible. */
  const isMajorCity = (slug: string) =>
    ALL_CITIES.find((c) => c.slug === slug)?.isMajor ?? false;
  const [showPueblos, setShowPueblos] = useState(false);
  const majorStops = innerStops.filter((s) => isMajorCity(s.citySlug));
  const puebloStops = innerStops.filter((s) => !isMajorCity(s.citySlug));
  const visibleStops =
    showPueblos || majorStops.length === 0
      ? innerStops
      : innerStops.filter(
          (s) => isMajorCity(s.citySlug) || cityStops.includes(s.citySlug),
        );
  const hiddenCount = innerStops.length - visibleStops.length;
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
        <div className="mx-auto max-w-[560px] rounded-[24px] border border-ink-200 bg-white p-7 text-center">
          <span className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-ink-900 text-white">
            <Icon name="check" className="size-6" />
          </span>
          <h1 className="mb-2 font-display text-[26px] font-extrabold tracking-[-0.03em]">
            Tu viaje está publicado
          </h1>
          <p className="mb-6 text-[15px] leading-relaxed text-ink-500">
            {exactFrom || corridor.origin.shortName} →{" "}
            {exactTo || corridor.destination.shortName}, {formatDayLabel(date)}{" "}
            a las {hour}. {seats} {seats === 1 ? "puesto" : "puestos"} a{" "}
            {formatUsd(price)}
            {recurrence === "diario" && ", repetido cada día"}
            {recurrence === "semanal" && ", repetido cada semana"}
            {recurrence === "mensual" && ", repetido cada mes"}. Te avisamos
            por WhatsApp en cuanto alguien pida un puesto — cada quien te
            propone su punto y tú decides si te queda de paso.
          </p>
          <p className="mb-6 rounded-[14px] bg-ink-50 px-4 py-3 text-[13.5px] leading-relaxed text-ink-500">
            Aceptas el aporte{" "}
            {acceptsOutside.length === 0
              ? "solo por la app — todo llega cobrado, con comprobante"
              : `por la app${
                  acceptsOutside.includes("yappy") ? ", por Yappy directo" : ""
                }${acceptsOutside.includes("efectivo") ? " y en efectivo" : ""}`}
            . Te llega completo en todos los casos.
          </p>
          {cityStops.length > 0 && (
            <p className="mb-6 rounded-[14px] bg-accent-soft px-4 py-3 text-[13.5px] leading-relaxed text-accent-ink">
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
              className="rounded-[14px] bg-ink-900 px-5 py-3 font-display text-[15px] font-bold text-white"
            >
              Ver mis viajes
            </Link>
            {/* La page /viajes n'existe que pour les corridors éditoriaux ;
                une ruta synthétisée n'a pas de page dédiée — pas de lien
                mort. */}
            {getCorridor(corridor.slug) && (
              <Link
                href={`/viajes/${corridor.slug}`}
                className="rounded-[14px] border-[1.5px] border-ink-200 px-5 py-3 font-display text-[15px] font-bold"
              >
                Ver la ruta
              </Link>
            )}
          </div>
          {isDemo && (
            <p className="mt-5 text-[12.5px] text-ink-500">
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
                className={`block h-1 rounded-full ${index <= step ? "bg-ink-900" : "bg-ink-200"}`}
              />
              <span
                className={`mt-1.5 block text-[11.5px] font-semibold ${
                  index === step ? "text-ink-900" : "text-ink-500"
                }`}
              >
                {label}
              </span>
            </li>
          ))}
        </ol>

        <div className="glass liquid rounded-[22px] p-5 sm:p-6 [--glass-alpha:0.88]">
          {step === 0 && (
            <>
              <h1 className="mb-1.5 font-display text-[24px] font-extrabold tracking-[-0.03em]">
                ¿Por dónde vas?
              </h1>
              <p className="mb-5 text-[14.5px] leading-relaxed text-ink-500">
                Escoge tu salida y tu destino — cualquier par de ciudades. La
                ruta se arma sola, con sus paradas en el camino.
              </p>

              {/* Les deux listes D'ABORD, la carte en dessous : écrire sa
                  ville est le geste évident, la carte confirme d'un coup
                  d'œil. Avant, la carte seule portait tout, avec un état
                  « je choisis l'origine ou la destination ? » invisible —
                  c'était le point où l'on s'emmêlait. */}
              <div className="relative mb-3 rounded-[18px] border border-ink-200 bg-white">
                <CityCombobox
                  id="pub-desde"
                  label="Desde"
                  value={from}
                  exclude={to}
                  tone="origin"
                  onChange={(slug) => {
                    setFrom(slug);
                    if (slug === to) setTo("");
                    setStops([]);
                    setCityStops([]);
                  }}
                />
                <button
                  type="button"
                  aria-label="Invertir salida y destino"
                  onClick={() => {
                    setFrom(to);
                    setTo(from);
                    setStops([]);
                    setCityStops([]);
                  }}
                  className="absolute top-1/2 right-3 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border border-ink-200 bg-white text-ink-500 shadow-sm transition-colors hover:border-accent hover:text-accent-ink"
                >
                  <Icon name="swap" className="size-4" />
                </button>
                <div className="border-t border-ink-200">
                  <CityCombobox
                    id="pub-hacia"
                    label="Hacia"
                    value={to}
                    exclude={from}
                    tone="destination"
                    onChange={(slug) => {
                      setTo(slug);
                      setStops([]);
                      setCityStops([]);
                    }}
                  />
                </div>
              </div>

              <div className="rounded-[16px] border border-ink-200 bg-ink-50/60 p-3">
                <RouteMap
                  originSlug={from}
                  destinationSlug={to}
                  route={corridor ?? undefined}
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
              {corridor && (
                <p className="tnum mt-3 rounded-[12px] bg-ink-50 px-4 py-3 text-[13.5px] leading-relaxed text-ink-500">
                  <b className="font-semibold text-ink-900">
                    {corridor.origin.shortName} → {corridor.destination.shortName}
                  </b>
                  {" — "}
                  {corridor.distanceKm} km
                  {corridor.waypoints.length > 2 && (
                    <>
                      , pasando por{" "}
                      {corridor.waypoints
                        .slice(1, -1)
                        .map((w) => w.name)
                        .join(", ")}
                    </>
                  )}
                  . En el siguiente paso marcas dónde puedes parar.
                </p>
              )}
            </>
          )}

          {step === 1 && corridor && (
            <>
              <h1 className="mb-1.5 font-display text-[24px] font-extrabold tracking-[-0.03em]">
                ¿Dónde puedes parar?
              </h1>
              <p className="mb-5 text-[14.5px] leading-relaxed text-ink-500">
                Tú decides el recorrido. Marca solo lo que ya te queda de paso.
              </p>

              {/* Le point EXACT du conducteur : c'est LUI qui fixe d'où il
                  part vraiment et jusqu'où il va (R4). Les passagers
                  proposeront leur point ensuite — et c'est lui qui accepte
                  ou pas. Catalogue local + géocodeur Mapbox, saisie libre
                  toujours valable. */}
              <section className="mb-6 grid gap-3 sm:grid-cols-2">
                <PlacePicker
                  id="pub-salida-exacta"
                  label={`Sales exactamente de… (${corridor.origin.shortName})`}
                  citySlug={corridor.origin.slug}
                  value={exactFrom}
                  onChange={setExactFrom}
                  placeholder="Ej. Multiplaza, Parque Omar…"
                />
                <PlacePicker
                  id="pub-llegada-exacta"
                  label={`Llegas hasta… (${corridor.destination.shortName})`}
                  citySlug={corridor.destination.slug}
                  value={exactTo}
                  onChange={setExactTo}
                  placeholder="Ej. el parque central, tu barriada…"
                />
              </section>

              {/* LA CARTE DU RECORRIDO, vivante : le tracé suit la route,
                  l'origine est bleue, la destination verte, et chaque ville
                  cochée ci-dessous pose son épingle ambre À LA SECONDE où on
                  la coche. C'est l'API qui redessine — un échange de src,
                  zéro bibliothèque. */}
              {MAPBOX_TOKEN && (
                <figure className="glass liquid mb-6 overflow-hidden rounded-[16px] p-2 [--glass-alpha:0.8]">
                  {/* eslint-disable-next-line @next/next/no-img-element -- image statique Mapbox, dynamique par src */}
                  <img
                    src={corridorStopsMapUrl(corridor, cityStops)}
                    alt={`Recorrido ${corridor.origin.shortName} → ${corridor.destination.shortName} con tus paradas marcadas`}
                    width={720}
                    height={300}
                    loading="lazy"
                    decoding="async"
                    className="h-auto w-full rounded-[11px] object-cover"
                  />
                  <figcaption className="px-2 pt-1.5 pb-0.5 text-[12px] text-ink-500">
                    Azul: sales · Verde: llegas · Ámbar: donde aceptas parar y
                    recoger — se dibujan al marcar.
                  </figcaption>
                </figure>
              )}

              {/* Villes de passage — le multiplicateur de couverture. Un
                  conducteur qui déclare deux arrêts répond à six recherches au
                  lieu d'une, sans changer une minute à son trajet. C'est
                  l'argument à lui montrer, chiffré et en direct. */}
              {innerStops.length > 0 && (
                <section className="mb-6">
                  <h2 className="mb-1 text-[11.5px] font-bold tracking-[0.11em] text-ink-500 uppercase">
                    Ciudades donde puedes dejar a alguien
                  </h2>
                  <p className="mb-3 text-[13.5px] leading-relaxed text-ink-500">
                    Pasas por estas ciudades de todas formas. Si aceptas parar,
                    alguien puede bajarse ahí y aportar por esos kilómetros.
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {visibleStops.map((stop) => {
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
                          className={`flex items-center gap-3 rounded-[14px] border px-4 py-3 text-left transition-colors ${
                            active
                              ? "border-ink-900 bg-ink-50"
                              : "border-ink-200 hover:border-accent"
                          }`}
                        >
                          <span
                            aria-hidden
                            className={`flex size-5 shrink-0 items-center justify-center rounded-[6px] border-2 ${
                              active
                                ? "border-ink-900 bg-ink-900 text-white"
                                : "border-ink-200"
                            }`}
                          >
                            {active && <Icon name="check" className="size-3" />}
                          </span>
                          <span className="min-w-0">
                            <span
                              className={`block text-[15px] ${active ? "font-semibold" : ""}`}
                            >
                              {stop.name}
                            </span>
                            <span className="tnum block text-[12.5px] text-ink-500">
                              km {stop.km} de tu ruta
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {puebloStops.length > 0 && majorStops.length > 0 && (
                    <button
                      type="button"
                      aria-expanded={showPueblos}
                      onClick={() => setShowPueblos((v) => !v)}
                      className="mt-2.5 text-[13.5px] font-semibold text-accent-ink hover:underline"
                    >
                      {showPueblos
                        ? "Ocultar los pueblos del camino"
                        : `Mostrar los pueblos del camino (${hiddenCount} más)`}
                    </button>
                  )}
                  <p
                    className="mt-3 rounded-[12px] bg-accent-soft px-4 py-3 text-[13.5px] leading-relaxed text-accent-ink"
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

              <h2 className="mb-1 text-[11.5px] font-bold tracking-[0.11em] text-ink-500 uppercase">
                Por dónde puedes recoger
              </h2>
              <p className="mb-3 text-[13.5px] leading-relaxed text-ink-500">
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
                      className={`flex items-center gap-3 rounded-[14px] border px-4 py-3 text-left text-[15px] transition-colors disabled:opacity-40 ${
                        active
                          ? "border-ink-900 bg-ink-50 font-semibold"
                          : "border-ink-200 hover:border-accent"
                      }`}
                    >
                      <span
                        aria-hidden
                        className={`flex size-5 shrink-0 items-center justify-center rounded-[6px] border-2 ${
                          active
                            ? "border-ink-900 bg-ink-900 text-white"
                            : "border-ink-200"
                        }`}
                      >
                        {active && <Icon name="check" className="size-3" />}
                      </span>
                      {point}
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-[13px] text-ink-500">
                {stops.length}/{PRICE_RULE.maxStops} paradas · si un pasajero
                propone otro punto, tú decides si te queda de paso.
              </p>
            </>
          )}

          {step === 2 && (
            <>
              <h1 className="mb-1.5 font-display text-[24px] font-extrabold tracking-[-0.03em]">
                ¿Cuándo sales?
              </h1>
              <p className="mb-5 text-[14.5px] leading-relaxed text-ink-500">
                Tú pones la hora. Nadie te asigna un viaje ni te cambia el
                recorrido.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <label>
                  <span className="mb-1.5 block text-[11.5px] font-bold tracking-[0.11em] text-ink-500 uppercase">
                    Día
                  </span>
                  <select
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full cursor-pointer rounded-[12px] border border-ink-200 px-3.5 py-2.5 text-[15px] font-semibold focus:border-accent focus:outline-none"
                  >
                    {days.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="mb-1.5 block text-[11.5px] font-bold tracking-[0.11em] text-ink-500 uppercase">
                    Hora de salida
                  </span>
                  <input
                    type="time"
                    value={hour}
                    onChange={(e) => setHour(e.target.value)}
                    className="tnum w-full rounded-[12px] border border-ink-200 px-3.5 py-2.5 text-[15px] font-semibold focus:border-accent focus:outline-none"
                  />
                </label>
              </div>

              <fieldset className="mt-5">
                <legend className="mb-2 text-[11.5px] font-bold tracking-[0.11em] text-ink-500 uppercase">
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
                <legend className="mb-2 text-[11.5px] font-bold tracking-[0.11em] text-ink-500 uppercase">
                  ¿Se repite?
                </legend>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      ["una-vez", "Solo esta vez"],
                      ["diario", "Cada día"],
                      ["semanal", "Cada semana"],
                      ["mensual", "Cada mes"],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={recurrence === value}
                      onClick={() => setRecurrence(value)}
                      className={pill(recurrence === value)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {recurrence !== "una-vez" && (
                  <p className="mt-2 text-[12.5px] leading-relaxed text-ink-500">
                    Cada salida se publica como su propio viaje: puedes
                    cancelar una sin tocar las demás, y el aporte se congela
                    viaje por viaje.
                  </p>
                )}
              </fieldset>

              <fieldset className="mt-5">
                <legend className="mb-2 text-[11.5px] font-bold tracking-[0.11em] text-ink-500 uppercase">
                  Tu carro
                </legend>

                {savedCar && useSavedCar ? (
                  <>
                    {registeredCars.length > 1 && (
                      <div className="mb-2 flex flex-wrap gap-2">
                        {registeredCars.map((c, i) => (
                          <button
                            key={`${c.make}-${c.model}-${c.year}-${i}`}
                            type="button"
                            aria-pressed={i === carIndex}
                            onClick={() => {
                              setCarIndex(i);
                              setPriceCents(null);
                            }}
                            className={pill(i === carIndex)}
                          >
                            {c.make} {c.model}
                          </button>
                        ))}
                      </div>
                    )}
                  <div className="flex flex-wrap items-center gap-3 rounded-[14px] border border-ink-200 px-4 py-3">
                    {savedCar.photoDataUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element -- data URL locale */
                      <img
                        src={savedCar.photoDataUrl}
                        alt=""
                        aria-hidden
                        className="h-12 w-16 rounded-[10px] border border-ink-200 object-cover"
                      />
                    ) : (
                      <Icon name="car" className="size-6 text-ink-500" />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-semibold">
                        {savedCar.make} {savedCar.model} {savedCar.year}
                      </span>
                      {carRate !== null && (
                        <span className="tnum block text-[12.5px] text-ink-500">
                          {formatUsd(carRate)} por km — tu carro registrado
                        </span>
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setUseSavedCar(false);
                        setPriceCents(null);
                      }}
                      className="text-[13px] font-semibold text-accent-ink hover:underline"
                    >
                      Usar otro
                    </button>
                  </div>
                  </>
                ) : (
                  <>
                    {savedCar && (
                      <button
                        type="button"
                        onClick={() => {
                          setUseSavedCar(true);
                          setPriceCents(null);
                        }}
                        className="mb-2 text-[13px] font-semibold text-accent-ink hover:underline"
                      >
                        ← Volver a mi carro registrado ({savedCar.make}{" "}
                        {savedCar.model})
                      </button>
                    )}
                    <div className="grid gap-2 sm:grid-cols-3">
                  <select
                    value={carMake}
                    onChange={(e) => {
                      setCarMake(e.target.value);
                      setCarModel("");
                      setPriceCents(null);
                    }}
                    aria-label="Marca del carro"
                    className={carSelect()}
                  >
                    <option value="">Marca…</option>
                    {CAR_MAKES.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                    <option value="otro">Otro / no está</option>
                  </select>

                  <select
                    value={carModel}
                    onChange={(e) => {
                      setCarModel(e.target.value);
                      setPriceCents(null);
                    }}
                    disabled={!carMake || carMake === "otro"}
                    aria-label="Modelo del carro"
                    className={carSelect()}
                  >
                    <option value="">Modelo…</option>
                    {carMake !== "otro" &&
                      modelsForMake(carMake).map((m) => (
                        <option key={m.model} value={m.model}>
                          {m.model}
                        </option>
                      ))}
                  </select>

                  <select
                    value={carYear}
                    onChange={(e) => {
                      setCarYear(Number(e.target.value));
                      setPriceCents(null);
                    }}
                    disabled={!pickerCar}
                    aria-label="Año del carro"
                    className={carSelect()}
                  >
                    {CAR_YEARS.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>

                {pickerCar && carL100 !== null && carRate !== null && (
                  <p className="tnum mt-2.5 rounded-[12px] bg-ink-50 px-3.5 py-2.5 text-[13px] leading-relaxed text-ink-500">
                    <b className="font-semibold text-ink-900">
                      {pickerCar.make} {pickerCar.model} {carYear}
                    </b>
                    {" — consumo de referencia ~"}
                    {carL100.toFixed(1).replace(".", ",")} L/100 km, o sea{" "}
                    <b className="font-semibold text-ink-900">
                      {formatUsd(carRate)} por km
                    </b>
                    . El tope refleja lo que cuesta mover TU carro — un carro
                    que gasta más puede pedir más, uno ahorrador pide menos.
                  </p>
                )}

                {carMake === "otro" && (
                  <div className="mt-2.5">
                    <p className="mb-2 text-[13px] text-ink-500">
                      Sin problema — elige la categoría que más se parece:
                    </p>
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
                  </div>
                )}
                  </>
                )}
              </fieldset>
            </>
          )}

          {step === 3 && cap && corridor && (
            <>
              <h1 className="mb-1.5 font-display text-[24px] font-extrabold tracking-[-0.03em]">
                ¿Cuánto pides por puesto?
              </h1>
              <p className="mb-5 text-[14.5px] leading-relaxed text-ink-500">
                Puedes pedir menos que el tope. Más no, y no es la app siendo
                estricta: es lo que separa compartir gastos de cobrar un pasaje.
              </p>

              <div className="rounded-[18px] bg-ink-50 p-5">
                <p className="text-center text-[11.5px] font-bold tracking-[0.13em] text-ink-500 uppercase">
                  Aporte por puesto
                </p>
                <p className="tnum text-center font-display text-[44px] leading-tight font-extrabold tracking-[-0.04em] text-action-deep">
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
                  className="mt-3 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-ink-200 [&::-moz-range-thumb]:size-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-4 [&::-moz-range-thumb]:border-accent [&::-moz-range-thumb]:bg-white [&::-webkit-slider-thumb]:size-6 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-accent [&::-webkit-slider-thumb]:bg-white"
                />
                <p className="tnum mt-1 flex justify-between text-[12px] text-ink-500">
                  <span>Gratis</span>
                  <span>Tope {formatUsd(cap.maxPriceCents)}</span>
                </p>
              </div>

              <dl className="mt-4 text-[14.5px]">
                <Row
                  label={
                    activeCar
                      ? `Tu ${activeCar.ref.make} ${activeCar.ref.model} ${activeCar.year}, por km`
                      : `Categoría ${VEHICLE_LABELS[category]}, por km`
                  }
                >
                  {formatUsd(cap.ratePerKmCents)}
                </Row>
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

              {/* Comment il ACCEPTE l'aporte. La ligne app est fixe et
                  cochée — c'est la promesse de la maison : cobro déjà
                  hecho au moment de confirmer, aporte complet, rien à
                  gérer. Le hors-app est à lui : Yappy directo, efectivo,
                  les deux, ou aucun (« solo por la app »). */}
              {(() => {
                const toggle = (method: "yappy" | "efectivo") =>
                  setOutsideChoice(
                    acceptsOutside.includes(method)
                      ? acceptsOutside.filter((m) => m !== method)
                      : [...acceptsOutside, method],
                  );
                return (
                  <fieldset className="mt-6">
                    <legend className="mb-1 text-[11.5px] font-bold tracking-[0.11em] text-ink-500 uppercase">
                      Cómo aceptas el aporte
                    </legend>
                    <p className="mb-3 text-[13.5px] leading-relaxed text-ink-500">
                      El cobro por la app siempre está activo — a ti te llega
                      completo, sin gestionar nada. Lo demás lo decides tú.
                    </p>
                    <div className="grid gap-1.5">
                      <div className="flex items-start gap-3 rounded-[14px] border border-ink-900 bg-ink-50 px-4 py-3">
                        <span
                          aria-hidden
                          className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-[6px] border-2 border-ink-900 bg-ink-900 text-white"
                        >
                          <Icon name="check" className="size-3" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[15px] font-semibold">
                            En la app — Yappy o tarjeta, siempre
                          </span>
                          <span className="block text-[12.5px] leading-snug text-ink-500">
                            El pasajero paga al confirmar, el cobro ya está
                            hecho antes de salir, y tu aporte te llega completo
                            — la tarifa la paga él.
                          </span>
                        </span>
                      </div>
                      {(
                        [
                          [
                            "yappy",
                            "Yappy directo a tu número",
                            "Te lo manda él mismo, el día del viaje.",
                          ],
                          [
                            "efectivo",
                            "Efectivo en la mano",
                            "Como toda la vida. Si prefieres no manejar plata, desmárcalo.",
                          ],
                        ] as const
                      ).map(([method, title, body]) => {
                        const active = acceptsOutside.includes(method);
                        return (
                          <button
                            key={method}
                            type="button"
                            aria-pressed={active}
                            onClick={() => toggle(method)}
                            className={`flex items-start gap-3 rounded-[14px] border px-4 py-3 text-left transition-colors ${
                              active
                                ? "border-ink-900 bg-ink-50"
                                : "border-ink-200 hover:border-accent"
                            }`}
                          >
                            <span
                              aria-hidden
                              className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-[6px] border-2 ${
                                active
                                  ? "border-ink-900 bg-ink-900 text-white"
                                  : "border-ink-200"
                              }`}
                            >
                              {active && (
                                <Icon name="check" className="size-3" />
                              )}
                            </span>
                            <span className="min-w-0">
                              <span
                                className={`block text-[15px] ${active ? "font-semibold" : ""}`}
                              >
                                {title}
                              </span>
                              <span className="block text-[12.5px] leading-snug text-ink-500">
                                {body}
                              </span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    {acceptsOutside.length === 0 && (
                      <p className="mt-2.5 rounded-[12px] bg-accent-soft px-4 py-3 text-[13px] leading-relaxed text-accent-ink">
                        Solo por la app: nadie te paga en la mano, todo llega
                        cobrado y con comprobante. Los pasajeros lo verán antes
                        de reservar.
                      </p>
                    )}
                  </fieldset>
                );
              })()}
            </>
          )}

          <div className="mt-6 flex items-center gap-3 border-t border-ink-200 pt-5">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="rounded-[14px] border-[1.5px] border-ink-200 px-5 py-3 font-display text-[15px] font-bold transition-colors hover:border-accent"
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
              <Button
                className="ml-auto"
                onClick={() => {
                  // Le choix de cobro devient le réglage du compte : la
                  // prochaine publication part de là.
                  updateSession({ acceptsOutside });
                  setPublished(true);
                }}
              >
                Publicar el viaje
              </Button>
            ) : (
              <AuthDialog
                trigger={
                  <button className="ml-auto inline-flex items-center justify-center rounded-[14px] bg-ink-900 px-5.5 py-3.5 font-display text-[16px] font-bold text-white transition-colors hover:bg-ink-800">
                    Conectarme y publicar
                  </button>
                }
              />
            )}
          </div>
        </div>

        <p className="mt-4 text-center text-[12.5px] leading-relaxed text-ink-500">
          Publicar es gratis y tu aporte te llega completo — en la mano, o
          por la app si el pasajero eligió pagar en línea (la tarifa de
          servicio la paga él, nunca tú).
        </p>
      </div>
    </Container>
  );
}

function carSelect() {
  return [
    "w-full appearance-none rounded-[12px] border-[1.5px] border-ink-200 bg-white",
    "px-3.5 py-2.5 text-[14.5px] font-semibold text-ink-900 transition-colors",
    "hover:border-accent focus:border-accent focus:outline-none",
    "disabled:cursor-not-allowed disabled:opacity-50",
  ].join(" ");
}

function pill(active: boolean) {
  return [
    "rounded-[12px] border-[1.5px] px-4 py-2.5 text-[14.5px] font-semibold transition-colors",
    active
      ? "border-ink-900 bg-ink-900 text-white"
      : "border-ink-200 text-ink-500 hover:border-accent hover:text-accent-ink",
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
      className={`flex justify-between gap-4 py-1.5 ${strong ? "border-t border-ink-200 pt-2 font-semibold" : ""}`}
    >
      <dt className={strong ? "text-ink-900" : "text-ink-500"}>{label}</dt>
      <dd className="tnum text-right whitespace-nowrap">{children}</dd>
    </div>
  );
}
