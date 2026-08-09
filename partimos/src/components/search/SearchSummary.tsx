"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ALL_CITIES } from "@/lib/corridors";
import { CityCombobox } from "@/components/ui/CityCombobox";
import { RouteMap } from "@/components/map/RouteMap";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { formatDayLabel, SEARCH_HORIZON_DAYS } from "@/lib/trips";

/**
 * Résumé de recherche collant, ouvrant une feuille d'édition.
 *
 * C'est le motif des applications de voyage, et il tient à une raison :
 * sur une page de résultats, la recherche doit rester LISIBLE en permanence
 * (« qu'est-ce que je regarde ? ») mais ne pas occuper l'écran. Un formulaire
 * complet en haut de liste mange la moitié d'un téléphone.
 */

type Criteria = { from: string; to: string; date: string; seats: number };

function nextDays(count = SEARCH_HORIZON_DAYS) {
  const out: { value: string; label: string }[] = [];
  const today = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const value = d.toISOString().slice(0, 10);
    out.push({ value, label: formatDayLabel(value) });
  }
  return out;
}

export function SearchSummary({
  criteria,
  onApply,
}: {
  criteria: Criteria;
  onApply: (next: Criteria) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(criteria);
  const [picking, setPicking] = useState<"origin" | "destination">("origin");
  const days = nextDays();

  const from = ALL_CITIES.find((c) => c.slug === criteria.from);
  const to = ALL_CITIES.find((c) => c.slug === criteria.to);
  const sameCity = draft.from === draft.to;

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (next) setDraft(criteria);
        setOpen(next);
      }}
    >
      <Dialog.Trigger className="flex w-full items-center gap-3 border-[1.5px] border-ochre-500 bg-white px-4 py-3 text-left transition-colors hover:bg-plate-50">
        <Icon name="search" className="size-5 shrink-0 text-plate-600" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[16px] font-bold tracking-[-0.02em]">
            {from?.shortName} → {to?.shortName}
          </span>
          <span className="block truncate text-[13px] text-plate-600">
            {formatDayLabel(criteria.date)} ·{" "}
            {criteria.seats === 1
              ? "1 pasajero"
              : `${criteria.seats} pasajeros`}
          </span>
        </span>
        <span className="shrink-0 text-[13px] font-semibold text-ochre-600">
          Cambiar
        </span>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[110] bg-plate-950/55 motion-safe:animate-[fade-in_0.18s_ease-out]" />
        <Dialog.Content className="fixed inset-x-0 bottom-0 z-[120] max-h-[92vh] overflow-y-auto rounded-t-[26px] bg-white p-5 shadow-float motion-safe:animate-[sheet-in_0.24s_cubic-bezier(0.2,0.9,0.3,1)] sm:inset-x-auto sm:top-1/2 sm:left-1/2 sm:bottom-auto sm:w-[min(480px,92vw)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:">
          <div className="mb-4 flex items-start justify-between gap-4">
            <Dialog.Title className="text-[24px] font-extrabold tracking-[-0.035em]">
              ¿A dónde vas?
            </Dialog.Title>
            <Dialog.Close
              aria-label="Cerrar"
              className="-mt-1 -mr-1 flex size-9 shrink-0 items-center justify-center rounded-full text-plate-600 transition-colors hover:bg-plate-50 hover:text-plate-900"
            >
              <Icon name="cross" className="size-4.5" />
            </Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">
            Cambia el origen, el destino, la fecha o el número de pasajeros.
          </Dialog.Description>

          <div className="border border-plate-200">
            <CityCombobox
              id="sheet-desde"
              label="Desde"
              value={draft.from}
              exclude={draft.to}
              tone="origin"
              onChange={(slug) => setDraft((d) => ({ ...d, from: slug }))}
            />
            <div className="border-t border-plate-200">
              <CityCombobox
                id="sheet-hacia"
                label="Hacia"
                value={draft.to}
                exclude={draft.from}
                tone="destination"
                onChange={(slug) => setDraft((d) => ({ ...d, to: slug }))}
              />
            </div>
            <div className="flex border-t border-plate-200">
              <label className="flex flex-1 items-center gap-3 px-3.5 py-3">
                <Icon
                  name="calendar"
                  className="size-[19px] shrink-0 text-plate-600"
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-[10.5px] font-bold tracking-[0.11em] text-plate-600 uppercase">
                    Fecha
                  </span>
                  <select
                    value={draft.date}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, date: e.target.value }))
                    }
                    className="w-full cursor-pointer appearance-none border-none bg-transparent text-[16px] font-semibold focus:outline-none"
                  >
                    {days.map((day) => (
                      <option key={day.value} value={day.value}>
                        {day.label}
                      </option>
                    ))}
                  </select>
                </span>
              </label>
              <label className="flex max-w-[140px] items-center gap-3 border-l border-plate-200 px-3.5 py-3">
                <span className="min-w-0 flex-1">
                  <span className="block text-[10.5px] font-bold tracking-[0.11em] text-plate-600 uppercase">
                    Pasajeros
                  </span>
                  <select
                    value={draft.seats}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, seats: Number(e.target.value) }))
                    }
                    className="w-full cursor-pointer appearance-none border-none bg-transparent text-[16px] font-semibold focus:outline-none"
                  >
                    {[1, 2, 3, 4].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </span>
              </label>
            </div>
          </div>

          <div className="mt-3 border border-plate-200 bg-plate-50/60 p-3">
            <RouteMap
              originSlug={draft.from}
              destinationSlug={draft.to}
              picking={picking}
              onPick={(slug) => {
                if (picking === "origin") {
                  setDraft((d) => ({
                    ...d,
                    from: slug,
                    to: d.to === slug ? "" : d.to,
                  }));
                  setPicking("destination");
                } else {
                  setDraft((d) => ({ ...d, to: slug }));
                  setPicking("origin");
                }
              }}
            />
          </div>

          {sameCity && (
            <p
              role="alert"
              className="mt-3 text-[13.5px] font-medium text-danger"
            >
              El origen y el destino no pueden ser el mismo.
            </p>
          )}

          <Button
            size="lg"
            full
            className="mt-4"
            disabled={sameCity || !draft.from || !draft.to}
            onClick={() => {
              onApply(draft);
              setOpen(false);
            }}
          >
            Buscar
          </Button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
