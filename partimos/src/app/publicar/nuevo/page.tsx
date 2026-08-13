import type { Metadata } from "next";
import { Suspense } from "react";
import { PublishFlowKeyed } from "./PublishFlow";
import { canonical } from "@/lib/site";

export const metadata: Metadata = {
  title: "Publicar un viaje",
  description:
    "Cuatro pasos: la ruta, las paradas, la hora y los puestos, el aporte. Menos de un minuto.",
  alternates: { canonical: canonical("/publicar/nuevo") },
  robots: { index: false, follow: true },
};

export default function NuevoViajePage() {
  return (
    <main id="contenido" className="bg-ink-50 pb-16">
      <Suspense fallback={<div className="min-h-[70vh]" />}>
        <PublishFlowKeyed />
      </Suspense>
    </main>
  );
}
