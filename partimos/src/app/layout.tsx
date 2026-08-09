import type { Metadata, Viewport } from "next";
import { Archivo, Martian_Mono } from "next/font/google";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { SessionProvider } from "@/lib/session";
import { SITE, canonical } from "@/lib/site";
import "./globals.css";

/**
 * Deux fontes, choisies comme des objets du monde de la planche.
 *
 * Archivo porte un axe de LARGEUR (62–125). C'est ce qui fait le lettrage de
 * dessin technique : un seul alphabet, dilaté pour les titres et les
 * cartouches, normal pour le texte courant. Une famille déclinée en largeur
 * plutôt que deux familles qui se disputent la page — c'est la discipline
 * d'une planche, et c'est une requête réseau de moins.
 *
 * Martian Mono ne sert QUE là où il y a une mesure : kilomètres, cotes,
 * montants, heures, stations. Le monospace n'est pas ici un costume
 * « technique » posé sur du texte ordinaire ; c'est la fonte des quantités.
 *
 * Auto-hébergées par next/font : le CSS est inliné, les fichiers servis depuis
 * notre domaine, et `adjustFontFallback` aligne les métriques du repli pour
 * qu'aucun décalage ne se voie au chargement.
 */
const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
});

const martian = Martian_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-martian",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "Partimos — Comparte el carro, comparte los gastos | Panamá",
    template: "%s | Partimos",
  },
  description: SITE.description,
  alternates: { canonical: canonical("/") },
  openGraph: {
    type: "website",
    siteName: SITE.name,
    locale: "es_PA",
    title: "Partimos — Alguien ya va para allá",
    description:
      "Viajes compartidos entre particulares en Panamá. Sin terminales, sin esperas.",
    url: canonical("/"),
  },
  twitter: {
    card: "summary_large_image",
    title: "Partimos — Alguien ya va para allá",
    description:
      "Viajes compartidos entre particulares en Panamá. Sin terminales, sin esperas.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0a2b25",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const DIRECTION_CONTRACT = `<!--
impeccable:direction 40d25342

THESIS: Le prix est une mesure, pas une promesse. Refuse le hero à champ de
recherche sur photo, les cartes blanches arrondies et l'accent bleu doux qui
sont le gabarit de la catégorie.

OWN-WORLD: La planche d'ingénierie du Canal. Vert-limon du Gatún #0a2b25 en
fond de présentation, ocre-rouge de la Culebra #e5762e en clé unique. Angles
vifs, filets, hachures pour l'occupé, cartouche encadré, trame de 48 px.
Archivo dilaté à 112 % pour le lettrage ; Martian Mono strictement réservé aux
quantités mesurées.

STORY: Le visiteur comprend que le plafond sort d'une distance réelle, croit
que personne ne peut le surfacturer, et tire deux stations pour chercher.

FIRST VIEWPORT: Profil en long de la Panaméricaine, plein cadre. Panamá station
0 à gauche, David 440 à droite, les villes en stations cotées. Deux poignées
sur le tracé : le segment s'allume en ocre et sa cote se résout dessous. Titre
en haut à gauche, cartouche de légende en bas à droite. L'action principale EST
le tracé.

FORM: Planche d'ingénierie — candidat 4 sur 7 de la liste classée par
résonance, graine 40d25342.

FINISH: unreviewed and undocumented is unfinished; this build ends with the
finish review, the verdict, and DESIGN.md
-->`;

const ORGANIZATION_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE.name,
  url: SITE.url,
  description: SITE.description,
  areaServed: { "@type": "Country", name: "Panamá" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-PA" className={`${archivo.variable} ${martian.variable}`}>
      <body>
        {/* Le contrat de direction, émis dans le markup et pas seulement dans
            la source : une décision de design qu'on ne peut pas auditer sur la
            page livrée n'engage personne. */}
        <div
          hidden
          dangerouslySetInnerHTML={{ __html: DIRECTION_CONTRACT }}
          suppressHydrationWarning
        />
        <a
          href="#contenido"
          className="absolute top-2 left-[-999px] z-[200] bg-plate-900 px-4 py-2.5 text-white focus:left-3"
        >
          Saltar al contenido
        </a>
        <SessionProvider>
          <Nav />
          {children}
          <Footer />
        </SessionProvider>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(ORGANIZATION_JSONLD),
          }}
        />
      </body>
    </html>
  );
}
