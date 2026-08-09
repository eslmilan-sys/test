"use client";

import { useEffect, useState } from "react";
import { ButtonLink } from "@/components/ui/Button";

/**
 * Barre d'action fixe en mobile. Elle n'apparaît qu'une fois le hero passé :
 * tant que le formulaire de recherche est à l'écran, une barre qui pointe
 * vers ce même formulaire ne ferait que masquer du contenu.
 *
 * `IntersectionObserver` plutôt qu'un écouteur de `scroll` : pas de calcul
 * de position à chaque image, donc aucun coût sur le fil principal.
 */
export function StickyCta({ watch = "#buscar" }: { watch?: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const target = document.querySelector(watch);
    if (!target || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0, rootMargin: "-80px 0px 0px 0px" },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [watch]);

  useEffect(() => {
    // Réserve la place de la barre pour qu'elle ne recouvre pas le pied de page.
    document.body.style.paddingBottom = visible ? "74px" : "";
    return () => {
      document.body.style.paddingBottom = "";
    };
  }, [visible]);

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 flex gap-2.5 border-t border-ink-200 bg-white px-4 pt-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] transition-transform duration-300 min-[900px]:hidden ${
        visible ? "translate-y-0" : "translate-y-[120%]"
      }`}
      // `inert` retire la barre repliée de la navigation clavier ET de l'arbre
      // d'accessibilité en une seule déclaration. `aria-hidden` seul ne suffit
      // pas : les liens resteraient focalisables, donc atteignables au clavier
      // tout en étant invisibles et inaudibles.
      inert={!visible}
    >
      <ButtonLink
        href="/publicar"
        variant="secondary"
        size="sm"
        className="basis-[42%]"
      >
        Publicar viaje
      </ButtonLink>
      <ButtonLink href="/#buscar" size="sm" className="flex-1">
        Buscar viaje
      </ButtonLink>
    </div>
  );
}
