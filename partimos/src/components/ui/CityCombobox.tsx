"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Command } from "cmdk";
import { ALL_CITIES } from "@/lib/corridors";
import { nearestCity, searchPlaces } from "@/lib/places";
import { retrievePlace } from "@/lib/mapbox";
import {
  searchEverywhere,
  GEOSEARCH_ENABLED,
  type FoundPlace,
} from "@/lib/geosearch";
import { Icon } from "@/components/ui/Icon";

/**
 * Saisie de ville au clavier, avec liste filtrée.
 *
 * Une liste déroulante native oblige à connaître d'avance le nom exact et à
 * parcourir sept entrées ; on tape « chit » et on obtient Chitré. La
 * recherche ignore les accents, parce que personne ne tape « Penonomé » avec
 * l'accent sur un clavier de téléphone.
 *
 * `cmdk` fournit le comportement de liste ARIA (rôles, activedescendant,
 * navigation aux flèches). Le réécrire à la main serait trois fois plus de
 * code pour une accessibilité moins sûre.
 */

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

type Props = {
  id: string;
  label: string;
  value: string;
  onChange: (slug: string) => void;
  /** Ville à exclure — on ne va pas d'une ville à elle-même. */
  exclude?: string;
  tone?: "origin" | "destination";
  /** Le LIEU précis choisi (PH, mall, adresse) en plus de sa ville — ou
   *  "" quand une ville nue est choisie. C'est ce qui permet à /ya de
   *  porter l'adresse exacte jusqu'au point de recogida proposé. */
  onPlace?: (place: string, citySlug: string) => void;
};

