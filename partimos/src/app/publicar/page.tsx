import type { Metadata } from "next";
import { Container } from "@/components/site/Section";
import { Calculadora } from "@/components/Calculadora";
import { ButtonLink } from "@/components/ui/Button";
import { Icon, type IconName } from "@/components/ui/Icon";
import { RutaCard } from "@/components/home/Rutas";
import { CORRIDORS } from "@/lib/corridors";
import { canonical } from "@/lib/site";

export const metadata: Metadata = {
  title: "Publica tu viaje y comparte los gastos",
  description:
    "¿Vas al interior este fin de semana? Publica los puestos vacíos de tu carro y recupera parte de la gasolina y los peajes. Sin comisión: el aporte te llega completo.",
  alternates: { canonical: canonical("/publicar") },
};

const STEPS: { icon: IconName; title: string; body: string }[] = [
  {
    icon: "route",
    title: "Marca tu ruta",
    body: "De dónde sales, a dónde vas y por qué puntos ya ibas a pasar. Máximo cuatro paradas, ninguna en terminal.",
  },
  {
    icon: "clock",
    title: "Pon la hora y los puestos",
    body: "Tú decides a qué hora sales y cuántos puestos ofreces. Nadie te asigna un viaje ni te cambia el recorrido.",
  },
  {
    icon: "cash",
    title: "Elige el aporte",
    body: "La app calcula el tope según tu carro y la distancia. Puedes pedir menos; más no se puede.",
  },
  {
    icon: "users",
    title: "Acepta a quién llevas",
    body: "Ves el perfil, la verificación y las calificaciones de cada persona antes de confirmarle el puesto.",
  },
];

export default function PublicarPage() {
  return (
    <>
      <main id="contenido">
        <div className="noche pt-10 pb-11 text-white">
          <Container>
            <h1 className="mb-4 max-w-[16ch] text-[clamp(32px,6.4vw,52px)] leading-[1.02] font-extrabold tracking-[-0.04em]">
              El viaje ya lo ibas a hacer
            </h1>
            <p className="max-w-[54ch] text-[16.5px] leading-relaxed text-night-200">
              No ganas dinero manejando: recuperas parte de lo que ibas a gastar
              igual. La gasolina cuesta lo mismo vayas solo o acompañado.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <ButtonLink href="#calculadora" variant="onDark" size="lg">
                Calcular mi aporte
              </ButtonLink>
            </div>
          </Container>
        </div>

        <div>
          <section className="py-12 md:py-16">
            <Container>
              <h2 className="mb-8 max-w-[20ch] text-[clamp(24px,4vw,34px)] font-extrabold">
                Publicar toma menos de un minuto
              </h2>
              <ol className="grid gap-3.5 min-[680px]:grid-cols-2 min-[1000px]:grid-cols-4">
                {STEPS.map((step, index) => (
                  <li
                    key={step.title}
                    className="relative overflow-hidden rounded-[18px] border border-ink-200 p-5.5"
                  >
                    <span
                      aria-hidden
                      className="absolute top-3 right-4 font-display text-[40px] leading-none font-extrabold text-transparent [-webkit-text-stroke:2px_var(--color-ink-200)]"
                    >
                      {index + 1}
                    </span>
                    <span className="mb-3.5 flex size-10.5 items-center justify-center rounded-xl bg-ink-50 text-ink-900">
                      <Icon name={step.icon} className="size-5.5" />
                    </span>
                    <h3 className="mb-1.5 font-display text-[16.5px] font-bold">
                      {step.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-ink-500">
                      {step.body}
                    </p>
                  </li>
                ))}
              </ol>
            </Container>
          </section>

          <section
            id="calculadora"
            className="scroll-mt-24 bg-ink-50 py-12 md:py-16"
          >
            <Container>
              <div className="grid gap-9 min-[900px]:grid-cols-[1.04fr_0.96fr] min-[900px]:items-start min-[900px]:gap-12">
                <Calculadora />
                <div>
                  <h2 className="mb-4 max-w-[20ch] text-[clamp(24px,4vw,34px)] font-extrabold">
                    Por qué hay un tope
                  </h2>
                  <div className="max-w-[50ch] space-y-4 text-[15.5px] leading-relaxed text-ink-500">
                    <p>
                      Compartir los gastos de un viaje que ya ibas a hacer es
                      una cosa. Cobrar un pasaje es otra, y para eso hace falta
                      un permiso de transporte que ni tú ni nosotros tenemos.
                    </p>
                    <p>
                      La diferencia se sostiene en un detalle del cálculo: el
                      costo del recorrido se divide entre{" "}
                      <b className="font-semibold text-ink-900">
                        los puestos que ofreces más uno
                      </b>
                      . Ese «uno» eres tú. Por eso, aunque lleves el carro
                      lleno, siempre terminas poniendo una parte.
                    </p>
                    <p>
                      El tope no es una sugerencia de la pantalla: está escrito
                      en la base de datos. Un viaje por encima del tope,
                      sencillamente, no se puede guardar.
                    </p>
                  </div>

                  <div className="mt-6 rounded-[18px] border border-ink-200 bg-white px-5 py-4.5">
                    <p className="text-[14px] leading-relaxed text-ink-500">
                      <b className="font-semibold text-ink-900">
                        Si alguien te pide un desvío
                      </b>
                      <br />
                      No se cobra un extra por recogerlo: lo que cambia es la
                      distancia. Esos kilómetros de más los asume quien los
                      pidió, nunca tú. Y si el desvío pasa de 15 % de
                      kilometraje o de 15 minutos, la app no lo permite.
                    </p>
                  </div>
                </div>
              </div>
            </Container>
          </section>

          <section className="py-12 md:py-16">
            <Container>
              <h2 className="mb-5 font-display text-xl font-bold">
                Rutas con gente esperando
              </h2>
              <div className="grid gap-2.5 min-[640px]:grid-cols-2 min-[980px]:grid-cols-3">
                {CORRIDORS.filter((c) => c.isPriority).map((corridor) => (
                  <RutaCard key={corridor.slug} slug={corridor.slug} />
                ))}
              </div>

              <div className="mt-9 flex flex-wrap gap-3">
                <ButtonLink href="/#buscar" size="lg">
                  Publicar mi viaje
                </ButtonLink>
                <ButtonLink href="/ayuda" variant="secondary" size="lg">
                  Preguntas frecuentes
                </ButtonLink>
              </div>
            </Container>
          </section>
        </div>
      </main>
    </>
  );
}
