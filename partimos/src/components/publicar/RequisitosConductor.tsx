"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { startIdVerification, type DocKind } from "@/lib/didit";

/**
 * CE QU'IL FAUT POUR PUBLIER — annoncé AU DÉBUT, pas à la fin.
 *
 * Le verrou existait déjà, mais il n'apparaissait qu'à la dernière étape :
 * on choisissait sa route, ses paradas, son heure, ses puestos, son
 * aporte… et là seulement on apprenait qu'il fallait vérifier sa cédula.
 * Vingt champs remplis pour rien. Personne ne revient après ça.
 *
 * Donc : la liste s'affiche dès le premier écran, et chaque ligne PORTE
 * SON GESTE. Vérifier la cédula se fait ici même, sans quitter le
 * formulaire — parce qu'un lien vers une autre page, à ce moment-là,
 * c'est un abandon de plus.
 *
 * Deux tons pour le même contenu : « aviso » au début (on prévient, on
 * ne bloque pas — le conducteur peut préparer son viaje pendant que la
 * vérification tourne), « bloqueo » à la fin (là, c'est la règle).
 */

export type Requisito = {
  que: string;
  porQue: string;
  /** Le document à vérifier chez Didit, ou une page où finir le geste. */
  doc?: DocKind;
  donde?: string;
};

export function RequisitosConductor({
  faltantes,
  tono,
}: {
  faltantes: Requisito[];
  tono: "aviso" | "bloqueo";
}) {
  const [abriendo, setAbriendo] = useState<DocKind | null>(null);
  const [error, setError] = useState("");

  if (faltantes.length === 0) return null;

  const verificar = async (doc: DocKind) => {
    setError("");
    setAbriendo(doc);
    const r = await startIdVerification(doc);
    if ("url" in r) {
      window.location.assign(r.url);
      return;
    }
    setAbriendo(null);
    setError(
      r.error === "already_verified"
        ? "Ese documento ya está verificado."
        : `No se pudo abrir la verificación (${r.error}).`,
    );
  };

  return (
    <div
      className={`rounded-[20px] px-4 py-4 sm:px-5 ${
        tono === "bloqueo"
          ? "border-[1.5px] border-action bg-action-soft"
          : "border border-ink-200 bg-ink-50/70"
      }`}
    >
      <h2 className="mb-1 font-display text-[16.5px] font-bold text-action-ink">
        {tono === "bloqueo"
          ? "Antes de publicar, falta poco"
          : "Para publicar vas a necesitar esto"}
      </h2>
      <p
        className={`mb-3 text-[13.5px] leading-relaxed ${
          tono === "bloqueo" ? "text-action-ink/85" : "text-ink-500"
        }`}
      >
        {tono === "bloqueo"
          ? "Alguien va a subirse a tu carro. Esto es lo que lo hace posible — se pide una sola vez."
          : "Te lo decimos ahora para que no llenes todo el viaje y te frenes al final. Puedes empezarlo aquí mismo y seguir armando tu viaje mientras tanto."}
      </p>

      <ul className="grid gap-2">
        {faltantes.map((f) => (
          <li
            key={f.que}
            className="flex items-start gap-3 rounded-[14px] bg-white px-4 py-3"
          >
            <span
              aria-hidden
              className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2 border-ink-200"
            />
            <span className="min-w-0 flex-1">
              <span className="block text-[14.5px] font-semibold">{f.que}</span>
              <span className="block text-[12.5px] leading-snug text-ink-500">
                {f.porQue}
              </span>
            </span>
            {/* Le geste EST sur la ligne. Un document se vérifie d'ici ;
                le carro a besoin de son écran, alors on y mène. */}
            {f.doc ? (
              <button
                type="button"
                onClick={() => void verificar(f.doc!)}
                disabled={abriendo !== null}
                className="shrink-0 self-center rounded-full bg-ink-900 px-4 py-2 text-[13.5px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {abriendo === f.doc ? "Abriendo…" : "Verificar"}
              </button>
            ) : (
              <Link
                href={f.donde ?? "/cuenta"}
                className="flex shrink-0 self-center items-center gap-1 rounded-full border-[1.5px] border-ink-200 px-4 py-2 text-[13.5px] font-bold transition-colors hover:border-accent"
              >
                Agregar
                <Icon name="arrowRight" className="size-3.5" />
              </Link>
            )}
          </li>
        ))}
      </ul>

      {error && (
        <p role="alert" className="mt-2.5 text-[13px] text-danger">
          {error}
        </p>
      )}

      <p
        className={`mt-3 text-[12.5px] leading-snug ${
          tono === "bloqueo" ? "text-action-ink/85" : "text-ink-500"
        }`}
      >
        Los documentos los revisa Didit y nunca los guardamos: solo nos llega
        «verificado». Buscar y reservar como pasajero no necesita nada de esto.
      </p>
    </div>
  );
}
