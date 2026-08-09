import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Instrument_Sans } from "next/font/google";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { SessionProvider } from "@/lib/session";
import { SITE, canonical } from "@/lib/site";
import "./globals.css";

/**
 * Polices auto-hébergées par next/font : le CSS est inliné et les fichiers
 * servis depuis notre domaine. On supprime deux allers-retours vers Google
 * (fonts.googleapis + fonts.gstatic) sur le chemin critique, et `adjustFontFallback`
 * aligne les métriques de la police de repli pour qu'il n'y ait aucun décalage
 * visuel au chargement. C'est le principal levier Lighthouse de cette page.
 */
const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-bricolage",
  display: "swap",
});

const instrument = Instrument_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-instrument",
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
  themeColor: "#0E2A35",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

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
    <html
      lang="es-PA"
      className={`${bricolage.variable} ${instrument.variable}`}
    >
      <body>
        <a
          href="#contenido"
          className="absolute top-2 left-[-999px] z-[200] rounded-lg bg-ink-900 px-4 py-2.5 text-white focus:left-3"
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
