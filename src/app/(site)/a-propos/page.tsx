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
import { excerpt, paragraphs } from "@/components/pages/page-helpers";
import { HISTORY, MISSIONS, OBJECTIVES, APPROACH, ORGANISATION_INTRO, VISION, VISION_EXPLAINED } from "@/content/fr/ina-africa";
import { PAGES } from "@/content/fr/pages";
import { illustrationAsProvisional, PAGE_BACKDROPS } from "@/content/provisional-images";
import { ORG } from "@/content/fr/site";
import { getSiteSettings, listActionAreas, listTeamMembers, splitLines } from "@/server/data/site";

const T = PAGES.about;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const description = excerpt(paragraphs(settings.aboutHistory)[0]) ?? T.metaDescription;
  return {
    title: T.metaTitle,
    description,
    alternates: { canonical: "/a-propos" },
    openGraph: { type: "website", locale: "fr_FR", siteName: ORG.name, title: `${T.metaTitle} — ${ORG.name}`, description, url: "/a-propos" },
  };
}

/**
 * À propos : page institutionnelle complète, dans l'ordre demandé par l'ONG :
 * introduction, historique, contexte et raison d'être, vision, missions,
 * objectifs, approche, gouvernance, instances et membres, invitation à
 * rejoindre. Textes de l'administration s'ils existent, sinon contenu
 * officiel (src/content/fr/ina-africa.ts). Entièrement prérendue.
 */
export default async function AboutPage() {
  const [settings, areas, team] = await Promise.all([getSiteSettings(), listActionAreas(), listTeamMembers()]);

  const history = paragraphs(settings.aboutHistory);
  const [creation, ...reasons] = history.length > 0 ? history : HISTORY;
  const vision = settings.vision?.trim() || VISION;
  const missions = splitLines(settings.mission);
  const objectives = splitLines(settings.objectives);
  const values = splitLines(settings.valuesText);
  const approach = splitLines(settings.approach);

  const sections = [
    { id: T.history.id, label: "Historique" },
    { id: "raison-d-etre", label: "Raison d'être" },
    { id: T.vision.id, label: T.vision.nav },
    { id: T.missions.id, label: T.missions.nav },
    { id: T.objectives.id, label: T.objectives.nav },
    ...(values.length > 0 ? [{ id: T.values.id, label: T.values.nav }] : []),
    { id: T.approach.id, label: T.approach.nav },
    { id: "gouvernance", label: "Gouvernance" },
    ...(team.length > 0 ? [{ id: T.team.id, label: T.team.nav }] : []),
    { id: "rejoindre", label: "Nous rejoindre" },
  ];

  return (
    <>
      <PageHeader
        backdrop={PAGE_BACKDROPS.about}
        id="a-propos-titre"
        breadcrumbs={[{ label: PAGES.common.home, href: "/" }, { label: T.label }]}
        label={T.label}
        title={T.title}
        intro={<p>{ORGANISATION_INTRO[0]}</p>}
        aside={<AboutFacts areaCount={areas.length} address={settings.address} />}
      />
      <OnThisPage items={sections} />

      <AboutHistory
        paragraphs={[creation]}
        image={illustrationAsProvisional("/images/illustrations/eleves-lecture.webp")}
        tone="white"
      />
      <AboutContext paragraphs={reasons} tone="ivory" />
      <AboutVision text={vision} explanation={VISION_EXPLAINED} />
      <AboutMissions items={missions.length > 0 ? missions : MISSIONS} tone="white" />
      <AboutObjectives items={objectives.length > 0 ? objectives : OBJECTIVES} tone="ivory" />
      {values.length > 0 && <AboutValues lines={values} tone="white" />}
      <AboutApproach items={approach.length > 0 ? approach : APPROACH} tone="white" />
      <AboutGovernance tone="ivory" />
      <AboutTeam members={team} tone="white" />
      {team.length > 0 && <JsonLd data={aboutJsonLd(team)} />}
      <HomeJoin tone="ivory" id="rejoindre" />
    </>
  );
}