export function CityCombobox({
  id,
  label,
  value,
  onChange,
  exclude,
  tone = "origin",
  onPlace,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = ALL_CITIES.find((c) => c.slug === value);

  const results = useMemo(() => {
    const q = normalize(query.trim());
    return ALL_CITIES.filter((city) => {
      if (city.slug === exclude) return false;
      if (!q) return true;
      return (
        normalize(city.name).includes(q) || normalize(city.province).includes(q)
      );
    });
  }, [query, exclude]);

  /* Les LIEUX connus aussi : taper « multiplaza » ou « machetazo » doit
     marcher — les gens pensent en repères, pas en municipios. Choisir un
     lieu sélectionne sa ville. */
  const placeResults = useMemo(
    () =>
      searchPlaces(query).filter(
        (p) =>
          p.citySlug !== exclude &&
          ALL_CITIES.some((c) => c.slug === p.citySlug),
      ),
    [query, exclude],
  );

  /* LES VRAIS LIEUX, tous : quand ni les villes ni le catalogue ne
     répondent, le géocodeur Mapbox prend le relais — une barriada, un
     restaurant, une école. Chaque résultat est rattaché à la ville
     desservie la plus proche : chercher « Boquete » propose David,
     parce que c'est le corridor qui y mène. Débouncé, annulable,
     silencieux sans jeton. */
  const [remote, setRemote] = useState<FoundPlace[]>([]);
  const [resolving, setResolving] = useState<string | null>(null);
  /* Jamais un clic qui ne fait rien : quand un lieu ne peut pas devenir
     une ville (échec de résolution, ou même ville que l'autre champ),
     on le DIT sous le champ au lieu d'avaler le clic. */
  const [notice, setNotice] = useState<string | null>(null);
  const debounce = useRef<number>(0);
  useEffect(() => {
    if (!open || !GEOSEARCH_ENABLED || query.trim().length < 3) return;
    const controller = new AbortController();
    window.clearTimeout(debounce.current);
    debounce.current = window.setTimeout(() => {
      /* TomTom + LocationIQ + Mapbox en parallèle — voir geosearch.ts. */
      searchEverywhere(query, undefined, controller.signal).then(setRemote);
    }, 300);
    return () => {
      controller.abort();
      window.clearTimeout(debounce.current);
    };
  }, [query, open]);

  const remoteResults = useMemo(() => {
    if (query.trim().length < 3) return [];
    return remote
      .filter(
        (r) =>
          /* Déjà proposé en ville ou en lieu connu : inutile en double. */
          !results.some((c) => normalize(c.name) === normalize(r.name)) &&
          !placeResults.some((p) => normalize(p.name) === normalize(r.name)),
      )
      .map((r) => ({
        ...r,
        /* Coordonnées connues (TomTom, LocationIQ) : la ville s'affiche
           AVANT le clic — on sait où on va atterrir. Mapbox (coords au
           retrieve) : résolue au clic. */
        city:
          r.lat !== 0 || r.lng !== 0
            ? nearestCity(r.lat, r.lng, ALL_CITIES)
            : null,
      }))
      .slice(0, 4);
  }, [remote, query, results, placeResults]);

  /* Le choix d'un lieu : ses coordonnées arrivent au moment du clic
     (retrieve pour Search Box, déjà là pour v5), puis la ville desservie
     la plus proche devient la valeur du champ. */
  const pickRemote = async (r: FoundPlace) => {
    setResolving(r.mapboxId || r.name);
    setNotice(null);
    const coords =
      r.lat !== 0 || r.lng !== 0
        ? { lat: r.lat, lng: r.lng }
        : r.mapboxId
          ? await retrievePlace(r.mapboxId)
          : null;
    setResolving(null);
    if (!coords) {
      setNotice("No pudimos ubicar ese lugar. Elige una ciudad de la lista.");
      return;
    }
    const city = nearestCity(coords.lat, coords.lng, ALL_CITIES);
    if (city.slug === exclude) {
      setNotice(
        `Ese lugar queda por ${city.name}, que ya es tu otro punto.`,
      );
      return;
    }
    onChange(city.slug);
    onPlace?.(r.name, city.slug);
    setOpen(false);
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-3 rounded-[14px] px-3.5 py-3 transition-colors hover:bg-ink-50">
        <span
          aria-hidden
          className={`size-[19px] shrink-0 border-[3px] ${
            tone === "origin"
              ? "rounded-full border-accent"
              : "rounded-[6px] border-brand-green-deep"
          }`}
        />
        <div className="min-w-0 flex-1">
          <label
            htmlFor={id}
            className="block text-[11.5px] font-bold tracking-[0.11em] text-ink-500 uppercase"
          >
            {label}
          </label>
          <input
            id={id}
            type="text"
            role="combobox"
            aria-expanded={open}
            aria-controls={`${id}-list`}
            aria-autocomplete="list"
            autoComplete="off"
            value={open ? query : (selected?.name ?? "")}
            placeholder="Escribe tu ciudad"
            onFocus={() => {
              setQuery("");
              setOpen(true);
            }}
            onChange={(e) => {
              setQuery(e.target.value);
              setNotice(null);
            }}
            onBlur={() => window.setTimeout(() => setOpen(false), 120)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setOpen(false);
              /* LE bug du téléphone : la touche « intro » du clavier ne
                 sélectionnait RIEN — la liste restait ouverte et le tap
                 suivant tombait dedans, choisissant une ville au hasard.
                 Entrée prend le premier résultat, dans l'ordre d'affichage :
                 ville, puis lieu connu, puis lieu du géocodeur. */
              if (e.key === "Enter" && open) {
                e.preventDefault();
                if (results[0]) {
                  onChange(results[0].slug);
                  onPlace?.("", results[0].slug);
                  setOpen(false);
                } else if (placeResults[0]) {
                  onChange(placeResults[0].citySlug);
                  onPlace?.(placeResults[0].name, placeResults[0].citySlug);
                  setOpen(false);
                } else if (remoteResults[0]) {
                  void pickRemote(remoteResults[0]);
                }
              }
            }}
            className="w-full border-none bg-transparent py-px text-[16.5px] font-semibold text-ink-900 placeholder:font-medium placeholder:text-ink-500 focus:outline-none"
          />
        </div>
        <Icon
          name="search"
          className={`size-4 shrink-0 text-ink-300 transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
        />
      </div>

      {open && (
        <Command
          id={`${id}-list`}
          shouldFilter={false}
          className="absolute inset-x-0 top-full z-30 mt-1 overflow-hidden rounded-[14px] border border-ink-200 bg-white shadow-lift"
        >
          <Command.List className="max-h-64 overflow-y-auto p-1.5">
            {results.length === 0 &&
              placeResults.length === 0 &&
              remoteResults.length === 0 && (
              <Command.Empty className="px-3 py-3 text-[14.5px] text-ink-500">
                Todavía no llegamos a esa ciudad. Escríbela igual y te avisamos
                cuando abramos la ruta.
              </Command.Empty>
            )}
            {results.map((city) => (
              <Command.Item
                key={city.slug}
                value={city.slug}
                onMouseDown={(e) => e.preventDefault()}
                onSelect={() => {
                  onChange(city.slug);
                  onPlace?.("", city.slug);
                  setOpen(false);
                }}
                className="flex cursor-pointer items-baseline justify-between gap-3 rounded-[10px] px-3 py-2.5 text-[15px] data-[selected=true]:bg-ink-50"
              >
                <span className="font-semibold">{city.name}</span>
                <span className="text-[12.5px] text-ink-500">
                  {city.province}
                </span>
              </Command.Item>
            ))}
            {placeResults.map((place) => {
              const placeCity = ALL_CITIES.find(
                (c) => c.slug === place.citySlug,
              )!;
              return (
                <Command.Item
                  key={`place-${place.name}`}
                  value={`place-${place.name}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onSelect={() => {
                    onChange(place.citySlug);
                    onPlace?.(place.name, place.citySlug);
                    setOpen(false);
                  }}
                  className="flex cursor-pointer items-baseline justify-between gap-3 rounded-[10px] px-3 py-2.5 text-[15px] data-[selected=true]:bg-ink-50"
                >
                  <span className="font-semibold">{place.name}</span>
                  <span className="text-[12.5px] text-ink-500">
                    {placeCity.shortName}
                  </span>
                </Command.Item>
              );
            })}
            {remoteResults.map((r) => (
              <Command.Item
                key={`geo-${r.mapboxId || r.name}`}
                value={`geo-${r.mapboxId || r.name}`}
                onMouseDown={(e) => e.preventDefault()}
                onSelect={() => void pickRemote(r)}
                className="flex cursor-pointer items-baseline justify-between gap-3 rounded-[10px] px-3 py-2.5 text-[15px] data-[selected=true]:bg-ink-50"
              >
                <span className="min-w-0">
                  <span className="block truncate font-semibold">
                    {r.name}
                  </span>
                  <span className="block truncate text-[12.5px] text-ink-500">
                    {r.context}
                  </span>
                </span>
                <span className="shrink-0 text-[12.5px] font-semibold text-accent-ink">
                  {resolving === (r.mapboxId || r.name)
                    ? "…"
                    : r.city
                      ? `→ ${r.city.name.replace("Ciudad de ", "")}`
                      : "→ elegir"}
                </span>
              </Command.Item>
            ))}
          </Command.List>
        </Command>
      )}

      {notice && (
        <p role="alert" className="mt-1.5 px-1 text-[12.5px] font-medium text-danger">
          {notice}
        </p>
      )}
    </div>
  );
}
