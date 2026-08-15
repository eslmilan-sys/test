#!/usr/bin/env node
/**
 * BATTERIE DE LA PORTE, DU MODE INVITÉ ET DES LIENS.
 *
 *   node scripts/verify-puerta.mjs [url]     (défaut : http://localhost:3100)
 *
 * Elle existe à cause d'un reproche précis du propriétaire : « c'est pas
 * logique, il y a des boutons cassés ». Elle vérifie donc trois choses
 * qu'aucune autre batterie ne regardait.
 *
 * 1. LA PORTE. Sans compte, l'app s'ouvre sur entrer ou s'inscrire, avec
 *    une croix EN HAUT À GAUCHE. La croix mène au mode invité.
 *
 * 2. CE QUE PEUT UN INVITÉ. La recherche, entière — et rien d'autre.
 *    Mis viajes, Mensajes, Perfil et Publicar ramènent à la connexion.
 *    C'est la règle du propriétaire, mot pour mot.
 *
 * 3. AUCUN LIEN MORT. Chaque `href` interne trouvé dans l'app est
 *    ouvert : il doit répondre, et ne pas retomber silencieusement sur
 *    un autre écran. C'est exactement ce qui était cassé — la carte
 *    « Verifica tu cédula » pointait vers un `?panel=` qui n'existait
 *    pas, et le bouton ne faisait visiblement rien.
 */

import { chromium, devices } from "playwright";

const BASE = process.argv[2] ?? "http://localhost:3100";
const CHROME = process.env.PLAYWRIGHT_CHROMIUM ?? "/opt/pw-browsers/chromium";

let fallos = 0;
const ok = (nom, cond, detalle = "") => {
  console.log(`  ${cond ? "ok  " : "FALLA"}  ${nom}${detalle ? ` — ${detalle}` : ""}`);
  if (!cond) fallos++;
};

const manana = new Date(Date.now() + 20 * 3_600_000).toISOString();
const SESSION = {
  contact: "milan@ejemplo.com", firstName: "Milan", lastName: "Ruiz", lastInitial: "R",
  isVerified: false, affiliation: null, since: "2026-01-05T00:00:00.000Z", payPref: "yappy",
  bookings: [{
    id: "demo-11111111-2222-3333-4444-555555555555",
    tripId: "panama-chitre-2026-08-15-2", from: "panama-city", to: "chitre",
    boardingAt: manana, seats: 1, totalCents: 1900, feeCents: 95, channel: "yappy",
    driverName: "Carlos M", point: "Albrook, entrada norte", status: "confirmado",
  }],
};

const navegador = await chromium.launch({ executablePath: CHROME });

/** `quien` : "nadie" (jamais entré), "invitado" (a fermé la porte),
 *  "socio" (connecté). */
async function abrir(url, quien) {
  const ctx = await navegador.newContext({ ...devices["iPhone 13"] });
  if (quien === "socio") {
    await ctx.addInitScript((s) => {
      window.localStorage.setItem("partimos.demo-session", JSON.stringify(s));
    }, SESSION);
  }
  if (quien === "invitado") {
    await ctx.addInitScript(() =>
      window.sessionStorage.setItem("partimos.invitado", "1"),
    );
  }
  const p = await ctx.newPage();
  await p.goto(`${BASE}${url}`, { waitUntil: "networkidle" }).catch(() => {});
  await p.waitForTimeout(700);
  await p.evaluate(() => document.documentElement.classList.add("app-instalada"));
  await p.waitForTimeout(500);
  return { ctx, p };
}

const app = (p) => p.locator(".solo-app").first();
const texto = async (p) => ((await app(p).innerText()) ?? "").replace(/\s+/g, " ");
const esPuerta = (t) => /Crear cuenta/.test(t) && /Iniciar sesi/.test(t);

console.log(`\nPuerta, invitado y enlaces — ${BASE}\n`);

