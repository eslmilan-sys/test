"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Photo } from "@/components/ui/Photo";
import { PHOTOS } from "@/lib/photos";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";

/**
 * LA PORTE DE L'APP — le premier écran, avant tout le reste.
 *
 * SA FORME VIENT D'UNE DEMANDE PRÉCISE du propriétaire, exemple à
 * l'appui : une photo qui occupe le haut de l'écran, une croix en haut à
 * GAUCHE pour la quitter, et en bas une feuille blanche avec le titre,
 * le bouton d'inscription puis le lien de connexion. C'est la grammaire
 * de tous les onboardings de voyage, et elle marche pour une raison :
 * l'image dit ce qu'on achète avant qu'un mot soit lu.
 *
 * LA CROIX N'EST PAS DÉCORATIVE. Elle mène au mode invité, où la
 * RECHERCHE reste entière — chercher un viaje et voir l'aporte ne
 * demandent pas de compte, et exiger l'inscription à l'entrée coûte plus
 * de visiteurs qu'elle n'en qualifie. Tout ce qui engage quelqu'un
 * (réserver, publier, écrire, son profil) ramène ici.
 *
 * TROIS PORTES, ET C'EST UNE LEÇON PAYÉE CHER. L'inscription est restée
 * cassée des heures pour trois raisons cumulées : un quota de deux
 * courriels par heure, un gabarit non modifiable, et un lien qui
 * renvoyait sur localhost. La règle qui en sort : ne jamais faire
 * dépendre l'entrée d'un seul canal. Google et LinkedIn ne sont pas du
 * confort, ce sont des chemins de secours quand le courriel tombe.
 *
 * Et quand un fournisseur n'est pas activé, on le DIT — avec sa vraie
 * cause. « Réessaie » sur un provider désactivé fait réessayer à l'infini
 * quelque chose qui ne marchera jamais.
 */

type Estado = { tipo: "error" | "espera"; texto: string } | null;

/** Les marques ont leur glyphe officiel : un logo approximatif se
 *  remarque, et un bouton social qu'on ne reconnaît pas ne se clique pas. */
function GoogleGlyph() {
  return (
    <svg viewBox="0 0 48 48" className="size-[19px]" aria-hidden>
      <path
        fill="#4285F4"
        d="M45.1 24.5c0-1.6-.1-2.7-.4-3.9H24v7.1h12.1c-.2 1.8-1.6 4.5-4.5 6.3l6.9 5.4c4.1-3.8 6.6-9.4 6.6-15z"
      />
      <path
        fill="#34A853"
        d="M24 46c5.9 0 10.9-2 14.5-5.3l-6.9-5.4c-1.9 1.3-4.4 2.2-7.6 2.2-5.8 0-10.7-3.8-12.5-9.1l-7.1 5.5C8.1 41.1 15.4 46 24 46z"
      />
      <path
        fill="#FBBC05"
        d="M11.5 28.4c-.5-1.4-.7-2.9-.7-4.4s.3-3 .7-4.4l-7.1-5.5C2.9 17 2 20.4 2 24s.9 7 2.4 9.9l7.1-5.5z"
      />
      <path
        fill="#EA4335"
        d="M24 10.5c4.1 0 6.9 1.8 8.5 3.3l6.1-6C34.9 4.4 29.9 2 24 2 15.4 2 8.1 6.9 4.4 14.1l7.1 5.5c1.8-5.3 6.7-9.1 12.5-9.1z"
      />
    </svg>
  );
}

function LinkedInGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="size-[19px]" aria-hidden>
      <path
        fill="#0A66C2"
        d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.55V9h3.57v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z"
      />
    </svg>
  );
}

/** TROIS pictogrammes, et trois seulement — demande du propriétaire.
 *  Quatre ronds alignés se lisent comme une barre d'outils ; trois se
 *  lisent comme trois idées. Ce sont les trois qui décident vraiment :
 *  la voiture (ce qu'on partage), le bouclier (avec qui), l'aporte (ce
 *  que ça coûte). Ils ne remplacent pas le titre — ils le préparent. */
const CAPACIDADES = [
  { icon: "car", label: "Comparte el carro" },
  { icon: "shield", label: "Con gente verificada" },
  { icon: "cash", label: "Solo el aporte" },
] as const;

