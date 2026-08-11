"use client";

import { useEffect, useRef, useState } from "react";
import { Command } from "cmdk";
import { Icon } from "@/components/ui/Icon";
import { placesForCity, KIND_LABELS } from "@/lib/places";
import {
  geocodePlaces,
  suggestPlaces,
  MAPBOX_TOKEN,
  type GeocodedPlace,
} from "@/lib/mapbox";
import { ALL_CITIES } from "@/lib/corridors";

/**
 * SÉLECTEUR DE LIEU EXACT — « ¿dónde exactamente? »
 *
 * Trois sources, dans l'ordre où elles servent :
 *   1. le CATALOGUE local des lieux connus de la ville (malls, parques,
 *      Machetazo…) — instantané, hors ligne, à la première frappe ;
 *   2. le GÉOCODEUR Mapbox pour tout le reste (une adresse, un coin de
 *      rue), centré sur la ville, si le jeton est là ;
 *   3. la SAISIE LIBRE : ce que l'utilisateur a tapé reste toujours
 *      valable tel quel — un lieu qu'aucune base ne connaît (« frente a
 *      la casa amarilla ») est quand même un rendez-vous panaméen.
 *
 * La valeur est un LIBELLÉ, pas des coordonnées : le produit organise
 * des rencontres entre humains, et les humains se retrouvent sur un nom.
 */

export function PlacePicker({
  id,
  label,
  citySlug,
  value,
  onChange,
  placeholder = "Escribe el lugar…",
}: {
  id: string;
  label: string;
  citySlug: string;
  value: string;
  onChange: (place: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [remote, setRemote] = useState<GeocodedPlace[]>([]);
  const debounce = useRef<number>(0);

  const city = ALL_CITIES.find((c) => c.slug === citySlug);
  const local = placesForCity(citySlug).filter(
    (p) =>
      !query.trim() ||
      p.name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .includes(
          query
            .trim()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase(),
        ),
  );

  /* Géocodage débouncé : une requête au repos de la frappe, jamais une
     par touche. L'AbortController coupe la requête périmée. */
  useEffect(() => {
    /* Sous le seuil ou fermé : rien à chercher. L'affichage est DÉRIVÉ
       (remoteShown) — pas de setState de purge ici, React 19 le refuse
       à raison : un setState synchrone dans l'effet recasque un rendu. */
    if (!open || !MAPBOX_TOKEN || query.trim().length < 3) return;
    const controller = new AbortController();
    window.clearTimeout(debounce.current);
    debounce.current = window.setTimeout(() => {
      const near = city ? { lat: city.lat, lng: city.lng } : undefined;
      /* Search Box connaît les immeubles (les PH) et les commerces ;
         si elle ne répond rien, le géocodeur v5 reprend les rues. */
      suggestPlaces(query, near, controller.signal).then((found) =>
        found.length > 0
          ? setRemote(found)
          : geocodePlaces(query, near, controller.signal).then(setRemote),
      );
    }, 300);
    return () => {
      controller.abort();
      window.clearTimeout(debounce.current);
    };
  }, [query, open, city]);

  const remoteShown = query.trim().length >= 3 ? remote : [];

  const pick = (place: string) => {
    onChange(place);
    setOpen(false);
  };

  return (
    <div className="relative">
      <label
        htmlFor={id}
        className="mb-1.5 block text-[11.5px] font-bold tracking-[0.11em] text-ink-500 uppercase"
      >
        {label}
      </label>
      <div className="flex items-center gap-2.5 rounded-[12px] border-[1.5px] border-ink-200 bg-white px-3.5 py-2.5 transition-colors focus-within:border-accent">
        <Icon name="pin" className="size-4 shrink-0 text-ink-400" />
        <input
          id={id}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={`${id}-list`}
          aria-autocomplete="list"
          autoComplete="off"
          value={open ? query : value}
          placeholder={placeholder}
          onFocus={() => {
            setQuery(value);
            setOpen(true);
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            /* La frappe EST la valeur : pas besoin de choisir dans la
               liste pour que le texte compte. */
            onChange(e.target.value);
          }}
          onBlur={() => window.setTimeout(() => setOpen(false), 120)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
          }}
          className="w-full border-none bg-transparent text-[14.5px] font-semibold placeholder:font-normal placeholder:text-ink-400 focus:outline-none"
        />
      </div>

      {open && query.trim().length > 0 && (
        <Command
          id={`${id}-list`}
          shouldFilter={false}
          className="absolute inset-x-0 top-full z-30 mt-1 overflow-hidden rounded-[14px] border border-ink-200 bg-white shadow-lift"
        >
          <Command.List className="max-h-60 overflow-y-auto p-1.5">
            {local.map((p) => (
              <Command.Item
                key={`local-${p.name}`}
                value={`local-${p.name}`}
                onMouseDown={(e) => e.preventDefault()}
                onSelect={() => pick(p.name)}
                className="flex cursor-pointer items-baseline justify-between gap-3 rounded-[10px] px-3 py-2.5 text-[14.5px] data-[selected=true]:bg-ink-50"
              >
                <span className="font-semibold">{p.name}</span>
                <span className="shrink-0 text-[12px] text-ink-500">
                  {KIND_LABELS[p.kind]}
                </span>
              </Command.Item>
            ))}
            {remoteShown
              .filter((r) => !local.some((l) => l.name === r.name))
              .map((r) => (
                <Command.Item
                  key={`geo-${r.name}-${r.context}`}
                  value={`geo-${r.name}-${r.context}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onSelect={() => pick(r.name)}
                  className="flex cursor-pointer items-baseline justify-between gap-3 rounded-[10px] px-3 py-2.5 text-[14.5px] data-[selected=true]:bg-ink-50"
                >
                  <span className="font-semibold">{r.name}</span>
                  <span className="min-w-0 shrink truncate text-[12px] text-ink-500">
                    {r.context}
                  </span>
                </Command.Item>
              ))}
            {/* La saisie libre, en clair : un lieu qu'aucune base ne
                connaît reste un rendez-vous valable. */}
            <Command.Item
              key="libre"
              value="libre"
              onMouseDown={(e) => e.preventDefault()}
              onSelect={() => pick(query.trim())}
              className="flex cursor-pointer items-baseline justify-between gap-3 rounded-[10px] px-3 py-2.5 text-[14.5px] data-[selected=true]:bg-ink-50"
            >
              <span className="font-semibold">
                Usar «{query.trim()}» tal cual
              </span>
              <span className="shrink-0 text-[12px] text-ink-500">
                Punto libre
              </span>
            </Command.Item>
          </Command.List>
        </Command>
      )}
    </div>
  );
}
