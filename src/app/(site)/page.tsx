import type { Metadata } from "next";

import { HomeAbout } from "@/components/home/HomeAbout";
import { HomeAreas } from "@/components/home/HomeAreas";
import { HomeCallToAction } from "@/components/home/HomeCallToAction";
import { HomeHero } from "@/components/home/HomeHero";
import { HomeImpact } from "@/components/home/HomeImpact";
import { HomeNews } from "@/components/home/HomeNews";
import { HomePartners } from "@/components/home/HomePartners";
import { HomeProjects } from "@/components/home/HomeProjects";
import { JsonLd } from "@/components/seo/JsonLd";
import { ORG, T } from "@/content/fr/site";
import { homeJsonLd } from "@/lib/seo/structured-data";
import { listLatestArticles } from "@/server/data/articles";
import { listHomeProjects } from "@/server/data/projects";
import { getSiteSettings, listActionAreas, listPartners } from "@/server/data/site";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const description = settings.heroText ?? settings.vision ?? `Site de l'ONG ${ORG.name} (${ORG.fullName}), au Bénin.`;
  return {
    title: { absolute: T.home.metaTitle },
    description,
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      locale: "fr_FR",
      siteName: ORG.name,
      title: T.home.metaTitle,
      description,
      url: "/",
    },
  };
}

/**
 * Accueil. Toutes les lectures sont mises en cache (`use cache`) : la page est
 * entièrement prérendue. Chaque section sans contenu est masquée ou affiche
 * un état vide honnête.
 */
export default async function HomePage() {
  const [settings, areas, projects, articles, partners] = await Promise.all([
    getSiteSettings(),
    listActionAreas(),
    listHomeProjects(3),
    listLatestArticles(3),
    listPartners(),
  ]);

  return (
    <>
      <JsonLd data={homeJsonLd(settings)} />
      <HomeHero settings={settings} />
      <HomeAbout settings={settings} />
      <HomeAreas areas={areas} />
      <HomeProjects projects={projects} />
      <HomeImpact settings={settings} />
      <HomeNews articles={articles} />
      <HomeCallToAction />
      <HomePartners partners={partners} />
    </>
  );
}
