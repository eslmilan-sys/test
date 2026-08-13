/**
 * LE SITE ENTIER DANS UN SEUL FICHIER — standalone/partimos-sitio-completo.html
 *
 * Même principe que le one-pager (`build-standalone.mjs`) mais pour TOUTES
 * les pages : chacune est prise telle quelle dans l'export statique réel,
 * son <body> est rangé dans un <template data-path>, et un mini-routeur à
 * fragments (#/como-funciona) fait vivre la navigation interne dans le
 * fichier. Les feuilles de style et les polices ne sont inlinées qu'UNE
 * fois — c'est ce qui garde le fichier raisonnable. Les scripts React sont
 * retirés (ils ne portaient que l'hydratation) ; les liens vers des pages
 * non embarquées (fiches viaje datées, recherches paramétrées) pointent
 * vers le site en ligne.
 */
import fs from "node:fs";
import path from "node:path";

const OUT = new URL("../out", import.meta.url).pathname;
const BASE = "/test/partimos";
const LIVE = "https://eslmilan-sys.github.io/test/partimos";
const DEST = new URL(
  "../standalone/partimos-sitio-completo.html",
  import.meta.url,
).pathname;

/** Les pages embarquées : toutes les vraies pages du site, plus UNE fiche
 *  viaje d'exemple (les dizaines de fiches datées sont identiques à un
 *  contenu près — en embarquer une suffit à montrer l'écran). */
const PAGES = [
  "/",
  "/buscar/",
  "/viajes/panama-chitre/",
  "/viajes/panama-las-tablas/",
  "/viajes/panama-coronado/",
  "/viajes/panama-santiago/",
  "/viajes/panama-penonome/",
  "/viajes/panama-david/",
  "/viajes/chitre-panama/",
  "/viajes/las-tablas-panama/",
  "/viajes/coronado-panama/",
  "/viajes/santiago-panama/",
  "/viajes/penonome-panama/",
  "/viajes/david-panama/",
  "/publicar/",
  "/publicar/nuevo/",
  "/como-funciona/",
  "/seguridad/",
  "/terminos/",
  "/privacidad/",
  "/cuenta/",
  "/ayuda/",
];

const MIME = {
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

function onDisk(url, from = null) {
  const clean = url.split("?")[0].split("#")[0];
  let p;
  if (clean.startsWith(BASE + "/"))
    p = path.join(OUT, clean.slice(BASE.length));
  else if (from && !/^[a-z]+:|^\/\//i.test(clean))
    p = path.resolve(from, clean);
  else return null;
  return fs.existsSync(p) && fs.statSync(p).isFile() ? p : null;
}

const uriCache = new Map();
function dataUri(file) {
  if (!uriCache.has(file)) {
    const mime =
      MIME[path.extname(file).toLowerCase()] ?? "application/octet-stream";
    uriCache.set(
      file,
      `data:${mime};base64,${fs.readFileSync(file).toString("base64")}`,
    );
  }
  return uriCache.get(file);
}

function pageFile(route) {
  return path.join(OUT, route === "/" ? "index.html" : route, route === "/" ? "" : "index.html");
}

/* ---- 1. Le squelette et les styles viennent de l'accueil ---- */
const homeHtml = fs.readFileSync(pageFile("/"), "utf8");

/** Toutes les feuilles référencées sur l'ensemble des pages, dédupliquées. */
const cssHrefs = new Set();
for (const route of PAGES) {
  const html = fs.readFileSync(pageFile(route), "utf8");
  for (const m of html.matchAll(
    /<link[^>]+rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g,
  ))
    cssHrefs.add(m[1]);
}

let styles = "";
for (const href of cssHrefs) {
  const file = onDisk(href);
  if (!file) continue;
  let css = fs.readFileSync(file, "utf8");
  // Sous-ensembles non latins retirés — même tri que le one-pager.
  css = css.replace(/@font-face\s*\{[^}]*\}/g, (block) => {
    const range = /unicode-range:\s*([^;}]+)/.exec(block);
    if (!range) return block;
    return /^U\+\?\?/i.test(range[1].trim()) ? block : "";
  });
  css = css.replace(/url\((['"]?)([^'")]+)\1\)/g, (m, q, u) => {
    if (u.startsWith("data:")) return m;
    const f = onDisk(u, path.dirname(file));
    return f ? `url(${dataUri(f)})` : m;
  });
  styles += `<style>\n${css}\n</style>\n`;
}

/* ---- 2. Chaque page devient un <template> ---- */
function cleanPage(html) {
  // Scripts dehors : il n'y avait que l'hydratation React.
  html = html.replace(/<script[\s\S]*?<\/script>/g, "");
  html = html.replace(/<link[^>]+rel="preload"[^>]*as="script"[^>]*>/g, "");
  // La barre basse, figée déployée (voir build-standalone.mjs).
  html = html
    .replace(/translate-y-\[calc\(100%\+1\.5rem\)\]/g, "translate-y-0")
    .replace(/ inert=""/g, "");
  // Ressources locales → data URIs (avec cache : le logo pèse UNE fois
  // par occurrence mais se lit du même buffer).
  html = html.replace(
    /(src|href|content)="(\/test\/partimos\/[^"]+)"/g,
    (m, attr, url) => {
      if (/\.(css|js|txt|html?|xml)$/i.test(url.split("?")[0])) return m;
      const f = onDisk(url);
      return f ? `${attr}="${dataUri(f)}"` : m;
    },
  );
  html = html.replace(/srcSet="([^"]+)"|srcset="([^"]+)"/g, (m, a, b) => {
    const list = (a ?? b).split(",").map((part) => {
      const [u, d] = part.trim().split(/\s+/);
      const f = onDisk(u);
      return `${f ? dataUri(f) : u}${d ? " " + d : ""}`;
    });
    return `srcset="${list.join(", ")}"`;
  });
  // Liens internes : embarqué → fragment du routeur ; sinon → site en ligne.
  html = html.replace(/href="(\/test\/partimos\/?[^"]*)"/g, (m, url) => {
    if (url.startsWith("data:")) return m;
    const clean = url.slice(BASE.length) || "/";
    const [pathname, suffix] = clean.split(/(?=[?#])/);
    const normal = pathname.endsWith("/") ? pathname : `${pathname}/`;
    if (PAGES.includes(normal) && !suffix)
      return `href="#${normal === "/" ? "/" : normal.slice(0, -1)}"`;
    return `href="${LIVE}${clean}"`;
  });
  return html;
}

