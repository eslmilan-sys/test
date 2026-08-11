/**
 * DIDIT-WEBHOOK — reçoit le verdict et ne garde que le verdict.
 *
 * Didit appelle cette fonction à chaque changement d'état d'une session de
 * vérification. Le corps contient le statut, notre `vendor_data` (l'id du
 * profil) et — selon le workflow — des détails de décision. Nous lisons le
 * statut, la référence et les dates. LE RESTE EST IGNORÉ DÉLIBÉRÉMENT :
 * règle R6, jamais de numéro de cédula, d'image ni de selfie chez nous.
 * Le badge `profiles.is_id_verified` se met à jour tout seul par le
 * trigger `trg_sync_id_verified` (migration 0003).
 *
 * Authentification : PAS de JWT (c'est Didit qui appelle, pas un
 * utilisateur) — déployer avec `--no-verify-jwt`. À la place, la signature
 * HMAC-SHA256 : Didit signe le corps brut avec le secret webhook, nous
 * recalculons et comparons en temps constant. L'horodatage borne le rejeu.
 * Secrets attendus : DIDIT_WEBHOOK_SECRET.
 */

import { createClient } from "npm:@supabase/supabase-js@2";

/** Statuts Didit → notre énumération `verification_status`. */
const STATUS_MAP: Record<string, "pending" | "verified" | "rejected" | "expired"> = {
  "Not Started": "pending",
  "In Progress": "pending",
  "In Review": "pending",
  Approved: "verified",
  Declined: "rejected",
  Abandoned: "expired",
  Expired: "expired",
};

const encoder = new TextEncoder();

async function hmacHex(secret: string, body: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Comparaison en temps constant : pas d'oracle de préfixe. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("method not allowed", { status: 405 });
  }

  const secret = Deno.env.get("DIDIT_WEBHOOK_SECRET");
  if (!secret) return new Response("not configured", { status: 503 });

  const rawBody = await req.text();

  /* 1. La signature d'abord : tout le reste est du contenu non fiable. */
  const signature = req.headers.get("x-signature") ?? "";
  const expected = await hmacHex(secret, rawBody);
  if (!signature || !timingSafeEqual(signature.toLowerCase(), expected)) {
    return new Response("invalid signature", { status: 401 });
  }

  /* 2. Fenêtre de rejeu : un événement signé mais vieux de plus de cinq
     minutes est rejoué, pas émis. */
  const timestamp = Number(req.headers.get("x-timestamp"));
  if (
    Number.isFinite(timestamp) &&
    Math.abs(Date.now() / 1000 - timestamp) > 300
  ) {
    return new Response("stale event", { status: 401 });
  }

  let event: {
    session_id?: string;
    status?: string;
    vendor_data?: string;
  };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response("invalid body", { status: 400 });
  }
  if (!event.session_id || !event.status) {
    return new Response("missing fields", { status: 400 });
  }

  const status = STATUS_MAP[event.status];
  if (!status) {
    /* Statut inconnu (nouveau chez Didit) : accusé de réception sans
       écriture — 200, sinon Didit ré-émet en boucle. */
    return new Response("ignored", { status: 200 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  /* 3. Le verdict — et rien que lui. La ligne existe depuis didit-start ;
     si elle manque (webhook arrivé avant l'insert, ou session créée dans
     la console Didit), `vendor_data` permet de la créer. */
  const now = new Date().toISOString();
  const row = {
    provider: "didit",
    provider_ref: event.session_id,
    status,
    verified_at: status === "verified" ? now : null,
    updated_at: now,
    ...(event.vendor_data ? { profile_id: event.vendor_data } : {}),
  };

  const { error } = event.vendor_data
    ? await supabase
        .from("identity_verifications")
        .upsert(row, { onConflict: "provider,provider_ref" })
    : await supabase
        .from("identity_verifications")
        .update({ status, verified_at: row.verified_at, updated_at: now })
        .eq("provider", "didit")
        .eq("provider_ref", event.session_id);

  if (error) {
    console.error("kyc verdict write failed", error.message);
    /* 500 : Didit ré-émettra, et l'upsert est idempotent. */
    return new Response("storage failed", { status: 500 });
  }

  return new Response("ok", { status: 200 });
});
