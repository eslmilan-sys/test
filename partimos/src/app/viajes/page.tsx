import type { Metadata } from "next";
import { Container } from "@/components/site/Section";
import { RutaCard } from "@/components/home/Rutas";
import { ButtonLink } from "@/components/ui/Button";
import { CORRIDORS } from "@/lib/corridors";
import { canonical } from "@/lib/site";

export const metadata: Metadata = {
  title: "Todas las rutas de carro compartido en Panamá",
  description:
    "Panamá al interior: Chitré, Las Tablas, David, Santiago, Penonomé y Coronado. Distancias, tiempos de camino y el aporte máximo por puesto en cada ruta.",
  alternates: { canonical: canonical("/viajes") },
};

export default function RutasPage() {
  const priority = CORRIDORS.filter((c) => c.isPriority);
  const rest = CORRIDORS.filter((c) => !c.isPriority);

  return (
    <>
      <main id="contenido">
        <div className="bg-plate-900 pt-10 pb-11 text-white">
          <Container>
            <h1 className="mb-4 max-w-[16ch] text-[clamp(32px,6.4vw,50px)] leading-[1.03] font-extrabold tracking-[-0.04em]">
              Las rutas que se mueven
            </h1>
            <p className="max-w-[54ch] text-[16.5px] leading-relaxed text-plate-300">
              Cada ruta tiene su página con los puntos de recogida habituales,
              el tope de aporte y quién sale en los próximos días.
            </p>
          </Container>
        </div>

        <div className="py-12 md:py-16">
          <Container>
            <h2 className="mb-4 text-xl font-bold">Las más frecuentes</h2>
            <div className="mb-11 grid gap-2.5 min-[640px]:grid-cols-2 min-[980px]:grid-cols-3">
              {priority.map((corridor) => (
                <RutaCard key={corridor.slug} slug={corridor.slug} />
              ))}
            </div>

            <h2 className="mb-4 text-xl font-bold">Otras rutas</h2>
            <div className="grid gap-2.5 min-[640px]:grid-cols-2 min-[980px]:grid-cols-3">
              {rest.map((corridor) => (
                <RutaCard key={corridor.slug} slug={corridor.slug} />
              ))}
            </div>

            <div className="mt-11 bg-plate-50 px-7 py-9">
              <h2 className="mb-3 max-w-[24ch] text-[clamp(22px,3.4vw,30px)] font-extrabold">
                ¿No está tu ruta?
              </h2>
              <p className="mb-6 max-w-[52ch] text-[15.5px] leading-relaxed text-plate-600">
                Busca tu origen y tu destino en el buscador: si todavía no hay
                nadie, guardamos la búsqueda y le avisamos a los conductores de
                esa zona. Así es como se abre un corredor nuevo.
              </p>
              <ButtonLink href="/#buscar" size="lg">
                Buscar mi ruta
              </ButtonLink>
            </div>
          </Container>
        </div>
      </main>
    </>
  );
}
