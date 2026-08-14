# Vérification d'identité — Didit × Supabase

La règle R6 du produit : **jamais** d'image ni de numéro de cédula chez
nous. Didit fait la vérification (document + selfie) sur son parcours
hébergé ; Partimos ne stocke que le **verdict** et la **référence du
dossier**. Ce document explique comment brancher les deux — toutes les
étapes marquées ⛔ demandent tes comptes et tes clés, je ne peux pas les
faire à ta place.

## Architecture

```
navigateur (site statique — AUCUN secret)
   │  JWT Supabase
   ▼
didit-start (fonction Edge, détient DIDIT_API_KEY)
   │  crée la session → insère la ligne `identity_verifications` (pending)
   │  renvoie l'URL du parcours Didit
   ▼
l'utilisateur fait la vérification CHEZ Didit (photo cédula + selfie)
   │
   ▼
didit-webhook (fonction Edge, vérifie la signature HMAC)
   │  met à jour le statut du dossier — statut et dates, rien d'autre
   ▼
trigger SQL `trg_sync_id_verified` → badge `profiles.is_id_verified`
```

Le site étant un export statique, le secret Didit ne peut vivre **que**
dans les secrets Supabase. Aucun fichier du dépôt ne doit jamais le
contenir.

## 1. Côté Didit — FAIT ✅

Configuré directement depuis cette session, via le serveur MCP de Didit
(organisation « Partimos », `1d2fa472-294f-420b-af1e-dde593e66e7c`) :

| Élément | Valeur |
| --- | --- |
| Application production | « My Application » — `c89b0424-6623-47ab-9dd0-13eaf288c0dd` |
| Application bac à sable | « Partimos (Sandbox) » — `88e1638d-888f-474d-8242-b80418143651` |
| **Workflow production** (publié) | **`d27705d1-9975-4ea2-8df2-3f8be47ff34f`** — « Free KYC » |
| Workflow bac à sable (publié) | `772c58c7-2212-49bb-9b68-8cd4dafcd2d9` |
| Webhook production | `612fe824-1bf4-4d60-9e39-46f619508e34` → `…/functions/v1/didit-webhook` (v2) |
| Webhook bac à sable | `8bb18a34-d238-42bb-9d39-72290f9f86c2` → même URL (v2) |

Le workflow retenu est **Free KYC** : OCR du document + preuve de vie +
comparaison faciale, sans AML. C'est ce qu'il faut pour une cédula
panaméenne, et son prix plancher est de 0 $. Les documents du Panama
acceptés couvrent la cédula (ID), le passeport et le permis.

Version de webhook **v2** délibérément : c'est le format que
`didit-webhook/index.ts` sait lire (`session_id`, `status`,
`vendor_data` à la racine, signature HMAC dans `x-signature`).

### Ce qui reste côté Didit ⛔

**La clé API.** Aucune n'existe encore, et elle ne se crée pas par
l'API — c'est un secret, il n'apparaît qu'une fois, à sa création :

1. <https://business.didit.me> → l'application **My Application**
2. *Settings → API Keys → Create* → copier la clé (`x-api-key`)
3. *Settings → Webhooks* → ouvrir « Partimos — Supabase didit-webhook »
   → copier le **signing secret**

## 2. Côté Supabase — migrations

```sh
supabase db push          # applique 0001 → 0003
```

`0003_didit.sql` ajoute l'index unique `(provider, provider_ref)`,
`updated_at`, et le trigger qui synchronise `profiles.is_id_verified`.

## 3. Côté Supabase — secrets et fonctions ⛔

```sh
supabase secrets set \
  DIDIT_API_KEY="..." \
  DIDIT_WORKFLOW_ID="d27705d1-9975-4ea2-8df2-3f8be47ff34f" \
  DIDIT_WEBHOOK_SECRET="..." \
  SITE_URL="https://eslmilan-sys.github.io/test/partimos" \
  SITE_ORIGIN="https://eslmilan-sys.github.io"

supabase functions deploy didit-start
supabase functions deploy didit-webhook --no-verify-jwt
```

- `didit-start` **garde** la vérification JWT : seul un utilisateur
  connecté (Supabase Auth) peut ouvrir un dossier.
- `didit-webhook` la **désactive** (`--no-verify-jwt`) : c'est Didit qui
  appelle, pas un utilisateur. La sécurité est la signature HMAC-SHA256
  du corps brut (`x-signature`) + la fenêtre anti-rejeu de 5 minutes
  (`x-timestamp`).

## 4. Côté site

Rien à déployer de spécial : l'onglet **Verificación** de `/cuenta/`
détecte `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` au
build. Sans eux (l'export de démonstration actuel), il explique que la
vérification n'est pas encore branchée ; avec eux, le bouton « Verificar
mi cédula » apparaît et mène au parcours Didit.

À savoir : le bouton exige une **vraie session Supabase Auth** (JWT).
La connexion de démonstration en `localStorage` ne suffit pas — le
branchement complet suppose donc d'activer aussi Supabase Auth (OTP par
SMS, prévu au brief).

## 5. Vérifier le branchement ⛔

1. `supabase functions logs didit-start` pendant qu'on clique le bouton :
   on doit voir la création de session, et une ligne `pending` dans
   `identity_verifications`.
2. Didit propose un mode test dans sa console : termine un parcours de
   test, puis `supabase functions logs didit-webhook` — la ligne passe à
   `verified` et `profiles.is_id_verified` devient `true` (le trigger).
3. Rejoue le même webhook depuis la console Didit : la réponse reste
   200 et rien ne change (idempotence par `(provider, provider_ref)`).

## Ce qui est stocké — et ce qui ne l'est jamais

| Chez nous (`identity_verifications`) | Jamais chez nous |
| --- | --- |
| `provider = 'didit'` | numéro de cédula |
| `provider_ref` (id de session Didit) | photos du document |
| `status` (pending/verified/rejected/expired) | selfie |
| `document_country`, `document_type` | nom extrait du document |
| `verified_at`, `expires_at`, dates | score biométrique détaillé |

Le webhook reçoit davantage (le payload de décision Didit) et **l'ignore
délibérément** — voir `supabase/functions/didit-webhook/index.ts`.
