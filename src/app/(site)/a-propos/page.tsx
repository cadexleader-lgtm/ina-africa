import type { Metadata } from "next";

import { AboutFacts } from "@/components/pages/about/AboutFacts";
import {
  AboutApproach,
  AboutContext,
  AboutGovernance,
  AboutHistory,
  AboutMissions,
  AboutObjectives,
  AboutValues,
  AboutVision,
} from "@/components/pages/about/AboutSections";
import { AboutTeam } from "@/components/pages/about/AboutTeam";
import { JsonLd } from "@/components/seo/JsonLd";
import { aboutJsonLd } from "@/lib/seo/structured-data";
import { HomeJoin } from "@/components/home/HomeJoin";
import { OnThisPage } from "@/components/pages/OnThisPage";
import { PageHeader } from "@/components/pages/PageHeader";
import { excerpt } from "@/components/pages/page-helpers";
import { PAGES } from "@/content/fr/pages";
import { ABOUT_PAGE } from "@/content/page-sections/a-propos";
import { ORG } from "@/content/fr/site";
import { getPageContent } from "@/server/data/page-sections";
import { getSiteSettings, listActionAreas, listTeamMembers } from "@/server/data/site";

const T = PAGES.about;

export async function generateMetadata(): Promise<Metadata> {
  const content = await getPageContent(ABOUT_PAGE);
  const description = excerpt(content.section("en-tete").paragraphs("intro")[0]) ?? T.metaDescription;
  return {
    title: T.metaTitle,
    description,
    alternates: { canonical: "/a-propos" },
    openGraph: {
      type: "website",
      locale: "fr_FR",
      siteName: ORG.name,
      title: `${T.metaTitle} | ${ORG.name}`,
      description,
      url: "/a-propos",
    },
  };
}

/**
 * À propos : page institutionnelle complète, dans l'ordre demandé par l'ONG :
 * introduction, historique, contexte et raison d'être, vision, missions,
 * objectifs, approche, gouvernance, instances et membres, invitation à
 * rejoindre. Textes et photos modifiables dans l'administration
 * (Pages du site → À propos), sinon textes d'origine
 * (src/content/page-sections/a-propos.ts). Entièrement prérendue.
 */
export default async function AboutPage() {
  const [settings, content, areas, team] = await Promise.all([
    getSiteSettings(),
    getPageContent(ABOUT_PAGE),
    listActionAreas(),
    listTeamMembers(),
  ]);
  const section = content.section;
  const header = section("en-tete");
  const hasValues = section("valeurs").items("items").length > 0;

  const sections = [
    { id: T.history.id, label: "Historique" },
    { id: "raison-d-etre", label: "Raison d'être" },
    { id: T.vision.id, label: T.vision.nav },
    { id: T.missions.id, label: T.missions.nav },
    { id: T.objectives.id, label: T.objectives.nav },
    ...(hasValues ? [{ id: T.values.id, label: T.values.nav }] : []),
    { id: T.approach.id, label: T.approach.nav },
    { id: "gouvernance", label: "Gouvernance" },
    ...(team.length > 0 ? [{ id: T.team.id, label: T.team.nav }] : []),
    { id: "rejoindre", label: "Nous rejoindre" },
  ];

  return (
    <>
      <PageHeader
        backdrop={header.image("image") ?? undefined}
        id="a-propos-titre"
        breadcrumbs={[{ label: PAGES.common.home, href: "/" }, { label: header.line("label") }]}
        label={header.line("label")}
        title={header.line("title")}
        intro={
          <>
            <p className="font-semibold text-brand">{header.line("lead")}</p>
            {header.paragraphs("intro").map((paragraph, index) => (
              <p key={index} className="mt-4">
                {paragraph}
              </p>
            ))}
          </>
        }
        aside={<AboutFacts areaCount={areas.length} address={settings.address} />}
      />
      <OnThisPage items={sections} />

      <AboutHistory s={section("historique")} tone="white" />
      <AboutContext s={section("raison-d-etre")} tone="ivory" />
      <AboutVision s={section("vision")} />
      <AboutMissions s={section("missions")} tone="white" />
      <AboutObjectives s={section("objectifs")} tone="ivory" />
      {hasValues && <AboutValues s={section("valeurs")} tone="white" />}
      <AboutApproach s={section("approche")} tone="white" />
      <AboutGovernance s={section("gouvernance")} tone="ivory" />
      <AboutTeam s={section("equipe")} members={team} tone="white" />
      {team.length > 0 && <JsonLd data={aboutJsonLd(team)} />}
      <HomeJoin s={section("rejoindre")} tone="ivory" id="rejoindre" />
    </>
  );
}
