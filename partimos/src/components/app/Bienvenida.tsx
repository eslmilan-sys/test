"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Logo } from "@/components/site/Logo";

/**
 * L'ÉCRAN DE BIENVENUE — plein écran, une seule fois par ouverture.
 *
 * Ce qu'il fait de vrai, et qui justifie qu'il existe : il couvre le
 * moment où l'app se réveille. Une PWA installée sur iOS ouvre sur du
 * blanc pendant que le JavaScript s'hydrate — l'écran le plus long de
 * l'app est aujourd'hui un écran vide. On y met le nom de la personne au
 * lieu de rien.
 *
 * TROIS RÈGLES QU'IL RESPECTE, parce qu'un écran de démarrage mal fait
 * est juste du temps volé :
 *
 *   · IL NE RETARDE RIEN. 1,4 s, l'app est derrière, déjà rendue et déjà
 *     interactive — un toucher le traverse.
 *   · IL NE REVIENT PAS. Une fois par session : le revoir à chaque
 *     navigation le transformerait en péage.
 *   · IL SAUTE si les animations sont désactivées, ou s'il n'y a pas de
 *     nom — « ¡Bienvenido de vuelta! » sans nom n'apprend rien.
 */

const VU = "partimos.bienvenida-vista";

/**
 * LA DÉCISION SE PREND UNE FOIS, HORS DE REACT.
 *
 * Elle lit deux systèmes extérieurs — `sessionStorage` et `matchMedia` —
 * ce qui interdit les deux autres chemins : pendant le rendu, la règle de
 * pureté du compilateur l'refuse ; depuis un effet, c'est un `setState`
 * en cascade, qu'il refuse aussi. `useSyncExternalStore` est fait pour
 * exactement ça.
 *
 * Le résultat est mémorisé au niveau du module : deux lectures sans
 * changement doivent rendre la MÊME valeur, sinon React reboucle.
 */
let decidido: boolean | null = null;

function decidir(): boolean {
  if (decidido !== null) return decidido;
  let yaVisto = true;
  try {
    yaVisto = window.sessionStorage.getItem(VU) === "1";
  } catch {
    /* stockage refusé (mode privé) : on le montre. Une fois de trop vaut
       mieux qu'un écran blanc. */
    yaVisto = false;
  }
  const sinMovimiento = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  decidido = !yaVisto && !sinMovimiento;
  return decidido;
}

const suscribir = () => () => {};
const enServidor = () => false;

export function Bienvenida({ nombre }: { nombre: string | null }) {
  const puedeMostrarse = useSyncExternalStore(suscribir, decidir, enServidor);
  const [cerrado, setCerrado] = useState(false);

  const visible = Boolean(nombre) && puedeMostrarse && !cerrado;

  /* Marquer comme vu est une ÉCRITURE dans un système extérieur : c'est
     précisément le métier d'un effet. */
  useEffect(() => {
    if (!visible) return;
    try {
      window.sessionStorage.setItem(VU, "1");
    } catch {
      /* sans stockage, il reparaîtra à la prochaine ouverture. Acceptable. */
    }
    const t = window.setTimeout(() => setCerrado(true), 1400);
    return () => window.clearTimeout(t);
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      /* `aria-hidden` : pour un lecteur d'écran c'est un habillage. Le
         contenu réel est déjà derrière, et l'annoncer ferait perdre la
         place dans la page. */
      aria-hidden
      onClick={() => setCerrado(true)}
      className="bienvenida fixed inset-0 z-[200] flex flex-col items-center justify-center bg-verde-perfil px-8 text-white"
    >
      {/* Le logo est un lien vers l'accueil ; ici il ne doit mener nulle
          part — l'écran se ferme tout seul. */}
      <div className="bienvenida-marca pointer-events-none">
        <Logo gradientId="brand-bienvenida" dotColor="#1f4d2e" />
      </div>
      <p className="bienvenida-linea mt-7 text-[15px] font-semibold text-white/70">
        ¡Bienvenido de vuelta!
      </p>
      <p className="bienvenida-nombre font-display text-[38px] leading-tight font-extrabold tracking-[-0.035em]">
        {nombre}
      </p>
    </div>
  );
}
