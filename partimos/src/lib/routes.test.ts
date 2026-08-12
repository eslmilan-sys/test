/**
 * LA RUTA ENTRE DEUX VILLES QUELCONQUES — il n'y a pas de « rutas
 * cerradas ». Ces tests verrouillent la synthèse par tronçons : les km
 * et les péages doivent coller aux cumuls du référentiel, et Divisa —
 * le croisement d'Azuero — ne doit jamais apparaître comme parada.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { buildRoute, getCorridor } from "./corridors.ts";

test("une paire prédéfinie rend son corridor éditorial, pas une synthèse", () => {
  const route = buildRoute("panama-city", "chitre");
  assert.ok(route);
  assert.equal(route.slug, "panama-chitre");
  assert.equal(route, getCorridor("panama-chitre"));
});

test("Las Tablas → David s'arme tout seul à travers la fourche de Divisa", () => {
  const route = buildRoute("las-tablas", "david");
  assert.ok(route, "la ruta doit exister");
  assert.deepEqual(
    route.waypoints.map((w) => w.citySlug),
    ["las-tablas", "chitre", "santiago", "david"],
  );
  // 35 (Las Tablas→Chitré) + 35 (→Divisa) + 35 (→Santiago) + 190 (→David)
  assert.equal(route.distanceKm, 295);
  // Les péages se paient tous près de la capitale : cette ruta n'en a aucun.
  assert.equal(route.tollCents, 0);
  assert.deepEqual(
    route.waypoints.map((w) => w.km),
    [0, 35, 105, 295],
  );
});

test("les km cumulés d'une synthèse retombent sur ceux du référentiel", () => {
  // Coronado → Santiago : 250 − 85 = 165 km, péage 100 (Coronado→Penonomé).
  const route = buildRoute("coronado", "santiago");
  assert.ok(route);
  assert.equal(route.distanceKm, 165);
  assert.equal(route.tollCents, 100);
  assert.deepEqual(
    route.waypoints.map((w) => w.citySlug),
    ["coronado", "penonome", "santiago"],
  );
});

test("le sens inverse marche aussi, avec ses propres cumuls", () => {
  const route = buildRoute("david", "las-tablas");
  assert.ok(route);
  assert.equal(route.distanceKm, 295);
  assert.deepEqual(
    route.waypoints.map((w) => w.citySlug),
    ["david", "santiago", "chitre", "las-tablas"],
  );
});

test("mêmes villes, ville inconnue ou champ vide : pas de ruta", () => {
  assert.equal(buildRoute("david", "david"), null);
  assert.equal(buildRoute("", "david"), null);
  assert.equal(buildRoute("david", "narnia"), null);
});

test("chaque paire de villes desservies a une ruta — aucune n'est « cerrada »", () => {
  const slugs = [
    "panama-city",
    "la-chorrera",
    "coronado",
    "penonome",
    "santiago",
    "david",
    "chitre",
    "las-tablas",
  ];
  for (const a of slugs) {
    for (const b of slugs) {
      if (a === b) continue;
      const route = buildRoute(a, b);
      assert.ok(route, `${a} → ${b} doit avoir une ruta`);
      assert.ok(route.distanceKm > 0);
      assert.equal(route.waypoints[0].citySlug, a);
      assert.equal(route.waypoints.at(-1)!.citySlug, b);
      // Le croisement n'est pas une parada.
      assert.ok(route.waypoints.every((w) => w.citySlug !== "divisa"));
    }
  }
});