function bodyOf(html) {
  const m = /<body[^>]*>([\s\S]*)<\/body>/.exec(html);
  return m ? m[1] : html;
}
function titleOf(html) {
  const m = /<title>([\s\S]*?)<\/title>/.exec(html);
  return m ? m[1] : "Partimos";
}

let templates = "";
for (const route of PAGES) {
  const raw = fs.readFileSync(pageFile(route), "utf8");
  const cleaned = cleanPage(raw);
  const key = route === "/" ? "/" : route.slice(0, -1);
  templates += `<template data-path="${key}" data-title="${titleOf(raw).replace(/"/g, "&quot;")}">${bodyOf(cleaned)}</template>\n`;
}

/* ---- 3. Le fichier final : head de l'accueil + routeur ---- */
const headMatch = /<head[^>]*>([\s\S]*?)<\/head>/.exec(cleanPage(homeHtml));
let head = headMatch ? headMatch[1] : "";
// Les <link rel=stylesheet> du head sont remplacés par les styles inlinés.
head = head.replace(/<link[^>]+rel="stylesheet"[^>]*>/g, "");

const router = `<script>
(function () {
  var pages = {};
  document.querySelectorAll("template[data-path]").forEach(function (t) {
    pages[t.dataset.path] = t;
  });
  var root = document.getElementById("sa-root");
  function show(p) {
    var t = pages[p] || pages["/"];
    root.innerHTML = t.innerHTML;
    document.title = t.dataset.title;
    window.scrollTo(0, 0);
  }
  window.addEventListener("hashchange", function () {
    show(location.hash.slice(1) || "/");
  });
  show(location.hash.slice(1) || "/");
})();
</script>`;

const doc = `<!doctype html>
<html lang="es-PA">
<head>
${head}
${styles}
</head>
<body>
<div id="sa-root"></div>
${templates}
${router}
</body>
</html>`;

fs.mkdirSync(path.dirname(DEST), { recursive: true });
fs.writeFileSync(DEST, doc);
console.log(`pages embarquées : ${PAGES.length}`);
console.log(`feuilles de style : ${cssHrefs.size}`);
console.log(`${DEST} — ${(fs.statSync(DEST).size / 1024 / 1024).toFixed(2)} Mo`);
