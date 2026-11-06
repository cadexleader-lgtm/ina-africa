import type { Metadata } from "next";
import { BookOpen } from "lucide-react";

import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { Section, type SectionTone } from "@/components/ui/Section";
import { AboutFacts } from "@/components/pages/about/AboutFacts";
import {
  AboutApproach,
  AboutHistory,
  AboutMissions,
  AboutObjectives,
  AboutValues,
  AboutVision,
} from "@/components/pages/about/AboutSections";
import { AboutTeam } from "@/components/pages/about/AboutTeam";
import { OnThisPage } from "@/components/pages/OnThisPage";
import { PageCallToAction } from "@/components/pages/PageCallToAction";
import { PageHeader } from "@/components/pages/PageHeader";
import { alternateTones, excerpt, paragraphs } from "@/components/pages/page-helpers";
import { PAGES } from "@/content/fr/pages";
import { PROVISIONAL_IMAGES } from "@/content/provisional-images";
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
    // Pas d'image de partage : seules les vraies photos de l'ONG peuvent l'être.
    openGraph: { type: "website", locale: "fr_FR", siteName: ORG.name, title: `${T.metaTitle} — ${ORG.name}`, description, url: "/a-propos" },
  };
}

type Block = { id: string; label: string };

/**
 * À propos : page éditoriale construite UNIQUEMENT à partir des textes de
 * l'administration (historique, vision, missions, objectifs, valeurs, moyens
 * d'action) et de l'équipe publiée. Chaque section vide est masquée ; si tout
 * est vide, un état vide honnête s'affiche. Entièrement prérendue (lectures en cache).
 */
export default async function AboutPage() {
  const [settings, areas, team] = await Promise.all([getSiteSettings(), listActionAreas(), listTeamMembers()]);

  const history = paragraphs(settings.aboutHistory);
  const vision = settings.vision?.trim() || null;
  const missions = splitLines(settings.mission);
  const objectives = splitLines(settings.objectives);
  const values = splitLines(settings.valuesText);
  const approach = splitLines(settings.approach);

  // Sections présentes, dans l'ordre ; fonds alternés blanc / ivoire (la vision est sur fond bleu).
  const candidates: [boolean, Block][] = [
    [history.length > 0, { id: T.history.id, label: T.history.nav }],
    [Boolean(vision), { id: T.vision.id, label: T.vision.nav }],
    [missions.length > 0, { id: T.missions.id, label: T.missions.nav }],
    [objectives.length > 0, { id: T.objectives.id, label: T.objectives.nav }],
    [values.length > 0, { id: T.values.id, label: T.values.nav }],
    [approach.length > 0, { id: T.approach.id, label: T.approach.nav }],
    [team.length > 0, { id: T.team.id, label: T.team.nav }],
  ];
  const present = candidates.filter(([shown]) => shown).map(([, block]) => block);

  const tones = alternateTones(present.map((block) => block.id), [T.vision.id]);
  const tone = (id: string): SectionTone => tones[id] ?? "white";
  const isEmpty = present.length === 0;

  return (
    <>
      <PageHeader
        id="a-propos-titre"
        breadcrumbs={[{ label: PAGES.common.home, href: "/" }, { label: T.label }]}
        label={T.label}
        title={T.title}
        intro={<p>{T.intro}</p>}
        aside={<AboutFacts areaCount={areas.length} address={settings.address} />}
      />
      <OnThisPage items={present} />

      {history.length > 0 && (
        <AboutHistory paragraphs={history} image={PROVISIONAL_IMAGES.atelierCouture} tone={tone(T.history.id)} />
      )}
      {vision && <AboutVision text={vision} />}
      {missions.length > 0 && <AboutMissions items={missions} tone={tone(T.missions.id)} />}
      {objectives.length > 0 && <AboutObjectives items={objectives} tone={tone(T.objectives.id)} />}
      {values.length > 0 && <AboutValues lines={values} tone={tone(T.values.id)} />}
      {approach.length > 0 && <AboutApproach items={approach} tone={tone(T.approach.id)} />}
      <AboutTeam members={team} tone={tone(T.team.id)} />

      {isEmpty && (
        <Section aria-label={T.emptyTitle}>
          <Container>
            <EmptyState icon={BookOpen} headingLevel="h2" title={T.emptyTitle} description={T.emptyText} />
          </Container>
        </Section>
      )}

      <PageCallToAction id="a-propos-soutenir" explore="areas" />
    </>
  );
}
