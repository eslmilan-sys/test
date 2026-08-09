import Link from "next/link";
import {
  Section,
  Eyebrow,
  SectionTitle,
  Lead,
} from "@/components/site/Section";
import { Icon, type IconName } from "@/components/ui/Icon";

export const TRUST_ITEMS: { icon: IconName; title: string; body: string }[] = [
  {
    icon: "id",
    title: "Cédula verificada",
    body: "Un proveedor certificado confirma la identidad. Nosotros no guardamos las fotos, solo el resultado.",
  },
  {
    icon: "star",
    title: "Calificaciones de ida y vuelta",
    body: "Conductores y pasajeros se califican. El historial se queda en el perfil y lo ves antes de reservar.",
  },
  {
    icon: "users",
    title: "Modo solo mujeres",
    body: "Las conductoras pueden ofrecer viajes únicamente para mujeres. Las pasajeras pueden filtrar solo esos.",
  },
  {
    icon: "pin",
    title: "Comparte tu viaje",
    body: "Manda tu ubicación en vivo a quien tú quieras mientras vas en camino, y avisa automático al llegar.",
  },
];

export function TrustCard({
  icon,
  title,
  body,
}: {
  icon: IconName;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-[18px] border border-ink-200 bg-white p-5.5 transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-accent">
      <span className="mb-3.5 flex size-10.5 items-center justify-center rounded-xl bg-ink-50 text-ink-900">
        <Icon name={icon} className="size-5.5" />
      </span>
      <h3 className="mb-1.5 font-display text-[16.5px] font-bold tracking-[-0.015em]">
        {title}
      </h3>
      <p className="text-sm leading-relaxed text-ink-500">{body}</p>
    </div>
  );
}

export function Confianza() {
  return (
    <Section id="seguridad" stop stopRing="#F2F7F9" className="bg-ink-50">
      <Eyebrow>Confianza y seguridad</Eyebrow>
      <SectionTitle>Sabes con quién viajas antes de subirte</SectionTitle>
      <Lead>
        La carretera se hace larga con un desconocido. Por eso todo el mundo
        aquí tiene nombre, cara y respaldo.
      </Lead>

      <div className="mt-9 grid gap-3.5 min-[680px]:grid-cols-2 min-[1000px]:grid-cols-4">
        {TRUST_ITEMS.map((item) => (
          <TrustCard key={item.title} {...item} />
        ))}
      </div>

      <Link
        href="/seguridad"
        className="mt-6 inline-flex items-center gap-2 font-semibold text-accent-ink hover:underline"
      >
        Cómo cuidamos cada viaje
        <Icon name="arrowRight" className="size-4.5" />
      </Link>
    </Section>
  );
}
