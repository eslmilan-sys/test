/**
 * LE SERVICE WORKER — ce qui fait de Partimos une app plutôt qu'un signet.
 *
 * Stratégie volontairement PRUDENTE, parce qu'un service worker mal réglé
 * est la façon la plus sûre de servir à quelqu'un une version périmée du
 * site pendant des jours — et on vient précisément de passer une nuit sur
 * des problèmes de cache.
 *
 *   · les PAGES (navigations) → le réseau d'abord. On sert le cache
 *     seulement si le réseau ne répond pas. Personne ne voit jamais une
 *     page ancienne alors qu'il a du signal.
 *   · les FICHIERS de build (/_next/static/…) → le cache d'abord : leur
 *     nom contient une empreinte, ils ne changent jamais à nom égal.
 *   · tout le reste (API, Supabase, cartes) → jamais mis en cache.
 *
 * `CACHE` porte un numéro de version : le changer supprime l'ancien cache
 * au moment de l'activation.
 */
const CACHE = "partimos-v1";
const HORS_LIGNE = new Request("./", { cache: "reload" });

self.addEventListener("install", (e) => {
  /* On prend la main tout de suite : sans skipWaiting, la nouvelle version
     attend la fermeture de TOUS les onglets — sur un téléphone, ça n'arrive
     jamais. */
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.add(HORS_LIGNE)).catch(() => {}));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((claves) =>
        Promise.all(claves.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  /* Une autre origine : Supabase, les géocodeurs, les cartes. On ne touche
     à rien — mettre en cache une réponse authentifiée serait une fuite. */
  if (url.origin !== self.location.origin) return;

  /* Les fichiers de build portent une empreinte dans leur nom. */
  if (url.pathname.includes("/_next/static/")) {
    e.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ??
          fetch(req).then((res) => {
            const copia = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copia));
            return res;
          }),
      ),
    );
    return;
  }

  /* Les pages : réseau d'abord, cache en secours. */
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copia = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copia));
          return res;
        })
        .catch(() => caches.match(req).then((hit) => hit ?? caches.match(HORS_LIGNE))),
    );
  }
});
