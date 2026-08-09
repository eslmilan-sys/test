import Link from "next/link";
import {
  Section,
  SectionTitle,
  Lead,
} from "@/components/site/Section";
import { CORRIDORS, corridorCap } from "@/lib/corridors";
import { formatDuration, formatUsd } from "@/lib/pricing";
import { Icon } from "@/components/ui/Icon";

export function RutaCard({ slug }: { slug: string }) {
  const corridor = CORRIDORS.find((c) => c.slug === slug);
  if (!corridor) return null;
  const cap = corridorCap(corridor);

  return (
    <Link
      href={`/viajes/${corridor.slug}`}
      className="group flex items-center gap-3.5 border border-plate-200 px-4.5 py-4 transition-colors hover:border-ochre-500 hover:bg-plate-50"
    >
      <span className="min-w-0 flex-1">
        <b className="block text-[15.5px] font-bold tracking-[-0.015em]">
          {corridor.origin.shortName} → {corridor.destination.shortName}
        </b>
        <span className="cote text-[12.5px] text-plate-600">
          {corridor.distanceKm} km ·{" "}
          {formatDuration(corridor.typicalDurationMin)}
        </span>
      </span>
      <span className="shrink-0 text-right">
        <b className="cote block text-base font-bold">
          {formatUsd(cap.maxPriceCents, { compact: true })}
        </b>
        <span className="block text-[10.5px] tracking-wide text-plate-600 uppercase">
          Tope
        </span>
      </span>
      <Icon
        name="arrowRight"
        className="size-4.5 shrink-0 text-plate-300 transition-colors group-hover:text-ochre-600"
      />
    </Link>
  );
}

export function Rutas() {
  return (
    <Section id="rutas" stop>
      <SectionTitle>Las rutas que más se mueven</SectionTitle>
      <Lead>
        Cada ruta tiene su página: quién sale esta semana, por dónde recogen y
        hasta cuánto se puede aportar.
      </Lead>

      <div className="mt-8 grid gap-2.5 min-[640px]:grid-cols-2 min-[980px]:grid-cols-3">
        {CORRIDORS.map((corridor) => (
          <RutaCard key={corridor.slug} slug={corridor.slug} />
        ))}
      </div>

      <Link
        href="/viajes"
        className="mt-6 inline-flex items-center gap-2 font-semibold text-ochre-600 hover:underline"
      >
        Ver todas las rutas
        <Icon name="arrowRight" className="size-4.5" />
      </Link>
    </Section>
  );
}
