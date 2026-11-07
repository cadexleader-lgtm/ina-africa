import type { Metadata } from "next";

import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { HomeAchievements } from "@/components/home/HomeAchievements";
import { OtherAreas } from "@/components/pages/areas/OtherAreas";
import { PageCallToAction } from "@/components/pages/PageCallToAction";
import { PageHeader } from "@/components/pages/PageHeader";
import { ProjectResults } from "@/components/pages/projects/ProjectResults";
import { PAGES } from "@/content/fr/pages";
import { ORG } from "@/content/fr/site";
import { getSiteSettings, listActionAreas } from "@/server/data/site";
import { PAGE_BACKDROPS } from "@/content/provisional-images";

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
    title: `${T.metaTitle} — ${ORG.name}`,
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
  const [params, settings, areas] = await Promise.all([searchParams, getSiteSettings(), listActionAreas()]);
  return (
    <>
      <PageHeader
        backdrop={PAGE_BACKDROPS.projects}
        id="projets-titre"
        breadcrumbs={[{ label: PAGES.common.home, href: "/" }, { label: T.label }]}
        label={T.label}
        title={T.title}
        intro={<p>{T.intro}</p>}
      />
      <Section labelledBy="projets-publies">
        <Container>
          <SectionHeading id="projets-publies" label="Projets" title="Projets publiés" />
          <ProjectResults searchParams={params} />
        </Container>
      </Section>
      <HomeAchievements settings={settings} tone="ivory" id="actions-documentees" groupByArea />
      <Section labelledBy="projets-domaines">
        <Container>
          <SectionHeading
            id="projets-domaines"
            label="Nos domaines d'intervention"
            title="Les sept domaines de l'ONG"
            intro="Chaque projet et chaque action s'inscrit dans l'un des domaines d'intervention de INA-AFRICA."
          />
          <OtherAreas areas={areas} />
        </Container>
      </Section>
      <PageCallToAction id="projets-soutenir" explore="none" flushTop />
    </>
  );
}
