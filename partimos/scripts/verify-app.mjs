#!/usr/bin/env node
/**
 * BATTERIE DU MODE APP — dans un vrai navigateur.
 *
 *   node scripts/verify-app.mjs [url]     (défaut : http://localhost:3100)
 *
 * Ce qu'elle protège, cas par cas :
 *
 *   · le SITE ne doit RIEN gagner du mode app — le cockpit « Hoy » n'y
 *     apparaît jamais, et l'argumentaire reste entier pour Google ;
 *   · l'APP montre l'état avant la recherche quand il y a une reserva ;
 *   · la barre d'onglets est ancrée en bas, atteignable au pouce, et le
 *     contenu ne passe pas dessous ;
 *   · le HTML SERVI est identique dans les deux cas — c'est la règle de
 *     la maison (le SEO est le canal principal), et une régression ici
 *     serait invisible à l'œil.
 *
 * Le mode app est déclenché par la classe `.app-instalada`, celle que
 * `PWA.tsx` pose sur les iPhone antérieurs à 16.4 : ce sont exactement les
 * mêmes règles CSS que `@media (display-mode: standalone)`.
 */

import { chromium, devices } from "playwright";

const BASE = process.argv[2] ?? "http://localhost:3100";
const CHROME = process.env.PLAYWRIGHT_CHROMIUM ?? "/opt/pw-browsers/chromium";

let fallos = 0;
const ok = (nom, cond, detalle = "") => {
  console.log(`  ${cond ? "ok  " : "FALLA"}  ${nom}${detalle ? ` — ${detalle}` : ""}`);
  if (!cond) fallos++;
};

/** Une reserva pour demain matin : de quoi faire exister le cockpit. */
const manana = new Date(Date.now() + 20 * 3_600_000).toISOString();
const SESSION = {
  contact: "ana@ejemplo.com",
  firstName: "Ana",
  lastName: "Ruiz",
  lastInitial: "R",
  isVerified: true,
  affiliation: null,
  since: "2026-01-05T00:00:00.000Z",
  payPref: "yappy",
  bookings: [
    {
      id: "demo-11111111-2222-3333-4444-555555555555",
      tripId: "panama-chitre-2026-08-15-2",
      from: "panama-city",
      to: "chitre",
      boardingAt: manana,
      seats: 1,
      totalCents: 950,
      feeCents: 48,
      channel: "yappy",
      driverName: "Carlos M",
      point: "Albrook, entrada norte",
      status: "confirmado",
    },
  ],
};

const navegador = await chromium.launch({ executablePath: CHROME });

async function abrir({ modo, conSesion }) {
  const ctx = await navegador.newContext({ ...devices["iPhone 13"] });
  if (conSesion) {
    await ctx.addInitScript((s) => {
      window.localStorage.setItem("partimos.demo-session", JSON.stringify(s));
    }, SESSION);
  }
  const p = await ctx.newPage();
  await p.goto(`${BASE}/`, { waitUntil: "networkidle" });
  if (modo === "app") {
    await p.evaluate(() => document.documentElement.classList.add("app-instalada"));
  }
  await p.waitForTimeout(500);
  return { ctx, p };
}

const ve = (p, sel) => p.locator(sel).first().isVisible().catch(() => false);

console.log(`\nMode app — ${BASE}\n`);

/* 1. LE SITE reste le site, même avec une reserva en session. */
{
  const { ctx, p } = await abrir({ modo: "sitio", conSesion: true });
  ok("site — pas de cockpit « Hoy »", !(await ve(p, '[aria-label="Tu próximo viaje"]')));
  ok("site — pas de barre d'onglets", !(await ve(p, 'nav[aria-label="Navegación principal"]')));
  ok("site — titre marketing présent", await ve(p, "h1"));
  ok("site — barre haute présente", await ve(p, 'nav[aria-label="Principal"]'));
  await ctx.close();
}

