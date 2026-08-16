"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { useSession } from "@/lib/session";
import { isSupabaseConfigured } from "@/lib/supabase";
import { huella } from "@/lib/clave";

/**
 * SE CONNECTER — une seule question, parce qu'il n'y en a qu'une.
 *
 * Elle a la même forme que l'inscription (retour en haut à gauche, une
 * question en grand, un bouton rond en bas à droite) et c'est voulu :
 * deux portes qui se ressemblent se lisent comme deux portes de la même
 * maison. Un formulaire de connexion dessiné autrement donne la
 * désagréable impression d'avoir changé de site.
 *
 * CE QU'ELLE FAIT VRAIMENT DÉPEND DE LA BASE. Branchée, c'est le lien
 * reçu par courriel qui ouvre la session — on ne l'ouvre jamais nous-
 * mêmes, sinon on ferait croire à une connexion qui n'existe pas côté
 * serveur. Débranchée (la démonstration publiée), le compte vit dans ce
 * téléphone, et l'écran le dit au lieu de le laisser deviner.
 */

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Un prénom présentable tiré du courriel, faute de mieux : « milan.r »
 *  devient « Milan ». Il sera remplacé dès que la personne le corrige
 *  dans son profil — mais un « Tú » générique en tête d'app est pire. */
function nombreDesde(correo: string): string {
  const bruto = correo.split("@")[0].split(/[._-]/)[0] ?? "";
  if (!bruto) return "Tú";
  return bruto.charAt(0).toUpperCase() + bruto.slice(1).toLowerCase();
}

export function Acceder({
  onCerrar,
  onRegistro,
}: {
  onCerrar: () => void;
  onRegistro: () => void;
}) {
  const { session, signIn } = useSession();
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [tocado, setTocado] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [fallo, setFallo] = useState<string | null>(null);

  const valido = CORREO.test(correo.trim()) && clave.length > 0;

  async function continuar() {
    if (!valido) {
      setTocado(true);
      return;
    }
    setFallo(null);
    if (isSupabaseConfigured) {
      /* Avec la base, c'est le serveur qui vérifie. On envoie le lien et
         on s'arrête là — ouvrir la session ici ferait croire à une
         connexion qui n'existe pas côté serveur. */
      setEnviado(true);
      return;
    }
    /* SANS BASE : on recompare l'empreinte gardée sur ce téléphone. Ce
       n'est pas de la sécurité (voir lib/clave.ts) — c'est le parcours
       rendu fidèlement, avec un vrai refus quand le mot de passe ne
       correspond pas. */
    const marca = await huella(clave);
    if (session?.claveHuella && session.contact === correo.trim()) {
      if (session.claveHuella !== marca) {
        setFallo("Esa contraseña no corresponde. Vuelve a intentar.");
        return;
      }
      onCerrar();
      return;
    }
    if (session?.claveHuella) {
      setFallo(
        "En este teléfono no hay ninguna cuenta con ese correo. Crea una, o entra con el correo que usaste aquí.",
      );
      return;
    }
    signIn(correo.trim(), nombreDesde(correo.trim()), "");
    onCerrar();
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-white px-6 pt-[calc(14px+env(safe-area-inset-top))] pb-[calc(20px+env(safe-area-inset-bottom))]">
      <button
        type="button"
        onClick={onCerrar}
        aria-label="Cerrar"
        className="glass -ml-1 flex size-11 shrink-0 items-center justify-center rounded-full"
      >
        <Icon name="cross" className="size-5" />
      </button>

      <div className="flex-1 pt-8">
        <h1 className="font-display text-[28px] leading-[1.12] font-extrabold tracking-[-0.035em]">
          ¿Cuál es tu correo?
        </h1>
        <p className="mt-2 max-w-[34ch] text-[13.5px] leading-relaxed text-ink-500">
          El mismo con el que creaste tu cuenta.
        </p>

        <label htmlFor="acc-correo" className="mt-6 block">
          <span className="mb-1.5 block text-[11.5px] font-bold tracking-[0.09em] text-ink-500 uppercase">
            Correo
          </span>
          <input
            id="acc-correo"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoFocus
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            className="w-full rounded-[16px] border-[1.5px] border-ink-200 bg-ink-50 px-4 py-3.5 text-[16px] outline-none focus:border-naranja focus:bg-white"
          />
        </label>

        <label htmlFor="acc-clave" className="mt-4 block">
          <span className="mb-1.5 block text-[11.5px] font-bold tracking-[0.09em] text-ink-500 uppercase">
            Contraseña
          </span>
          <input
            id="acc-clave"
            type="password"
            autoComplete="current-password"
            value={clave}
            onChange={(e) => setClave(e.target.value)}
            className="w-full rounded-[16px] border-[1.5px] border-ink-200 bg-ink-50 px-4 py-3.5 text-[16px] outline-none focus:border-naranja focus:bg-white"
          />
        </label>

        {((tocado && !valido) || fallo) && (
          <p
            role="alert"
            className="mt-3 flex items-start gap-2 rounded-[12px] bg-danger-soft px-3.5 py-2.5 text-[13.5px] leading-snug text-danger"
          >
            <Icon name="shield" className="mt-0.5 size-4 shrink-0" />
            {fallo ??
              (CORREO.test(correo.trim())
                ? "Escribe tu contraseña."
                : "Revisa el correo — falta la arroba o el punto.")}
          </p>
        )}

        {enviado && (
          <p className="mt-3 rounded-[14px] bg-verde-suave px-4 py-3 text-[13.5px] leading-snug text-ink-600">
            Te mandamos un enlace a{" "}
            <b className="font-semibold text-ink-900">{correo.trim()}</b>. Ábrelo
            en este teléfono y la sesión se abre sola.
          </p>
        )}

        {!isSupabaseConfigured && (
          <p className="mt-4 rounded-[14px] bg-ink-50 px-4 py-3 text-[12.5px] leading-snug text-ink-500">
            En esta demostración la cuenta vive en este teléfono: comparamos una
            huella de tu contraseña guardada aquí. Todavía no mandamos correos.
          </p>
        )}

        <button
          type="button"
          onClick={onRegistro}
          className="mt-5 text-[14px] font-semibold text-naranja underline-offset-2 hover:underline"
        >
          Todavía no tengo cuenta
        </button>
      </div>

      <div className="flex items-center justify-end pt-4">
        <button
          type="button"
          onClick={() => void continuar()}
          disabled={!valido}
          aria-label="Continuar"
          className="flex size-[58px] items-center justify-center rounded-full bg-naranja text-white transition-colors hover:bg-naranja-hondo disabled:cursor-not-allowed disabled:opacity-35"
        >
          <Icon name="arrowRight" className="size-6" />
        </button>
      </div>
    </div>
  );
}
