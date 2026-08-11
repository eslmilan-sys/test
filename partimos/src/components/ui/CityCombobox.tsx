"use client";

import { useMemo, useState } from "react";
import { Command } from "cmdk";
import { ALL_CITIES } from "@/lib/corridors";
import { searchPlaces } from "@/lib/places";
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
};

export function CityCombobox({
  id,
  label,
  value,
  onChange,
  exclude,
  tone = "origin",
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

  return (
    <div className="relative">
      <div className="flex items-center gap-3 rounded-[14px] px-3.5 py-3 transition-colors hover:bg-ink-50">
        <span
          aria-hidden
          className={`size-[19px] shrink-0 border-[3px] ${
            tone === "origin"
              ? "rounded-full border-accent"
              : "rounded-[5px] border-brand-green-deep"
          }`}
        />
        <div className="min-w-0 flex-1">
          <label
            htmlFor={id}
            className="block text-[10.5px] font-bold tracking-[0.11em] text-ink-500 uppercase"
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
            onChange={(e) => setQuery(e.target.value)}
            onBlur={() => window.setTimeout(() => setOpen(false), 120)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setOpen(false);
            }}
            className="w-full border-none bg-transparent py-px text-[16px] font-semibold text-ink-900 placeholder:font-medium placeholder:text-ink-500 focus:outline-none"
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
            {results.length === 0 && placeResults.length === 0 && (
              <Command.Empty className="px-3 py-3 text-[14px] text-ink-500">
                Todavía no llegamos a esa ciudad. Escríbela igual y te avisamos
                cuando abramos la ruta.
              </Command.Empty>
            )}
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
            {results.map((city) => (
              <Command.Item
                key={city.slug}
                value={city.slug}
                onMouseDown={(e) => e.preventDefault()}
                onSelect={() => {
                  onChange(city.slug);
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
          </Command.List>
        </Command>
      )}
    </div>
  );
}
