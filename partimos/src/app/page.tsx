import { Hero } from "@/components/home/Hero";
import { Pasos } from "@/components/home/Pasos";
import { Pago } from "@/components/home/Pago";
import { Conductores } from "@/components/home/Conductores";
import { Confianza } from "@/components/home/Confianza";
import { Rutas } from "@/components/home/Rutas";
import { DriverCta } from "@/components/home/DriverCta";
import { Faq, FaqJsonLd } from "@/components/home/Faq";
import { StickyCta } from "@/components/StickyCta";
import { GENERAL_FAQ } from "@/lib/content";
import { canonical } from "@/lib/site";

export const metadata = {
  alternates: { canonical: canonical("/") },
};

export default function Home() {
  return (
    <>
      <main id="contenido">
        <Hero />
        {/* `road` porte le ruban d'asphalte : une seule route continue qui
            traverse toutes les sections, chacune marquée d'une parada. */}
        <div className="road">
          <Pasos />
          <Pago />
          <Conductores />
          <Confianza />
          <Rutas />
          <DriverCta />
          <Faq items={GENERAL_FAQ} />
        </div>
      </main>
      <StickyCta />
      <FaqJsonLd items={GENERAL_FAQ} />
    </>
  );
}
