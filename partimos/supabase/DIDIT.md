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

## 1. Côté Didit ⛔

1. Crée un compte sur <https://business.didit.me> (l'offre de base de la
   vérification d'identité est gratuite).
2. Crée une application, puis un **workflow** de vérification : « ID
   Verification » + « Face Match » suffisent pour la cédula panaméenne.
   Note le `workflow_id`.
3. Dans les réglages de l'application, récupère la **clé API**
   (`x-api-key`) et le **secret webhook**.
4. Configure l'URL du webhook (après l'étape 3 ci-dessous) :
   `https://<ref-projet>.supabase.co/functions/v1/didit-webhook`

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
  DIDIT_WORKFLOW_ID="..." \
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
