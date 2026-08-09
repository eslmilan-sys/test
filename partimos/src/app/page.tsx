import { Lamina } from "@/components/home/Lamina";
import { LiveStrip } from "@/components/home/LiveStrip";
import { Corredores } from "@/components/home/Corredores";
import { Pago } from "@/components/home/Pago";
import { Historias } from "@/components/home/Historias";
import { DriverCta } from "@/components/home/DriverCta";
import { Faq, FaqJsonLd } from "@/components/home/Faq";
import { StickyCta } from "@/components/StickyCta";
import { GENERAL_FAQ } from "@/lib/content";
import { canonical } from "@/lib/site";

export const metadata = {
  alternates: { canonical: canonical("/") },
};

/**
 * ARCHITECTURE DE L'ACCUEIL
 *
 * Le canal principal est le SEO, et le SEO amène le PASSAGER : l'intention de
 * recherche « pasaje Panamá David » existe déjà, celle du conducteur n'existe
 * pas. L'accueil sert donc le passager d'abord, et convertit le conducteur à
 * travers la demande qu'il voit — pas dans une porte parallèle qui dilue le
 * message et le maillage.
 *
 * Sept sections sont devenues six, et la grille de quatre cartes a disparu :
 *
 *   1. LA PLANCHE      le tracé coté ; la recherche se fait dessus
 *   2. LE BANDEAU      ce qui vient d'être publié, en défilement continu
 *   3. LES CORRIDORS   un tableau comparable, pas six cartes identiques
 *   4. LE PAIEMENT     hors plateforme, dit sans détour
 *   5. LES HISTOIRES   le registre éditorial, pour ce qui se raconte
 *   6. PUBLIER         la conversion conducteur, nourrie par la demande
 *   7. LES QUESTIONS   ce qui bloque vraiment avant de réserver
 */
export default function Home() {
  return (
    <>
      <main id="contenido">
        <Lamina />
        <LiveStrip />
        <Corredores />
        <Pago />
        <Historias />
        <DriverCta />
        <Faq items={GENERAL_FAQ} />
      </main>
      <StickyCta />
      <FaqJsonLd items={GENERAL_FAQ} />
    </>
  );
}
