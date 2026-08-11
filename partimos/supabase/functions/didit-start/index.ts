/**
 * DIDIT-START — ouvre une session de vérification d'identité.
 *
 * Le site est un export statique : il ne peut détenir aucun secret. La clé
 * API Didit vit donc ICI, dans les secrets du projet Supabase, et le
 * navigateur ne voit passer que l'URL du parcours hébergé par Didit.
 *
 *   navigateur ──(JWT Supabase)──▶ didit-start ──(x-api-key)──▶ Didit
 *             ◀────────── { url } ◀──────────────── { session_id, url }
 *
 * Règle R6 : on n'envoie à Didit que l'identifiant du compte (vendor_data)
 * et on n'enregistre chez nous que la référence du dossier. La cédula, ses
 * images et son numéro ne transitent jamais par la plateforme.
 *
 * Déploiement : `supabase functions deploy didit-start` (JWT vérifié par
 * défaut — c'est voulu : seul un utilisateur connecté démarre un dossier).
 * Secrets attendus : DIDIT_API_KEY, DIDIT_WORKFLOW_ID, SITE_URL.
 * Voir supabase/DIDIT.md pour le pas-à-pas complet.
 */

import { createClient } from "npm:@supabase/supabase-js@2";

const DIDIT_API = "https://verification.didit.me/v2/session/";

/* L'export statique appelle depuis le domaine GitHub Pages ; en local,
   depuis localhost. Le JWT fait l'authentification — CORS ne fait que
   laisser passer l'en-tête. */
const CORS = {
  "Access-Control-Allow-Origin": Deno.env.get("SITE_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });

  const apiKey = Deno.env.get("DIDIT_API_KEY");
  const workflowId = Deno.env.get("DIDIT_WORKFLOW_ID");
  if (!apiKey || !workflowId) {
    return json(503, { error: "didit_not_configured" });
  }

  /* Qui demande ? Le JWT du porteur, vérifié par Supabase avant d'arriver
     ici, redevient un utilisateur via le client anon + en-tête. */
  const supabaseAuth = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: req.headers.get("Authorization")! } } },
  );
  const { data: userData, error: userError } =
    await supabaseAuth.auth.getUser();
  if (userError || !userData.user) return json(401, { error: "unauthorized" });
  const userId = userData.user.id;

  /* Écritures : la clé service. `identity_verifications` n'a aucune policy
     d'INSERT côté client — c'est volontaire, seul ce chemin crée un dossier. */
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  /* Un dossier déjà vérifié et valide ? Rien à rouvrir. */
  const { data: existing } = await supabase
    .from("identity_verifications")
    .select("status, expires_at")
    .eq("profile_id", userId)
    .eq("status", "verified")
    .or("expires_at.is.null,expires_at.gt.now()")
    .limit(1);
  if (existing && existing.length > 0) {
    return json(409, { error: "already_verified" });
  }

  /* La session Didit. `vendor_data` = notre identifiant de profil : c'est
     la seule donnée que nous fournissons, et c'est elle qui revient dans le
     webhook pour rattacher le verdict au bon compte. */
  const callback = Deno.env.get("SITE_URL")
    ? `${Deno.env.get("SITE_URL")!.replace(/\/$/, "")}/cuenta/`
    : undefined;

  const diditRes = await fetch(DIDIT_API, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": apiKey },
    body: JSON.stringify({
      workflow_id: workflowId,
      vendor_data: userId,
      ...(callback ? { callback } : {}),
    }),
  });
  if (!diditRes.ok) {
    console.error("didit session creation failed", diditRes.status);
    return json(502, { error: "didit_unavailable" });
  }
  const diditSession = (await diditRes.json()) as {
    session_id: string;
    url: string;
  };

  /* Le dossier chez nous : référence + statut. Rien d'autre (R6). */
  const { error: insertError } = await supabase
    .from("identity_verifications")
    .upsert(
      {
        profile_id: userId,
        provider: "didit",
        provider_ref: diditSession.session_id,
        status: "pending",
        document_country: "PA",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "provider,provider_ref" },
    );
  if (insertError) {
    console.error("kyc row upsert failed", insertError.message);
    return json(500, { error: "storage_failed" });
  }

  return json(200, { url: diditSession.url });
});
