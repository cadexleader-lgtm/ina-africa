import type { Metadata } from "next";

import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { PageCallToAction } from "@/components/pages/PageCallToAction";
import { PageHeader } from "@/components/pages/PageHeader";
import { ProjectResults } from "@/components/pages/projects/ProjectResults";
import { PAGES } from "@/content/fr/pages";
import { ORG } from "@/content/fr/site";

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
 * Liste des projets publiés : filtres par domaine (?domaine=) et par état
 * (?statut=planned|ongoing|completed), pagination (?page=).
 */
export default async function ProjectsPage({ searchParams }: PageProps<"/projets">) {
  const params = await searchParams;
  return (
    <>
      <PageHeader
        id="projets-titre"
        breadcrumbs={[{ label: PAGES.common.home, href: "/" }, { label: T.label }]}
        label={T.label}
        title={T.title}
        intro={<p>{T.intro}</p>}
      />
      <Section spacing="compact">
        <Container>
          <ProjectResults searchParams={params} />
        </Container>
      </Section>
      <PageCallToAction id="projets-soutenir" explore="areas" flushTop />
    </>
  );
}
