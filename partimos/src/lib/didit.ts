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
 * Ouvre une session de vérification et renvoie l'URL du parcours Didit.
 * L'appelant redirige vers cette URL ; Didit ramène ensuite l'utilisateur
 * sur /cuenta/ (le `callback` configuré côté fonction).
 */
export async function startIdVerification(): Promise<
  { url: string } | { error: string }
> {
  const supabase = getSupabase();
  if (!supabase) return { error: "not_configured" };

  const { data, error } = await supabase.functions.invoke<{ url: string }>(
    "didit-start",
    { body: {} },
  );
  if (error || !data?.url) {
    return { error: error?.message ?? "no_url" };
  }
  return { url: data.url };
}

/**
 * L'état du dossier le plus récent de l'utilisateur connecté. La RLS
 * (`kyc_own_only`) garantit qu'on ne peut lire que le sien.
 */
export async function getVerificationState(): Promise<VerificationState> {
  const none: VerificationState = { status: "none", updatedAt: null };
  const supabase = getSupabase();
  if (!supabase) return none;

  const { data, error } = await supabase
    .from("identity_verifications")
    .select("status, updated_at")
    .order("created_at", { ascending: false })
    .limit(1);
  if (error || !data || data.length === 0) return none;
  return {
    status: data[0].status as VerificationState["status"],
    updatedAt: data[0].updated_at ?? null,
  };
}

export { isSupabaseConfigured };
