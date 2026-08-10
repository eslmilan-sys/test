import { Hero } from "@/components/home/Hero";
import { Pasos } from "@/components/home/Pasos";
import { Pago } from "@/components/home/Pago";
import { Conductores } from "@/components/home/Conductores";
import { Confianza } from "@/components/home/Confianza";
import { Corredores } from "@/components/home/Corredores";
import { DriverCta } from "@/components/home/DriverCta";
import { Faq, FaqJsonLd } from "@/components/home/Faq";
import { Historias } from "@/components/home/Historias";
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
        </div>

        {/* LE QUARTIER DE NUIT EST UNE SEULE TOILE.
            Historias et Pago partagent UN élément porteur du dégradé : deux
            sections peintes chacune de leur côté se raccordaient sur une
            couture visible — deux dégradés ne tombent jamais exactement sur
            le même pixel sur toute la largeur. Un seul fond ne peut pas se
            désaccorder avec lui-même.

            Le carrousel reste hors du ruban d'asphalte, qui lui passait
            dessus et coupait la première carte ; le ruban reprend à Pago. */}
        <div className="noche text-white">
          <Historias />
          <div className="road">
            <Pago />
          </div>
        </div>

        <div className="road">
          <Conductores />
          <Confianza />
          <Corredores />
          <DriverCta />
          <Faq items={GENERAL_FAQ} />
        </div>
      </main>
      <StickyCta />
      <FaqJsonLd items={GENERAL_FAQ} />
    </>
  );
}
