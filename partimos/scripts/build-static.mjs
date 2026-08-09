#!/usr/bin/env node
/**
 * Construit l'export statique destiné à GitHub Pages.
 *
 *   node scripts/build-static.mjs
 *
 * `output: "export"` refuse toute route d'API : un handler POST n'a aucun
 * sens sans serveur. Plutôt que de supprimer la route du dépôt — elle est
 * indispensable au déploiement réel — on la déplace le temps du build et on
 * la remet ensuite, y compris si le build échoue.
 *
 * Variables lues :
 *   BASE_PATH             préfixe d'URL (« /test » pour une Page de projet)
 *   NEXT_PUBLIC_SITE_URL  origine, pour les canoniques et le sitemap
 */

import { spawnSync } from "node:child_process";
import { existsSync, renameSync, writeFileSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const apiDir = join(root, "src/app/api");
const parked = join(root, ".api-parked");

function restore() {
  if (existsSync(parked)) {
    if (existsSync(apiDir)) rmSync(apiDir, { recursive: true, force: true });
    renameSync(parked, apiDir);
  }
}

process.on("exit", restore);
process.on("SIGINT", () => process.exit(130));

if (existsSync(apiDir)) renameSync(apiDir, parked);

const result = spawnSync("npx", ["next", "build"], {
  cwd: root,
  stdio: "inherit",
  env: {
    ...process.env,
    STATIC_EXPORT: "1",
    NEXT_PUBLIC_STATIC_PREVIEW: "1",
  },
});

restore();

if (result.status !== 0) process.exit(result.status ?? 1);

// GitHub Pages passe le contenu dans Jekyll par défaut, qui ignore les
// dossiers commençant par un underscore — donc tout /_next/.
writeFileSync(join(root, "out/.nojekyll"), "");

// Une Page de projet n'a pas de réécriture côté serveur : une URL inconnue
// doit atterrir sur une vraie page 404, pas sur le listing d'Apache.
const notFound = join(root, "out/404.html");
if (!existsSync(notFound)) {
  writeFileSync(notFound, "<!doctype html><meta http-equiv=refresh content='0; url=./'>");
}

console.log("\nExport statique prêt dans out/");
