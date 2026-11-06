import Link from "next/link";

import { Container } from "@/components/ui/Container";
import { ResponsiveImage } from "@/components/ui/ResponsiveImage";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { RichText } from "@/components/site/RichText";
import { ShareLinks } from "@/components/site/ShareLinks";
import { JsonLd } from "@/components/seo/JsonLd";
import { BackLink } from "@/components/pages/BackLink";
import { MediaGallery } from "@/components/pages/gallery/MediaGallery";
import { PageCallToAction } from "@/components/pages/PageCallToAction";
import { PageHeader } from "@/components/pages/PageHeader";
import { ProjectFactsCard, ProjectMetaLine } from "@/components/pages/projects/ProjectFacts";
import { ProjectGrid } from "@/components/pages/projects/ProjectGrid";
import { breadcrumbJsonLd } from "@/components/pages/page-helpers";
import { PAGES } from "@/content/fr/pages";
import { absoluteUrl } from "@/lib/site-url";
import type { Project, ProjectSummary } from "@/lib/types/content";
import { isEmptyDoc } from "@/lib/validation/rich-text";

const T = PAGES.project;

/**
 * Contenu de la page d'un projet (composant serveur, sans lecture de données) :
 * couverture, domaine, lieu, dates, état, contenu riche, galerie avec
 * visionneuse, autres projets du domaine, appel au don sobre.
 */
export function ProjectDetail({ project, others }: { project: Project; others: ProjectSummary[] }) {
  const hasContent = !isEmptyDoc(project.content);
  const crumbs = [
    { label: PAGES.common.home, href: "/" },
    { label: PAGES.projects.label, href: "/projets" },
    { label: project.title, href: `/projets/${project.slug}` },
  ];

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <PageHeader
        id="projet-titre"
        breadcrumbs={crumbs.map((crumb, index) => (index === crumbs.length - 1 ? { label: crumb.label } : crumb))}
        label={
          project.area ? (
            <Link href={`/domaines/${project.area.slug}`} className="underline-offset-4 hover:text-link hover:underline">
              {project.area.title}
            </Link>
          ) : (
            PAGES.projects.label
          )
        }
        title={project.title}
        intro={project.summary ? <p>{project.summary}</p> : undefined}
        meta={<ProjectMetaLine project={project} />}
      />

      {project.cover && (
        <div className="bg-white">
          <Container>
            <div className="relative -mt-8 aspect-[4/3] overflow-hidden rounded-panel shadow-card sm:-mt-12 sm:aspect-[16/9] lg:aspect-[21/9]">
              <ResponsiveImage image={project.cover} fill priority sizes="(min-width: 1280px) 1200px, 100vw" />
            </div>
          </Container>
        </div>
      )}

      <Section labelledBy="projet-presentation">
        <Container>
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <article className="lg:col-span-8">
              {/* Titre discret (libellé) : les sous-titres du contenu riche restent les vrais repères visuels. */}
              <h2 id="projet-presentation" className="mb-6 flex items-center gap-3 text-small font-semibold tracking-wide text-brand">
                <span aria-hidden="true" className="h-0.5 w-6 shrink-0 rounded-full bg-gold" />
                {T.contentTitle}
              </h2>
              {hasContent ? (
                <RichText doc={project.content} className="max-w-reading" />
              ) : (
                <p className="max-w-measure text-lead text-muted">{T.noContent}</p>
              )}
              <div className="mt-12 border-t border-line pt-8">
                <ShareLinks url={absoluteUrl(`/projets/${project.slug}`)} label={T.share} />
              </div>
            </article>
            <aside className="lg:col-span-4">
              <div className="lg:sticky lg:top-[calc(var(--spacing-header)+2rem)]">
                <ProjectFactsCard project={project} />
              </div>
            </aside>
          </div>
        </Container>
      </Section>

      {project.photos.length > 0 && (
        <Section tone="ivory" labelledBy="projet-galerie">
          <Container>
            <Reveal>
              <SectionHeading id="projet-galerie" label={T.galleryLabel} title={T.galleryTitle} />
            </Reveal>
            <MediaGallery items={project.photos} />
          </Container>
        </Section>
      )}

      <Section spacing="compact" labelledBy={others.length > 0 ? "projet-autres" : undefined}>
        <Container>
          {others.length > 0 && (
            <>
              <h2 id="projet-autres" className="mb-8 text-h3">
                {T.othersTitle}
              </h2>
              <ProjectGrid projects={others} className="mb-8" />
            </>
          )}
          <BackLink href="/projets">{T.back}</BackLink>
        </Container>
      </Section>

      <PageCallToAction id="projet-soutenir" explore="none" flushTop />
    </>
  );
}