/* 2. L'APP avec une reserva : l'état passe AVANT la recherche. */
{
  const { ctx, p } = await abrir({ modo: "app", conSesion: true });
  const cockpit = p.locator('[aria-label="Tu próximo viaje"]');
  ok("app — le cockpit apparaît", await ve(p, '[aria-label="Tu próximo viaje"]'));
  ok("app — marketing masqué", !(await ve(p, "h1")));
  ok("app — buscador toujours là", await ve(p, "#desde"));

  const txt = (await cockpit.textContent().catch(() => "")) ?? "";
  ok("app — la route est nommée", /Panam|Chitr/i.test(txt), txt.replace(/\s+/g, " ").slice(0, 46));
  ok("app — le compte à rebours est là", /Sale en|En curso|·/.test(txt));
  ok("app — le point de recogida est là", txt.includes("Te recoge"));
  ok("app — le chat est à un geste", txt.includes("Chat con"));

  /* L'état DOIT être au-dessus du formulaire : c'est tout le propos. */
  const yCockpit = (await cockpit.boundingBox())?.y ?? 1e9;
  const yBuscador = (await p.locator("#desde").boundingBox())?.y ?? -1;
  ok("app — l'état passe avant la recherche", yCockpit < yBuscador, `${Math.round(yCockpit)} px < ${Math.round(yBuscador)} px`);

  /* La sécurité doit FAIRE quelque chose, pas décorer. */
  await p.getByRole("button", { name: "Seguridad" }).first().click();
  await p.waitForTimeout(400);
  const tel = await p.locator('a[href="tel:911"]').first().isVisible().catch(() => false);
  ok("app — Seguridad appelle vraiment le 911", tel);
  ok("app — Seguridad partage le viaje", await ve(p, "text=Compartir mi viaje"));
  await ctx.close();
}

/* 3. L'APP sans reserva : pas de carte vide, la recherche prend la place. */
{
  const { ctx, p } = await abrir({ modo: "app", conSesion: false });
  ok("app sans reserva — pas de carte vide", !(await ve(p, '[aria-label="Tu próximo viaje"]')));
  ok("app sans reserva — buscador présent", await ve(p, "#desde"));
  await ctx.close();
}

/* 4. La barre d'onglets : ancrée en bas, et le contenu ne passe pas dessous. */
{
  const { ctx, p } = await abrir({ modo: "app", conSesion: true });
  const barra = p.locator('nav[aria-label="Navegación principal"]');
  ok("app — barre d'onglets visible", await ve(p, 'nav[aria-label="Navegación principal"]'));
  const b = await barra.boundingBox();
  const vp = p.viewportSize();
  ok(
    "app — barre ancrée au bas de l'écran",
    b !== null && Math.abs(b.y + b.height - vp.height) <= 2,
    b ? `bas = ${Math.round(b.y + b.height)} px / ${vp.height} px` : "absente",
  );
  ok("app — 4 onglets", (await barra.locator("a").count()) === 4);
  /* Chaque cible doit tenir le pouce : 44 px est le minimum d'Apple. */
  const altos = await barra.locator("a").evaluateAll((els) =>
    els.map((e) => Math.round(e.getBoundingClientRect().height)),
  );
  ok("app — cibles ≥ 44 px", altos.every((h) => h >= 44), altos.join(" / "));
  const pad = await p.evaluate(() => getComputedStyle(document.body).paddingBottom);
  ok("app — réserve sous le contenu", parseInt(pad, 10) >= 64, pad);
  await ctx.close();
}

/* 5. LE POINT SEO : le HTML servi ne dépend pas du mode. */
{
  const brut = await fetch(`${BASE}/`).then((r) => r.text());
  ok("SEO — l'argumentaire est dans le HTML servi", brut.includes("Gasta menos"));
  ok("SEO — le balisage FAQ est là", brut.includes("FAQPage"));
  ok("SEO — la barre d'onglets est servie à tous", brut.includes("Navegación principal"));
}

await navegador.close();

console.log(fallos === 0 ? "\nTout passe.\n" : `\n${fallos} vérification(s) en échec.\n`);
process.exit(fallos === 0 ? 0 : 1);
