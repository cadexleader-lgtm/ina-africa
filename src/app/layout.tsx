import type { Metadata, Viewport } from "next";
import { Inter, Manrope } from "next/font/google";

import { DevPreviewBanner } from "@/components/site/DevPreviewBanner";
import { ORG } from "@/content/fr/site";
import { pageRobots } from "@/lib/seo/indexing";

import "@/styles/globals.css";

// Polices auto-hébergées par next/font (aucune requête vers Google côté visiteur).
const manrope = Manrope({ subsets: ["latin"], display: "swap", variable: "--font-manrope" });
const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" });

function siteUrl(): URL | undefined {
  const value = process.env.NEXT_PUBLIC_SITE_URL;
  if (!value) return undefined;
  try {
    return new URL(value);
  } catch {
    return undefined;
  }
}

export const metadata: Metadata = {
  metadataBase: siteUrl(),
  title: {
    default: `${ORG.name} — ${ORG.fullName}`,
    template: `%s — ${ORG.name}`,
  },
  description: `Site de l'ONG ${ORG.name} (${ORG.fullName}), au Bénin.`,
  applicationName: ORG.name,
  // Indexation pilotée par SITE_INDEXABLE (src/lib/seo/indexing.ts) : noindex tant que le site n'est pas en ligne.
  robots: pageRobots(),
};

export const viewport: Viewport = {
  themeColor: "#17465a", // = jeton brand (src/styles/globals.css) : la balise meta ne lit pas les variables CSS
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${manrope.variable} ${inter.variable}`}>
      <body>
        <DevPreviewBanner />
        {children}
      </body>
    </html>
  );
}
