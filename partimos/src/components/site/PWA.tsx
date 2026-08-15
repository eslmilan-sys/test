"use client";

import { useEffect } from "react";

/**
 * INSTALLER L'APP — l'enregistrement du service worker.
 *
 * Trois précautions, chacune payée par un bug classique :
 *
 *   1. On enregistre APRÈS le chargement (`load`), pas pendant : le
 *      service worker se met en concurrence avec le premier rendu, et sur
 *      un téléphone d'entrée de gamme ça se voit.
 *   2. On demande une VÉRIFICATION de mise à jour à chaque ouverture.
 *      Sans ça, iOS peut garder l'ancien worker des jours entiers —
 *      exactement le genre de cache qui nous a coûté une nuit.
 *   3. Quand une nouvelle version prend la main, on RECHARGE une seule
 *      fois. Le drapeau évite la boucle de rechargement infinie, qui est
 *      le piège numéro un de `controllerchange`.
 *
 * Le chemin est relatif à la page : sur une Page de projet le site vit
 * sous /test/partimos, et un chemin absolu « /sw.js » viserait la racine
 * du domaine, où il n'y a rien.
 */
export function PWA() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
    const registrar = () => {
      navigator.serviceWorker
        .register(`${base}/sw.js`, { scope: `${base}/` })
        .then((reg) => {
          /* Une ouverture de l'app = une vérification de version. */
          reg.update().catch(() => {});
        })
        .catch(() => {
          /* Pas de service worker (mode privé, réglage du téléphone) :
             le site marche exactement pareil, sans le hors-ligne. */
        });
    };

    if (document.readyState === "complete") registrar();
    else window.addEventListener("load", registrar, { once: true });

    /* LA PREMIÈRE INSTALLATION N'EST PAS UNE MISE À JOUR.
       Au tout premier chargement il n'y a aucun contrôleur ; le worker
       s'installe, réclame la page, et `controllerchange` se déclenche.
       Recharger là, c'est effacer ce que la personne vient de taper — à la
       première visite, celle qui compte le plus. On ne recharge donc que
       s'il y avait DÉJÀ un contrôleur : ça, c'est une vraie nouvelle
       version. */
    const habiaControlador = Boolean(navigator.serviceWorker.controller);
    let recargando = false;
    const alCambiar = () => {
      if (!habiaControlador || recargando) return;
      recargando = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", alCambiar);
    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", alCambiar);
      window.removeEventListener("load", registrar);
    };
  }, []);

  return null;
}
