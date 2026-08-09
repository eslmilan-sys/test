import {
  Section,
  Eyebrow,
  SectionTitle,
  Lead,
} from "@/components/site/Section";
import { Icon, type IconName } from "@/components/ui/Icon";

const PASOS: { icon: IconName; title: string; body: string }[] = [
  {
    icon: "search",
    title: "Busca tu ruta",
    body: "Ves quién sale, a qué hora y por dónde pasa. Cada conductor marca los puntos donde puede recoger sin desviarse de su camino.",
  },
  {
    icon: "chat",
    title: "Reserva y coordinen",
    body: "Reservar no cuesta nada. Al confirmar te aparece el número del conductor, y entre ustedes afinan la hora y la esquina exacta.",
  },
  {
    icon: "car",
    title: "Viaja y aporta",
    body: "Le pagas a la persona el día del viaje, en efectivo o por Yappy. Al bajarte se califican los dos.",
  },
];

export function Pasos() {
  return (
    <Section id="como" stop>
      <Eyebrow>Cómo funciona</Eyebrow>
      <SectionTitle>Tres pasos y ya vas en camino</SectionTitle>
      <Lead>
        Alguien ya hizo el plan de manejar. Tú te sumas al carro y ponen los
        gastos entre los dos.
      </Lead>

      <ol className="mt-9 grid gap-3.5 min-[760px]:grid-cols-3 min-[760px]:gap-4.5">
        {PASOS.map((paso, index) => (
          <li
            key={paso.title}
            className="relative overflow-hidden rounded-[20px] bg-ink-50 p-6"
          >
            <span
              aria-hidden
              className="absolute top-3 right-4.5 font-display text-[52px] leading-none font-extrabold tracking-[-0.05em] text-transparent [-webkit-text-stroke:2px_var(--color-ink-200)]"
            >
              {index + 1}
            </span>
            <span className="mb-4 flex size-11.5 items-center justify-center rounded-[14px] bg-white text-ink-900 shadow-[0_3px_10px_rgb(14_42_53/0.07)]">
              <Icon name={paso.icon} className="size-[23px]" />
            </span>
            <h3 className="mb-2 font-display text-[19px] font-bold tracking-[-0.02em]">
              {paso.title}
            </h3>
            <p className="text-[14.5px] leading-relaxed text-ink-500">
              {paso.body}
            </p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
