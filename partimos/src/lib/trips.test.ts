/**
 * INVARIANTS DES ARRÊTS INTERMÉDIAIRES, BOUT EN BOUT
 *
 * `segments.test.ts` teste la brique de calcul sur des données fabriquées.
 * Ici on teste le référentiel réel — les six corridors, leurs points de
 * passage — et la recherche qui s'appuie dessus. C'est là que les erreurs
 * coûtent cher : une distance cumulée fausse et R1 tombe sur tout un corridor
 * sans qu'aucun test unitaire ne bronche.
 */

import { test } from "node:test";
import assert from "node:assert/strict";

import { CORRIDORS, corridorsServing, getCorridor } from "./corridors.ts";
import { computePriceCap, RATE_PER_KM_CENTS } from "./pricing.ts";
import { findSegment, seatsTakenOnSegment, segmentCap } from "./segments.ts";
import { buildTripsFor, matchFor, searchTrips } from "./trips.ts";

/** Une date fixe et lointaine : aucun test ne doit dépendre de l'heure qu'il est. */
const DATE = "2031-03-14";

test("les points de passage sont ordonnés et strictement croissants", () => {
  for (const corridor of CORRIDORS) {
    const { waypoints: stops } = corridor;
    assert.ok(stops.length >= 2, `${corridor.slug} : au moins deux points`);

    for (let i = 1; i < stops.length; i++) {
      assert.ok(
        stops[i].km > stops[i - 1].km,
        `${corridor.slug} : ${stops[i].citySlug} doit être après ${stops[i - 1].citySlug}`,
      );
      assert.ok(
        stops[i].tollCents >= stops[i - 1].tollCents,
        `${corridor.slug} : les péages cumulés ne peuvent pas diminuer`,
      );
    }
  }
});

test("le dernier point de passage EST le corridor", () => {
  // Si les deux référentiels divergent, le prix affiché sur la page du
  // corridor et celui du trajet complet ne seraient plus le même montant.
  for (const corridor of CORRIDORS) {
    const first = corridor.waypoints[0];
    const last = corridor.waypoints[corridor.waypoints.length - 1];

    assert.equal(first.citySlug, corridor.origin.slug, corridor.slug);
    assert.equal(last.citySlug, corridor.destination.slug, corridor.slug);
    assert.equal(last.km - first.km, corridor.distanceKm, corridor.slug);
    assert.equal(
      last.tollCents - first.tollCents,
      corridor.tollCents,
      corridor.slug,
    );
  }
});

test("une paire desservie n'est pas forcément un corridor", () => {
  // Le cœur de la fonctionnalité : Penonomé → Santiago n'est le corridor de
  // personne, et pourtant deux corridors passent par les deux villes.
  const direct = CORRIDORS.some(
    (c) => c.origin.slug === "penonome" && c.destination.slug === "santiago",
  );
  assert.equal(direct, false);

  const serving = corridorsServing("penonome", "santiago");
  assert.ok(serving.length >= 2, "au moins Santiago et David passent par là");
});

test("on ne remonte jamais un corridor à contresens", () => {
  assert.deepEqual(corridorsServing("santiago", "penonome"), []);
  assert.deepEqual(corridorsServing("david", "panama-city"), []);
});

test("le prix d'un segment ne dépasse jamais celui du trajet entier", () => {
  for (const corridor of CORRIDORS) {
    const stops = corridor.waypoints;
    const whole = findSegment(
      stops,
      stops[0].citySlug,
      stops[stops.length - 1].citySlug,
    )!;

    for (let i = 0; i < stops.length; i++) {
      for (let j = i + 1; j < stops.length; j++) {
        const part = findSegment(stops, stops[i].citySlug, stops[j].citySlug)!;
        for (const seats of [1, 2, 3, 4]) {
          assert.ok(
            segmentCap(part, "standard", seats).maxPriceCents <=
              segmentCap(whole, "standard", seats).maxPriceCents,
            `${corridor.slug} : ${part.from.citySlug}→${part.to.citySlug} plus cher que le trajet complet`,
          );
        }
      }
    }
  }
});

test("R1 tient même quand le carro se remplit à chaque tronçon", () => {
  // Le cas le plus favorable au conducteur : chaque tronçon vendu au plafond,
  // à guichet fermé, sur tout le trajet. Il ne doit toujours pas rentrer dans
  // ses frais — sinon le découpage en segments deviendrait un moyen de gagner
  // de l'argent, et c'est exactement ce que R1 interdit.
  for (const corridor of CORRIDORS) {
    const stops = corridor.waypoints;

    for (const category of ["economy", "standard", "suv"] as const) {
      for (const seats of [1, 2, 3, 4]) {
        let revenue = 0;
        for (let i = 1; i < stops.length; i++) {
          const leg = findSegment(
            stops,
            stops[i - 1].citySlug,
            stops[i].citySlug,
          )!;
          revenue += segmentCap(leg, category, seats).maxPriceCents * seats;
        }

        const cost = computePriceCap(
          corridor.distanceKm,
          corridor.tollCents,
          category,
          seats,
        ).costTotalCents;

        assert.ok(
          revenue < cost,
          `${corridor.slug} ${category} ${seats} puestos : ${revenue} récupéré sur ${cost} de frais`,
        );
      }
    }
  }
});