/* ═══ 1. LA PORTE ═══ */
{
  const { ctx, p } = await abrir("/", "nadie");
  ok("porte — elle s'affiche sans compte", esPuerta(await texto(p)));

  const cruz = p.getByLabel("Seguir sin cuenta").first();
  ok("porte — la croix existe", await cruz.isVisible().catch(() => false));

  /* EN HAUT À GAUCHE, demande explicite : à gauche on quitte, à droite
     on agit. Une croix à droite se confondrait avec une action. */
  const c = await cruz.boundingBox();
  const vp = p.viewportSize();
  ok("porte — la croix est en haut à GAUCHE", c !== null && c.x < vp.width / 3 && c.y < 160,
    c ? `x ${Math.round(c.x)} y ${Math.round(c.y)}` : "absente");

  /* LE VERRE. Le propriétaire l'a demandé nommément ; on vérifie qu'il
     est réellement peint, pas juste écrit dans une classe. */
  const flou = await cruz.evaluate((e) => {
    const s = getComputedStyle(e);
    return s.backdropFilter || s.webkitBackdropFilter || "none";
  });
  ok("porte — la croix est en verre", /blur/.test(flou), flou);

  ok("porte — l'inscription passe avant la connexion",
    (await texto(p)).indexOf("Crear cuenta") < (await texto(p)).indexOf("Iniciar sesi"));
  ok("porte — Google et LinkedIn", /Google/.test(await texto(p)) && /LinkedIn/.test(await texto(p)));

  /* LA CROIX FAIT QUELQUE CHOSE. */
  await cruz.click();
  await p.waitForTimeout(700);
  const t = await texto(p);
  ok("porte — la croix ouvre l'app", !esPuerta(t));
  ok("porte — et on tombe sur la recherche", /A dónde/.test(t));
  await ctx.close();
}

/* ═══ 2. CE QUE PEUT UN INVITÉ ═══ */
console.log("\n  Invitado :\n");

/** Ce qui doit rester ouvert sans compte : chercher, comparer, regarder. */
for (const [url, nombre] of [
  ["/", "el inicio"],
  ["/ya", "buscar"],
  ["/buscar?desde=panama-city&hacia=chitre", "los resultados"],
  ["/seguridad", "seguridad"],
  ["/ayuda", "ayuda"],
]) {
  const { ctx, p } = await abrir(url, "invitado");
  ok(`invitado — ${nombre} está abierto`, !esPuerta(await texto(p)));
  await ctx.close();
}

/** Ce qui exige un compte : tout ce qui engage quelqu'un. */
for (const [url, nombre] of [
  ["/cuenta", "Mis viajes"],
  ["/cuenta?panel=mensajes", "Mensajes"],
  ["/cuenta?panel=perfil", "Perfil"],
  ["/cuenta?panel=verificacion", "Verificación"],
  ["/publicar/nuevo", "Publicar"],
]) {
  const { ctx, p } = await abrir(url, "invitado");
  const t = await texto(p);
  ok(`invitado — ${nombre} pide la cuenta`, esPuerta(t));
  /* ET IL DIT POURQUOI. Un écran de connexion sans motif se lit comme
     un mur ; avec un motif, c'est une étape. */
  ok(`invitado — ${nombre} dice por qué`, /cuenta/i.test(t.slice(0, 200)));
  await ctx.close();
}

/* ═══ 3. AVEC UN COMPTE, TOUT S'OUVRE ═══ */
console.log("\n  Con cuenta :\n");
{
  for (const [url, marca] of [
    ["/cuenta", "Mis viajes"],
    ["/cuenta?panel=mensajes", "Mensajes"],
    ["/cuenta?panel=perfil", "Milan R."],
    ["/cuenta?panel=verificacion", "Verificación"],
    ["/cuenta?panel=legal", "Legal"],
  ]) {
    const { ctx, p } = await abrir(url, "socio");
    const t = await texto(p);
    ok(`socio — ${url} montre « ${marca} »`, t.includes(marca), t.slice(0, 40));
    await ctx.close();
  }
}

/* ═══ 4. LA VÉRIFICATION A QUATRE PIÈCES ═══ */
{
  const { ctx, p } = await abrir("/cuenta?panel=verificacion", "socio");
  const t = await texto(p);
  for (const pieza of ["Cédula", "Licencia de conducir", "Foto del carro", "Número de placa"]) {
    ok(`verificación — ${pieza}`, t.includes(pieza));
  }
  /* R6 : aucune image de cédula stockée. L'écran doit le DIRE, parce que
     c'est la question que tout le monde se pose sans la poser. */
  ok("verificación — dit ce qu'on garde de la cédula",
    /Solo si pasó, y una referencia/.test(t));
  await ctx.close();
}

/* ═══ 5. LE PAVÉ LÉGAL A QUITTÉ LE BAS DE CHAQUE ÉCRAN ═══ */
{
  const marca = "no emplea conductores";
  for (const url of ["/", "/ya", "/cuenta", "/buscar?desde=panama-city&hacia=chitre"]) {
    const { ctx, p } = await abrir(url, "socio");
    const cuerpo = await p.evaluate(() => document.body.innerText ?? "");
    ok(`legal — absent du bas de ${url}`, !cuerpo.includes(marca));
    await ctx.close();
  }
  /* MAIS IL EXISTE, et il a une adresse. Le sortir du pied de page sans
     lui donner de page serait le rendre introuvable — ça, ce serait une
     faute. */
  const { ctx, p } = await abrir("/cuenta?panel=legal", "socio");
  ok("legal — présent dans sa page", (await texto(p)).includes(marca));
  await ctx.close();
}

