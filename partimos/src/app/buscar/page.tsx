import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchResults } from "./SearchResults";
import { canonical } from "@/lib/site";

export const metadata: Metadata = {
  title: "Buscar un viaje",
  description:
    "Quién sale hoy hacia el interior, a qué hora y cuánto se aporta. Reservar es gratis y le pagas directo al conductor.",
  alternates: { canonical: canonical("/buscar") },
  // Une page de résultats n'a rien d'indexable : son contenu dépend de
  // paramètres. Les pages corridor sont là pour le référencement.
  robots: { index: false, follow: true },
};

function ResultsSkeleton() {
  return (
    <div aria-hidden>
      <div className="border-b border-plate-200 bg-white py-3">
        <div className="mx-auto w-full max-w-[1120px] px-5">
          <div className="h-[62px] border-[1.5px] border-plate-200" />
        </div>
      </div>
      <div className="mx-auto w-full max-w-[1120px] px-5 pt-6">
        <div className="mb-4 h-[46px] bg-white" />
        <div className="mb-4 h-7 w-56 bg-white" />
        <div className="mb-5 h-[38px] w-64 rounded-full bg-white" />
        <div className="grid gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-[152px] bg-white" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function BuscarPage() {
  return (
    <main id="contenido" className="bg-plate-50 pb-16">
      {/* Le squelette reprend la HAUTEUR de ce qui va s'afficher : barre de
          recherche collante, en-tête, puis des cartes. Un gabarit vide de
          70 vh laissait le contenu « sauter » à l'arrivée — c'est exactement
          ce que mesure le CLS. */}
      <Suspense fallback={<ResultsSkeleton />}>
        <SearchResults />
      </Suspense>
    </main>
  );
}