test("les taux au kilomètre restent ordonnés", () => {
  // Un SUV consomme plus qu'une berline. Si l'ordre s'inverse, le plafond
  // punit la mauvaise catégorie de véhicule.
  assert.ok(RATE_PER_KM_CENTS.economy < RATE_PER_KM_CENTS.standard);
  assert.ok(RATE_PER_KM_CENTS.standard < RATE_PER_KM_CENTS.suv);
});

test("les arrêts déclarés sont un sous-ensemble ordonné du corridor", () => {
  for (const corridor of CORRIDORS) {
    for (const trip of buildTripsFor(corridor.slug, DATE)) {
      const stops = trip.servedStops;

      assert.equal(stops[0].citySlug, corridor.origin.slug);
      assert.equal(
        stops[stops.length - 1].citySlug,
        corridor.destination.slug,
        "un conducteur ne peut pas décider de ne pas arriver",
      );

      // Chaque arrêt déclaré existe sur le corridor, et l'ordre est conservé.
      let cursor = -1;
      for (const stop of stops) {
        const at = corridor.waypoints.findIndex(
          (w) => w.citySlug === stop.citySlug,
        );
        assert.ok(at > cursor, `${corridor.slug} : ${stop.citySlug} hors route`);
        cursor = at;
      }
    }
  }
});

test("aucun tronçon n'est jamais survendu", () => {
  for (const corridor of CORRIDORS) {
    for (const trip of buildTripsFor(corridor.slug, DATE)) {
      for (let leg = 0; leg < trip.servedStops.length - 1; leg++) {
        const taken = seatsTakenOnSegment(trip.holds, {
          fromIndex: leg,
          toIndex: leg + 1,
        });
        assert.ok(
          taken <= trip.seatsOffered,
          `${trip.id} : ${taken} réservations pour ${trip.seatsOffered} puestos`,
        );
      }
    }
  }
});

test("le trajet vu de bout en bout redonne exactement son prix affiché", () => {
  // La recherche et la page du trajet doivent afficher le même montant pour le
  // même trajet complet, sinon le passager croit à une erreur de prix.
  for (const corridor of CORRIDORS) {
    for (const trip of buildTripsFor(corridor.slug, DATE)) {
      const stops = trip.servedStops;
      const whole = findSegment(
        stops,
        stops[0].citySlug,
        stops[stops.length - 1].citySlug,
      )!;
      const match = matchFor(trip, whole)!;

      assert.equal(match.priceCents, trip.priceCents, trip.id);
      assert.equal(match.isPartial, false, trip.id);
      assert.equal(match.boardingAt, trip.departureAt, trip.id);
    }
  }
});

test("chercher Penonomé → Santiago renvoie des trajets d'autres corridors", () => {
  const matches = searchTrips("penonome", "santiago", DATE);
  assert.ok(matches.length > 0, "la recherche ne doit plus être vide");

  for (const match of matches) {
    assert.equal(match.segment.from.citySlug, "penonome");
    assert.equal(match.segment.to.citySlug, "santiago");
    assert.equal(match.isPartial, true, "personne ne PART de Penonomé ici");
    assert.ok(match.seatsFree >= 1);
    assert.ok(match.boardingAt > match.trip.departureAt, "on monte en chemin");
    assert.ok(match.priceCents < match.trip.priceCents, "on paie moins loin");

    const corridor = getCorridor(match.trip.corridorSlug)!;
    assert.notEqual(corridor.origin.slug, "penonome");
  }
});

test("les résultats sont triés par heure de montée, pas de départ", () => {
  const matches = searchTrips("coronado", "penonome", DATE);
  assert.ok(matches.length > 0);

  for (let i = 1; i < matches.length; i++) {
    assert.ok(matches[i].boardingAt >= matches[i - 1].boardingAt);
  }
});

test("un trajet plein sur son tronçon central reste réservable ailleurs", () => {
  // On fabrique le cas plutôt que d'attendre qu'il sorte du tirage : trois
  // puestos, tous pris entre Coronado et Penonomé, aucun avant ni après.
  const corridor = getCorridor("panama-david")!;
  const stops = corridor.waypoints;
  const trip = {
    ...buildTripsFor("panama-david", DATE)[0],
    servedStops: stops,
    seatsOffered: 3,
    holds: [{ fromIndex: 1, toIndex: 2, seats: 3 }],
  };

  const busy = findSegment(stops, "coronado", "penonome")!;
  assert.equal(matchFor(trip, busy)!.seatsFree, 0);

  const after = findSegment(stops, "santiago", "david")!;
  assert.equal(matchFor(trip, after)!.seatsFree, 3);

  const across = findSegment(stops, "panama-city", "david")!;
  assert.equal(across && matchFor(trip, across)!.seatsFree, 0);
});
