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
    "¿Vas al interior este fin de semana? Publica los puestos vacíos de tu carro y recupera parte de la gasolina y los peajes. El aporte te llega completo.",
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
        {/* LA PAGE COMMENCE PAR LE CHIFFRE.
            On y arrive avec UNE question — « combien je récupère ? » — et
            on tombait sur quatre écrans d'explications avant la calculette.
            Elle passe donc en haut, à côté du titre, avec les mêmes couleurs
            que l'accueil : le même ambre sur le même titre en trois temps,
            pour que la page ne ressemble pas à un autre site. */}
        <div className="relative cima-app overflow-hidden pt-9 pb-12">
          {/* La lueur ambre de la maison, la même que sous la carte de
              recherche de l'accueil. */}
          <span
            aria-hidden
            className="pointer-events-none absolute -top-16 -left-10 size-56 rotate-[10deg] rounded-[40px] bg-[linear-gradient(135deg,#fde68a,#f59e0b_58%,#d97706)] opacity-25 blur-2xl"
          />
          <Container className="relative">
            <div className="grid items-start gap-8 min-[960px]:grid-cols-[1.05fr_1fr] min-[960px]:gap-12">
              <div>
                <p className="glass mb-5 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[12.5px] font-semibold text-ink-600">
                  <span className="font-display font-bold tracking-wide text-action-deep uppercase">
                    Conductores
                  </span>
                  El viaje ya lo ibas a hacer
                </p>
                <h1 className="mb-5 overflow-hidden text-[clamp(32px,6.4vw,52px)] leading-[1.02] font-extrabold tracking-[-0.04em]">
                  <span className="linea">
                    <em className="text-action-deep not-italic">Maneja</em>{" "}
                    igual.
                  </span>
                  <span className="linea linea-2">Gasta la mitad.</span>
                  <span className="linea linea-3">
                    <em className="text-action-deep not-italic">Comparte</em> el
                    camino.
                  </span>
                </h1>
                <p className="max-w-[48ch] text-[16.5px] leading-[1.38] font-light text-ink-600 md:text-[18px]">
                  No ganas dinero manejando: recuperas parte de lo que ibas a
                  gastar igual. La gasolina cuesta lo mismo vayas solo o
                  acompañado — la diferencia es con quién.
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <ButtonLink href="/publicar/nuevo" size="lg">
                    Quiero proponer un viaje
                  </ButtonLink>
                  <ButtonLink href="#como" variant="secondary" size="lg">
                    Cómo funciona
                  </ButtonLink>
                </div>
              </div>

              {/* LA CALCULETTE, en haut et avec le choix des villes :
                  personne ne sait de tête que Panamá → Chitré fait 250 km. */}
              <div id="calculadora" className="scroll-mt-24">
                <Calculadora conRuta />
                <ButtonLink
                  href="/publicar/nuevo"
                  size="lg"
                  className="mt-3 w-full"
                >
                  Proponer este viaje
                </ButtonLink>
              </div>
            </div>
          </Container>
        </div>

        <div>
          <section id="como" className="scroll-mt-24 py-12 md:py-16">
            <Container>
              <h2 className="mb-8 max-w-[20ch] text-[clamp(24px,4vw,34px)] font-extrabold">
                Publicar toma menos de un minuto
              </h2>
              <ol className="grid gap-3.5 min-[680px]:grid-cols-2 min-[1000px]:grid-cols-4">
                {STEPS.map((step, index) => (
                  <li
                    key={step.title}
                    className="relative overflow-hidden rounded-[20px] border border-ink-200 p-5.5"
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

          {/* LA SÉCURITÉ DU COBRO, côté conducteur d'abord : c'est lui
              qu'il faut convaincre — sans carros publiés il n'y a pas de
              plateforme. Quatre garanties concrètes, pas des slogans. */}
          <section className="py-12 md:py-16">
            <Container>
              <h2 className="mb-2 max-w-[22ch] text-[clamp(24px,4vw,34px)] font-extrabold">
                El cobro, asegurado antes de salir
              </h2>
              <p className="mb-8 max-w-[58ch] text-[15px] leading-relaxed text-ink-500">
                Manejar ya es poner el carro, la gasolina y el volante. Cobrar
                no debería ser otro trabajo.
              </p>
              <div className="grid gap-3.5 min-[680px]:grid-cols-2 min-[1000px]:grid-cols-4">
                <div className="rounded-[20px] border border-ink-200 p-5.5">
                  <span className="mb-3.5 flex size-10.5 items-center justify-center rounded-xl bg-ink-50 text-ink-900">
                    <Icon name="shield" className="size-5.5" />
                  </span>
                  <h3 className="mb-1.5 font-display text-[16.5px] font-bold">
                    Sales con el cobro ya hecho
                  </h3>
                  <p className="text-sm leading-relaxed text-ink-500">
                    Si el pasajero pagó en la app, su aporte quedó cobrado al
                    confirmar el puesto. No hay «te pago llegando», no hay
                    vueltos, no hay excusas.
                  </p>
                </div>
                <div className="rounded-[20px] border border-ink-200 p-5.5">
                  <span className="mb-3.5 flex size-10.5 items-center justify-center rounded-xl bg-ink-50 text-ink-900">
                    <Icon name="cash" className="size-5.5" />
                  </span>
                  <h3 className="mb-1.5 font-display text-[16.5px] font-bold">
                    Tu aporte llega completo
                  </h3>
                  <p className="text-sm leading-relaxed text-ink-500">
                    La tarifa de servicio la paga el pasajero que elige el
                    cobro en la app — de lo tuyo no se descuenta nada, nunca.
                    Y si no viaja, las reglas de cancelación te cubren.
                  </p>
                </div>
                <div className="rounded-[20px] border border-ink-200 p-5.5">
                  <span className="mb-3.5 flex size-10.5 items-center justify-center rounded-xl bg-ink-50 text-ink-900">
                    <Icon name="check" className="size-5.5" />
                  </span>
                  <h3 className="mb-1.5 font-display text-[16.5px] font-bold">
                    Tú eliges cómo te pagan
                  </h3>
                  <p className="text-sm leading-relaxed text-ink-500">
                    En la app siempre; Yappy directo y efectivo, solo si tú los
                    aceptas. Puedes manejar «solo por la app» y no tocar plata
                    en todo el viaje.
                  </p>
                </div>
                <div className="rounded-[20px] border border-ink-200 p-5.5">
                  <span className="mb-3.5 flex size-10.5 items-center justify-center rounded-xl bg-ink-50 text-ink-900">
                    <Icon name="id" className="size-5.5" />
                  </span>
                  <h3 className="mb-1.5 font-display text-[16.5px] font-bold">
                    Sabes a quién llevas
                  </h3>
                  <p className="text-sm leading-relaxed text-ink-500">
                    Nadie reserva sin cédula verificada. Ves el perfil y las
                    calificaciones antes de aceptar, y hablan por el chat de la
                    reserva — sin dar tu celular a nadie.
                  </p>
                </div>
              </div>
              <p className="mt-5 max-w-[70ch] text-[13.5px] leading-relaxed text-ink-500">
                ¿Y el pasajero? Las mismas garantías al revés: cobro protegido
                con la tarifa a la vista, comprobante, reembolso según las
                reglas de cancelación — y jamás le pedimos la tarjeta fuera de
                la app.
              </p>
            </Container>
          </section>

          <section
            id="tope"
            className="scroll-mt-24 bg-ink-50 py-12 md:py-16"
          >
            <Container>
              <div className="grid gap-9 min-[900px]:grid-cols-[1.04fr_0.96fr] min-[900px]:items-start min-[900px]:gap-12">
                <Calculadora conRuta />
                <div>
                  <h2 className="mb-4 max-w-[20ch] text-[clamp(24px,4vw,34px)] font-extrabold">
                    Por qué hay un tope
                  </h2>
                  <div className="max-w-[50ch] space-y-4 text-[15px] leading-relaxed text-ink-500">
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

                  <div className="mt-6 rounded-[20px] border border-ink-200 bg-white px-5 py-4.5">
                    <p className="text-[14.5px] leading-relaxed text-ink-500">
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
                <ButtonLink href="/ya" size="lg">
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
