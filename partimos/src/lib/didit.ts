/**
 * Vérification d'identité — le pont client vers Didit, via Supabase.
 *
 * Le navigateur ne parle JAMAIS à Didit directement : il demande à la
 * fonction Edge `didit-start` (qui détient la clé API) d'ouvrir une session,
 * et reçoit en retour l'URL du parcours hébergé par Didit. La cédula est
 * photographiée chez Didit, jugée chez Didit ; le verdict revient par le
 * webhook `didit-webhook`. Ici, on ne voit que des statuts.
 *
 * Sans Supabase configuré (l'export statique de démonstration), tout ceci
 * répond « non disponible » sans jeter : l'onglet Verificación explique la
 * situation au lieu de casser.
 */

import { getSupabase, isSupabaseConfigured } from "./supabase";

export type VerificationState = {
  status: "none" | "pending" | "verified" | "rejected" | "expired";
  updatedAt: string | null;
};

/**
 * DEUX DOCUMENTS, DEUX DOSSIERS.
 *
 * La cédula dit QUI conduit. La licencia dit qu'il a le droit de
 * conduire. Ce sont deux questions, et pour publier un viaje il faut
 * répondre aux deux — décision du propriétaire.
 *
 * Dans les deux cas Didit lit le document et compare le visage ; nous ne
 * gardons que le verdict et le TYPE de document (`ID` ou `DL`). Le
 * numéro de licence panaméen EST le numéro de cédula : le stocker
 * violerait la règle R6, donc il ne nous parvient jamais.
 */
export type DocKind = "cedula" | "licencia";

/** Le type stocké dans `identity_verifications.document_type`. */
export const DOC_TYPE: Record<DocKind, string> = {
  cedula: "ID",
  licencia: "DL",
};

/**
 * Ouvre une session de vérification et renvoie l'URL du parcours Didit.
 * L'appelant redirige vers cette URL ; Didit ramène ensuite l'utilisateur
 * sur /cuenta/ (le `callback` configuré côté fonction).
 */
export async function startIdVerification(
  kind: DocKind = "cedula",
): Promise<{ url: string } | { error: string }> {
  const supabase = getSupabase();
  if (!supabase) return { error: "not_configured" };

  const { data, error } = await supabase.functions.invoke<{ url: string }>(
    "didit-start",
    { body: { kind } },
  );
  if (error || !data?.url) {
    /* LIRE LA VRAIE RAISON. `invoke` ne rend qu'un « Edge Function
       returned a non-2xx status code » : la cause exacte est dans le
       CORPS de la réponse, et sans elle l'écran ne peut afficher qu'un
       « intenta de nuevo » qui n'aide personne — ni la personne, ni
       nous. On va donc la chercher. */
    const contexto = (error as { context?: Response } | null)?.context;
    if (contexto && typeof contexto.json === "function") {
      try {
        const cuerpo = (await contexto.clone().json()) as {
          error?: string;
          message?: string;
        };
        const detalle = cuerpo.error ?? cuerpo.message;
        if (detalle) return { error: detalle };
      } catch {
        /* Corps illisible : on retombe sur le message générique. */
      }
      return { error: `http_${contexto.status}` };
    }
    return { error: error?.message ?? "no_url" };
  }
  return { url: data.url };
}

/**
 * L'état du dossier le plus récent de l'utilisateur connecté. La RLS
 * (`kyc_own_only`) garantit qu'on ne peut lire que le sien.
 */
export async function getVerificationState(
  kind: DocKind = "cedula",
): Promise<VerificationState> {
  const none: VerificationState = { status: "none", updatedAt: null };
  const supabase = getSupabase();
  if (!supabase) return none;

  const { data, error } = await supabase
    .from("identity_verifications")
    .select("status, updated_at")
    .eq("document_type", DOC_TYPE[kind])
    .order("created_at", { ascending: false })
    .limit(1);
  if (error || !data || data.length === 0) return none;
  return {
    status: data[0].status as VerificationState["status"],
    updatedAt: data[0].updated_at ?? null,
  };
}

export { isSupabaseConfigured };