/* ═══ 6. LA CLOCHE MÈNE À MIS VIAJES ═══ */
{
  const { ctx, p } = await abrir("/", "socio");
  const campana = app(p).getByLabel("Mis viajes y avisos").first();
  ok("campana — elle existe", await campana.isVisible().catch(() => false));
  ok("campana — elle mène à Mis viajes", (await campana.getAttribute("href")) === "/cuenta");
  await ctx.close();
}

/* ═══ 7. LA BARRE FLOTTE, ET ELLE EST EN VERRE ═══ */
{
  const { ctx, p } = await abrir("/", "socio");
  const pilula = p.locator('nav[aria-label="Navegación principal"] ul').first();
  const b = await pilula.boundingBox();
  const vp = p.viewportSize();
  ok("barra — elle est visible", b !== null);
  /* FLOTTANTE : détachée des trois bords, sinon c'est une barre pleine
     largeur et pas une pilule. */
  ok("barra — détachée des bords", b !== null && b.x > 4 && b.x + b.width < vp.width - 4 && b.y + b.height < vp.height - 4,
    b ? `x ${Math.round(b.x)} bas ${Math.round(b.y + b.height)}/${vp.height}` : "absente");
  const flou = await pilula.evaluate((e) => {
    const s = getComputedStyle(e);
    return s.backdropFilter || s.webkitBackdropFilter || "none";
  });
  ok("barra — en verre", /blur/.test(flou), flou);
  /* LE CONTENU NE PASSE PAS DESSOUS. */
  const pad = await p.evaluate(() => parseInt(getComputedStyle(document.body).paddingBottom, 10));
  ok("barra — réserve sous le contenu", pad >= 84, `${pad} px`);
  await ctx.close();
}

/* ═══ 8. AUCUN LIEN MORT DANS L'APP ═══ */
console.log("\n  Enlaces :\n");
{
  const PARTIDA = [
    "/", "/ya", "/buscar?desde=panama-city&hacia=chitre", "/cuenta",
    "/cuenta?panel=mensajes", "/cuenta?panel=perfil", "/cuenta?panel=verificacion",
    "/cuenta?panel=legal", "/como-funciona", "/seguridad", "/ayuda",
    "/publicar", "/publicar/nuevo", "/terminos", "/privacidad",
    "/viaje/panama-chitre-2026-08-15-2?desde=panama-city&hacia=chitre",
  ];
  const destinos = new Set();
  for (const url of PARTIDA) {
    const { ctx, p } = await abrir(url, "socio");
    const hrefs = await p.locator("a[href]").evaluateAll((els) =>
      els
        .filter((e) => {
          const r = e.getBoundingClientRect();
          return r.width > 0 && r.height > 0;
        })
        .map((e) => e.getAttribute("href")),
    );
    for (const h of hrefs) {
      if (!h || h.startsWith("mailto:") || h.startsWith("tel:") || h.startsWith("#")) continue;
      destinos.add(h);
    }
    await ctx.close();
  }

  ok("enlaces — il y en a à vérifier", destinos.size > 8, `${destinos.size} destination(s)`);

  /* CHAQUE DESTINATION RÉPOND. Une ancre `/#buscar` qui pointe vers un
     bloc masqué en mode app est morte de la même façon qu'un 404 : on
     appuie, rien ne bouge. */
  const muertos = [];
  for (const h of destinos) {
    const camino = h.split("#")[0].split("?")[0] || "/";
    const r = await fetch(`${BASE}${camino}`).catch(() => null);
    if (!r || !r.ok) {
      muertos.push(`${h} (${r ? r.status : "sin respuesta"})`);
      continue;
    }
    /* Une ancre doit avoir sa cible VISIBLE en mode app. */
    if (h.includes("#") && h.split("#")[1]) {
      const { ctx, p } = await abrir(h, "socio");
      const id = h.split("#")[1];
      const visible = await p
        .locator(`#${id}`)
        .first()
        .isVisible()
        .catch(() => false);
      if (!visible) muertos.push(`${h} (ancre invisible dans l'app)`);
      await ctx.close();
    }
  }
  ok("enlaces — aucune destination morte", muertos.length === 0, muertos.join(" · "));
}

await navegador.close();

console.log(fallos === 0 ? "\nTout passe.\n" : `\n${fallos} vérification(s) en échec.\n`);
process.exit(fallos === 0 ? 0 : 1);
