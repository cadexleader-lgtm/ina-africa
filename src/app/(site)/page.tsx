import type { Metadata } from "next";

import { HomeAbout } from "@/components/home/HomeAbout";
import { HomeAchievements } from "@/components/home/HomeAchievements";
import { HomeAreas } from "@/components/home/HomeAreas";
import { HomeCallToAction } from "@/components/home/HomeCallToAction";
import { HomeHero } from "@/components/home/HomeHero";
import { HomeJoin } from "@/components/home/HomeJoin";
import { HomeNews } from "@/components/home/HomeNews";
import { HomeObjectives } from "@/components/home/HomeObjectives";
import { HomePartners } from "@/components/home/HomePartners";
import { HomeProjects } from "@/components/home/HomeProjects";
import { HomeTeam } from "@/components/home/HomeTeam";
import { HomeVision } from "@/components/home/HomeVision";
import { JsonLd } from "@/components/seo/JsonLd";
import { ABOUT_PAGE } from "@/content/page-sections/a-propos";
import { HOME_PAGE } from "@/content/page-sections/accueil";
import { ORG, T } from "@/content/fr/site";
import { homeJsonLd } from "@/lib/seo/structured-data";
import { listLatestArticles } from "@/server/data/articles";
import { getPageContent } from "@/server/data/page-sections";
import { listHomeProjects } from "@/server/data/projects";
import { getSiteSettings, listActionAreas, listPartners, listTeamMembers } from "@/server/data/site";

export function generateMetadata(): Metadata {
  // Description pensée pour Google (recherches « ONG Bénin », « faire un don Bénin »…).
  const description = T.home.metaDescription;
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
 * entièrement prérendue. Les textes de l'administration remplacent le contenu
 * officiel (src/content/fr/ina-africa.ts) dès qu'ils existent ; les projets,
 * actualités et partenaires n'apparaissent que s'ils sont publiés.
 */
export default async function HomePage() {
  const [settings, home, about, areas, projects, articles, partners, team] = await Promise.all([
    getSiteSettings(),
    getPageContent(HOME_PAGE),
    getPageContent(ABOUT_PAGE),
    listActionAreas(),
    listHomeProjects(3),
    listLatestArticles(3),
    listPartners(),
    listTeamMembers(),
  ]);

  return (
    <>
      <JsonLd data={homeJsonLd(settings)} />
      <HomeHero top={home.section("haut")} slideshow={home.section("diaporama")} />
      <HomeAbout s={home.section("presentation")} />
      <HomeVision s={home.section("vision")} missions={about.section("missions").list("items")} />
      <HomeAreas s={home.section("piliers")} areas={areas} />
      <HomeObjectives s={home.section("objectifs")} />
      <HomeAchievements s={home.section("actions")} limit={6} />
      {projects.length > 0 && <HomeProjects s={home.section("projets")} projects={projects} />}
      <HomeTeam s={home.section("equipe")} members={team} />
      <HomeJoin s={about.section("rejoindre")} />
      <HomeNews s={home.section("actualites")} articles={articles} />
      <HomePartners s={home.section("partenaires")} partners={partners} />
      <HomeCallToAction s={home.section("agir")} />
    </>
  );
}
