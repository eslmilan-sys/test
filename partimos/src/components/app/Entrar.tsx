"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Logo } from "@/components/site/Logo";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";

/**
 * LA PORTE DE L'APP — le premier écran, avant tout le reste.
 *
 * Décision du propriétaire : installée, l'app s'ouvre sur « entrer ou
 * s'inscrire », pas sur la recherche. C'est cohérent avec ce que l'app
 * EST — un outil pour quelqu'un qui a un compte — alors que le site
 * reste ouvert à tous et n'exige jamais de se connecter pour chercher.
 *
 * TROIS PORTES, ET C'EST UNE LEÇON PAYÉE CHER. L'inscription est restée
 * cassée des heures pour trois raisons cumulées : un quota de deux
 * courriels par heure, un gabarit non modifiable, et un lien qui
 * renvoyait sur localhost. La règle qui en sort : ne jamais faire
 * dépendre l'entrée d'un seul canal. Google et LinkedIn ne sont donc pas
 * du confort, ce sont des chemins de secours quand le courriel tombe.
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

export function Entrar({ onCorreo }: { onCorreo: () => void }) {
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
    <div className="flex min-h-[100dvh] flex-col bg-ink-50 px-6 pt-[calc(28px+env(safe-area-inset-top))] pb-[calc(24px+env(safe-area-inset-bottom))]">
      <div className="entra-app flex flex-1 flex-col justify-center">
        <Logo gradientId="brand-entrar" />

        <h1 className="mt-8 font-display text-[34px] leading-[1.05] font-extrabold tracking-[-0.035em]">
          Alguien ya va
          <br />
          <span className="text-naranja">para allá.</span>
        </h1>
        <p className="mt-3 max-w-[30ch] text-[15.5px] leading-relaxed text-ink-500">
          Comparte el carro y los gastos entre Ciudad de Panamá y el interior.
          Entra para reservar tu puesto o publicar tu viaje.
        </p>
      </div>

      <div className="entra-app grid gap-2.5" style={{ ["--paso" as string]: 1 }}>
        <button
          type="button"
          onClick={onCorreo}
          className="flex h-[54px] items-center justify-center rounded-[16px] bg-naranja px-6 font-display text-[16.5px] font-bold text-white transition-colors hover:bg-naranja-hondo"
        >
          Continuar con correo
        </button>

        <div className="my-1 flex items-center gap-3 text-[12.5px] text-ink-400">
          <span className="h-px flex-1 bg-ink-200" />o
          <span className="h-px flex-1 bg-ink-200" />
        </div>

        <button
          type="button"
          onClick={() => void social("google")}
          disabled={cargando !== null}
          className="flex h-[54px] items-center justify-center gap-3 rounded-[16px] border-[1.5px] border-ink-200 bg-white px-6 text-[15.5px] font-semibold transition-colors hover:border-ink-300 disabled:opacity-60"
        >
          <GoogleGlyph />
          {cargando === "google" ? "Abriendo Google…" : "Continuar con Google"}
        </button>

        <button
          type="button"
          onClick={() => void social("linkedin_oidc")}
          disabled={cargando !== null}
          className="flex h-[54px] items-center justify-center gap-3 rounded-[16px] border-[1.5px] border-ink-200 bg-white px-6 text-[15.5px] font-semibold transition-colors hover:border-ink-300 disabled:opacity-60"
        >
          <LinkedInGlyph />
          {cargando === "linkedin_oidc"
            ? "Abriendo LinkedIn…"
            : "Continuar con LinkedIn"}
        </button>

        {estado && (
          <p
            role="alert"
            className="mt-1 flex items-start gap-2 rounded-[12px] bg-danger-soft px-3.5 py-2.5 text-[13.5px] leading-snug text-danger"
          >
            <Icon name="shield" className="mt-0.5 size-4 shrink-0" />
            {estado.texto}
          </p>
        )}

        <p className="mt-2 text-center text-[12.5px] leading-snug text-ink-400">
          Buscar viajes y calcular el aporte no necesita cuenta.
        </p>
      </div>
    </div>
  );
}
