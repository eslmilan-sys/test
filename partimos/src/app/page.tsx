import { Hero } from "@/components/home/Hero";
import { RutasFrecuentes } from "@/components/home/RutasFrecuentes";
import { Pasos } from "@/components/home/Pasos";
import { Pago } from "@/components/home/Pago";
import { Conductores } from "@/components/home/Conductores";
import { Confianza } from "@/components/home/Confianza";
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
        <Pasos />

        {/* UNE seule section de nuit sur la page. Le client a raison : deux
            écrans de bleu sombre à la suite, c'est un tunnel. Historias garde
            la nuit — ses photos et ses vitres en ont besoin — et Pago revient
            à la lumière, où ses cartes blanches (Yappy, efectivo) sont chez
            elles. */}
        <Historias />
        <Pago />
        <Conductores />
        <Confianza />
        <RutasFrecuentes />
        <DriverCta />
        {/* QUATRE QUESTIONS, PAS ONZE. L'accueil doit convaincre, pas tout
            expliquer : onze réponses ouvertes, c'est un mur de texte au
            moment où la personne veut chercher un viaje. Les autres vivent
            dans /ayuda, où on va quand on a vraiment une question — et le
            balisage FAQ pour Google garde la liste complète. */}
        <Faq items={GENERAL_FAQ.slice(0, 4)} />
      </main>
      <StickyCta />
      <FaqJsonLd items={GENERAL_FAQ} />
    </>
  );
}