export function Entrar({
  onRegistro,
  onAcceder,
  onCerrar,
  /** Le titre change selon la porte par laquelle on arrive : entrer dans
   *  l'app n'est pas la même demande que « je viens de toucher Perfil ».
   *  Un écran de connexion qui ne dit pas POURQUOI il s'affiche se lit
   *  comme un mur. */
  motivo,
}: {
  onRegistro: () => void;
  onAcceder: () => void;
  /** Absent = pas de sortie (première ouverture d'une session). */
  onCerrar?: () => void;
  motivo?: string;
}) {
  const [estado, setEstado] = useState<Estado>(null);
  const [cargando, setCargando] = useState<string | null>(null);

  async function social(provider: "google" | "linkedin_oidc") {
    const nombre = provider === "google" ? "Google" : "LinkedIn";
    const supabase = getSupabase();
    if (!supabase || !isSupabaseConfigured) {
      setEstado({
        tipo: "error",
        texto: `${nombre} necesita la base conectada. Mientras tanto, entra con tu correo.`,
      });
      return;
    }
    setCargando(provider);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin + window.location.pathname },
    });
    if (error) {
      setCargando(null);
      /* La cause EXACTE, pas « inténtalo de nuevo ». Un provider
         désactivé dans Supabase renvoie « provider is not enabled » : le
         dire évite de réessayer cent fois quelque chose d'impossible. */
      setEstado({
        tipo: "error",
        texto: /not enabled|disabled/i.test(error.message)
          ? `${nombre} todavía no está activado. Entra con tu correo — funciona ahora mismo.`
          : `${nombre} no respondió: ${error.message}`,
      });
    }
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-white">
      {/* LA PHOTO — elle occupe le haut, elle est coupée par la feuille. */}
      <div className="relative min-h-0 flex-1">
        <Photo
          photo={PHOTOS.carroLleno}
          sizes="100vw"
          priority
          fill
          imgClassName="object-cover object-[50%_38%]"
        />
        {/* Un dégradé bas : sans lui, les pictogrammes blancs tombent
            parfois sur une zone claire de la photo et disparaissent. */}
        <span
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(to_top,rgba(20,16,12,0.55),transparent)]"
        />

        {onCerrar && (
          /* LA CROIX, EN HAUT À GAUCHE — demande explicite du
             propriétaire, et c'est aussi la convention : à gauche on
             quitte, à droite on agit. En verre, pour rester lisible quelle
             que soit la photo derrière. */
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Seguir sin cuenta"
            /* 48 px et non 44 : le propriétaire l'a vue rater. Sur une
               photo, sans bord net, on vise moins bien qu'on croit — et
               une croix qu'on rate deux fois passe pour cassée. */
            className="glass absolute top-[calc(14px+env(safe-area-inset-top))] left-4 z-20 flex size-12 items-center justify-center rounded-full"
          >
            <Icon name="cross" className="size-5" />
          </button>
        )}

      </div>

      {/* LA FEUILLE — elle monte par-dessus la photo, coins arrondis.
          Elle est EN VERRE : la photo se devine derrière son bord, ce qui
          la pose sur l'image au lieu de la couper en deux. */}
      <div className="glass relative z-20 -mt-8 rounded-t-[28px] px-6 pt-6 pb-[calc(22px+env(safe-area-inset-bottom))]">
        {/* LES TROIS IDÉES, DANS la feuille et non à cheval sur le bord.
            Collées au bas de la photo, elles tombaient dans la couture
            entre l'image et le texte — l'endroit exact où l'œil ne
            s'arrête pas. Ici elles ouvrent la feuille, avec leur mot :
            un rond sans légende est une devinette. */}
        <ul className="mb-5 flex items-start justify-between gap-2">
          {CAPACIDADES.map((c) => (
            <li key={c.label} className="flex w-full flex-col items-center gap-1.5">
              <span className="flex size-11 items-center justify-center rounded-full bg-naranja-suave text-naranja">
                <Icon name={c.icon} className="size-[19px]" />
              </span>
              <span className="text-center text-[11.5px] leading-tight font-semibold text-ink-600">
                {c.label}
              </span>
            </li>
          ))}
        </ul>
        <h1 className="font-display text-[27px] leading-[1.12] font-extrabold tracking-[-0.035em]">
          {motivo ?? (
            <>
              Alguien ya va <span className="text-naranja">para allá</span>
            </>
          )}
        </h1>
        <p className="mt-2 text-[14.5px] leading-snug text-ink-500">
          Comparte el carro y los gastos entre Ciudad de Panamá y el interior.
        </p>

        <div className="mt-5 grid gap-2.5">
          <button
            type="button"
            onClick={onRegistro}
            className="flex h-[54px] items-center justify-center rounded-full bg-naranja px-6 font-display text-[16.5px] font-bold text-white transition-colors hover:bg-naranja-hondo"
          >
            Crear cuenta
          </button>

          {/* CONNEXION EN SECOND, et en lien : celui qui a déjà un compte
              sait le trouver ; celui qui n'en a pas doit voir d'abord la
              porte qui le concerne. */}
          <button
            type="button"
            onClick={onAcceder}
            className="flex h-[46px] items-center justify-center rounded-full font-display text-[15.5px] font-bold text-naranja transition-colors hover:bg-naranja-suave"
          >
            Iniciar sesión
          </button>

          <div className="my-0.5 flex items-center gap-3 text-[12.5px] text-ink-400">
            <span className="h-px flex-1 bg-ink-200" />o
            <span className="h-px flex-1 bg-ink-200" />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => void social("google")}
              disabled={cargando !== null}
              className="flex h-[50px] items-center justify-center gap-2.5 rounded-full border-[1.5px] border-ink-200 bg-white text-[14.5px] font-semibold transition-colors hover:border-ink-300 disabled:opacity-60"
            >
              <GoogleGlyph />
              {cargando === "google" ? "Abriendo…" : "Google"}
            </button>
            <button
              type="button"
              onClick={() => void social("linkedin_oidc")}
              disabled={cargando !== null}
              className="flex h-[50px] items-center justify-center gap-2.5 rounded-full border-[1.5px] border-ink-200 bg-white text-[14.5px] font-semibold transition-colors hover:border-ink-300 disabled:opacity-60"
            >
              <LinkedInGlyph />
              {cargando === "linkedin_oidc" ? "Abriendo…" : "LinkedIn"}
            </button>
          </div>

          {estado && (
            <p
              role="alert"
              className="mt-1 flex items-start gap-2 rounded-[12px] bg-danger-soft px-3.5 py-2.5 text-[13.5px] leading-snug text-danger"
            >
              <Icon name="shield" className="mt-0.5 size-4 shrink-0" />
              {estado.texto}
            </p>
          )}

          {onCerrar && (
            <button
              type="button"
              onClick={onCerrar}
              className="mt-1 text-center text-[13.5px] font-semibold text-ink-500 underline-offset-2 hover:underline"
            >
              Solo quiero buscar viajes
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
