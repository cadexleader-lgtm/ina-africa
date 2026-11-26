import type { Metadata } from "next";

import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { HomeAchievements } from "@/components/home/HomeAchievements";
import { OtherAreas } from "@/components/pages/areas/OtherAreas";
import { PageCallToAction } from "@/components/pages/PageCallToAction";
import { Paragraphs } from "@/components/pages/Paragraphs";
import { getPageContent } from "@/server/data/page-sections";
import { HOME_PAGE } from "@/content/page-sections/accueil";
import { PROJECTS_PAGE } from "@/content/page-sections/projets";
import { PageHeader } from "@/components/pages/PageHeader";
import { ProjectResults } from "@/components/pages/projects/ProjectResults";
import { PAGES } from "@/content/fr/pages";
import { ORG } from "@/content/fr/site";
import { listActionAreas } from "@/server/data/site";

const T = PAGES.projects;

export const metadata: Metadata = {
  title: T.metaTitle,
  description: T.metaDescription,
  // Les variantes filtrées et paginées renvoient vers la liste complète.
  alternates: { canonical: "/projets" },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: ORG.name,
    title: `${T.metaTitle} | ${ORG.name}`,
    description: T.metaDescription,
    url: "/projets",
  },
};

/**
 * Rendu complet côté serveur à chaque requête (attente assumée) : les filtres
 * et la pagination sont lus directement, HORS <Suspense>, pour que la liste
 * soit dans le HTML même sans JavaScript (sous <Suspense>, le contenu arrive
 * en flux et reste caché derrière le squelette tant que JavaScript ne s'exécute
 * pas). Les lectures de données restent en cache, donc rapides.
 */
export const instant = false;

/**
 * Trois rubriques distinctes : les projets publiés (filtres par domaine,
 * état, pagination), les actions documentées (contenu officiel, sans photo
 * présentée comme preuve) et les domaines d'intervention.
 */
export default async function ProjectsPage({ searchParams }: PageProps<"/projets">) {
  const [params, content, home, areas] = await Promise.all([searchParams, getPageContent(PROJECTS_PAGE), getPageContent(HOME_PAGE), listActionAreas()]);
  const header = content.section("en-tete");
  const published = content.section("publies");
  const pillars = content.section("piliers");
  return (
    <>
      <PageHeader
        backdrop={header.image("image") ?? undefined}
        id="projets-titre"
        breadcrumbs={[{ label: PAGES.common.home, href: "/" }, { label: header.line("label") }]}
        label={header.line("label")}
        title={header.line("title")}
        intro={<Paragraphs items={header.paragraphs("intro")} />}
      />
      <Section labelledBy="projets-publies">
        <Container>
          <SectionHeading id="projets-publies" label={published.line("label")} title={published.line("title")} />
          <ProjectResults searchParams={params} />
        </Container>
      </Section>
      <HomeAchievements s={home.section("actions")} tone="ivory" id="actions-documentees" groupByArea />
      <Section labelledBy="projets-domaines">
        <Container>
          <SectionHeading
            id="projets-domaines"
            label={pillars.line("label")}
            title={pillars.line("title")}
            intro={
              <>
                <p className="font-semibold text-brand">{pillars.line("lead")}</p>
                <Paragraphs items={pillars.paragraphs("text")} className="mt-3 text-body" spacing="" />
              </>
            }
          />
          <OtherAreas areas={areas} />
        </Container>
      </Section>
      <PageCallToAction id="projets-soutenir" explore="none" flushTop />
    </>
  );
}
