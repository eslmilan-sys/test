import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import { Gabarito, Nunito_Sans } from "next/font/google";
import { Nav } from "@/components/site/Nav";
import { PageView } from "@/components/site/PageView";
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
const gabarito = Gabarito({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800", "900"],
  variable: "--font-gabarito",
  display: "swap",
});

const nunito = Nunito_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  variable: "--font-nunito",
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
      "Te recogen cerca, vas sentado todo el camino y pagas como prefieras: Yappy, tarjeta o efectivo. El aporte le llega completo al conductor.",
    url: canonical("/"),
  },
  twitter: {
    card: "summary_large_image",
    title: "Partimos — Alguien ya va para allá",
    description:
      "Te recogen cerca, vas sentado todo el camino y pagas como prefieras: Yappy, tarjeta o efectivo. El aporte le llega completo al conductor.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  /* Doit être le fond réel de la page : sur Android, la barre du navigateur
     prend cette couleur et un bleu résiduel d'une ancienne palette faisait un
     bandeau qui n'existe nulle part sur le site. */
  themeColor: "#faf9f7",
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
    <html lang="es-PA" className={`${gabarito.variable} ${nunito.variable}`}>
      <body>
        <a
          href="#contenido"
          className="absolute top-2 left-[-999px] z-[200] rounded-lg bg-ink-900 px-4 py-2.5 text-white focus:left-3"
        >
          Saltar al contenido
        </a>
        {/* LA LENTILLE LIQUIDE. Un bruit très basse fréquence déplace de
            quelques pixels ce que les vitres floutent : l'ondulation d'une
            épaisseur d'eau, pas une déformation. Le filtre n'est référencé
            que par `backdrop-filter: url(#liquid-lens)` — les navigateurs
            qui ne le lisent pas gardent le flou net, par la cascade CSS.
            `seed` figé : la même eau à chaque visite. */}
        <svg aria-hidden width="0" height="0" style={{ position: "absolute" }}>
          <filter id="liquid-lens">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.008 0.014"
              numOctaves="2"
              seed="7"
              result="ruido"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="ruido"
              scale="14"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </svg>

        <SessionProvider>
          <Nav />
          {children}
          <Footer />
          {/* La mesure : muette sans Supabase, jamais bloquante. */}
          <Suspense fallback={null}>
            <PageView />
          </Suspense>
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
