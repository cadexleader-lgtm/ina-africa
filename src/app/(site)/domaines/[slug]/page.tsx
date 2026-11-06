import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowRight, FolderOpen } from "lucide-react";

import { LinkButton } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { JsonLd } from "@/components/seo/JsonLd";
import { AreaVisual } from "@/components/pages/areas/AreaVisual";
import { OtherAreas } from "@/components/pages/areas/OtherAreas";
import { BackLink } from "@/components/pages/BackLink";
import { PageCallToAction } from "@/components/pages/PageCallToAction";
import { PageHeader } from "@/components/pages/PageHeader";
import { ProjectGrid } from "@/components/pages/projects/ProjectGrid";
import { breadcrumbJsonLd, excerpt, paragraphs, projectsHref } from "@/components/pages/page-helpers";
import { PAGES } from "@/content/fr/pages";
import { ORG } from "@/content/fr/site";
import { mediaUrl } from "@/lib/media";
import { listProjectsByArea } from "@/server/data/projects";
import { getActionArea, listActionAreas } from "@/server/data/site";

const T = PAGES.area;

/**
 * Adresse prérendue quand aucun domaine n'est publié : avec Cache Components,
 * generateStaticParams doit renvoyer au moins une valeur. Elle mène à une 404.
 */
const PLACEHOLDER_SLUG = "__aucun-domaine__";

/**
 * Page entièrement statique (toutes les lectures sont en cache), y compris
 * pour une adresse publiée après le build : la première requête attend la page
 * complète au lieu de recevoir l'App Shell en flux. C'est ce qui permet à une
 * adresse inconnue de renvoyer un VRAI statut HTTP 404 (`instant = false` seul
 * ne suffit pas ici : l'App Shell du layout partirait avec un statut 200).
 */
export const ensureStatic = "navigation";
export const instant = false;

export async function generateStaticParams() {
  const areas = await listActionAreas();
  return areas.length > 0 ? areas.map((area) => ({ slug: area.slug })) : [{ slug: PLACEHOLDER_SLUG }];
}

export async function generateMetadata({ params }: PageProps<"/domaines/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const area = await getActionArea(slug);
  if (!area) return {};
  const description = excerpt(area.summary) ?? excerpt(paragraphs(area.description)[0]) ?? T.metaDescription(area.title);
  const url = `/domaines/${area.slug}`;
  return {
    title: area.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: "fr_FR",
      siteName: ORG.name,
      title: `${area.title} — ${ORG.name}`,
      description,
      url,
      // Uniquement la vraie photo du domaine (jamais une illustration provisoire).
      images: area.image ? [{ url: mediaUrl(area.image.path), alt: area.image.alt }] : undefined,
    },
  };
}

/**
 * Détail d'un domaine : présentation, visuel, actions associées (projets
 * publiés du domaine), autres domaines. Adresse inconnue → vraie 404 (le
 * notFound() a lieu avant tout <Suspense>, toutes les lectures sont en cache).
 */
export default async function AreaPage({ params }: PageProps<"/domaines/[slug]">) {
  const { slug } = await params;
  const area = await getActionArea(slug);
  if (!area) notFound();

  const [projects, areas] = await Promise.all([listProjectsByArea(area.slug, 6), listActionAreas()]);
  const description = paragraphs(area.description);
  const others = areas.filter((other) => other.slug !== area.slug);
  const crumbs = [
    { label: PAGES.common.home, href: "/" },
    { label: PAGES.areas.title, href: "/domaines" },
    { label: area.title, href: `/domaines/${area.slug}` },
  ];

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <PageHeader
        id="domaine-titre"
        breadcrumbs={crumbs.map((crumb, index) => (index === crumbs.length - 1 ? { label: crumb.label } : crumb))}
        label={T.label}
        title={area.title}
        intro={
          area.summary ? (
            <p>{area.summary}</p>
          ) : description.length === 0 ? (
            <p className="text-muted">{T.noDescriptionText}</p>
          ) : undefined
        }
        aside={<AreaVisual area={area} priority />}
      />

      {description.length > 0 && (
        <Section labelledBy="domaine-presentation">
          <Container>
            <Reveal className="grid gap-8 lg:grid-cols-12 lg:gap-16">
              <div className="lg:col-span-4">
                <h2 id="domaine-presentation" className="text-h2">
                  {T.descriptionTitle}
                </h2>
              </div>
              <div className="max-w-measure lg:col-span-8">
                {description.map((paragraph, index) => (
                  <p key={index} className={index === 0 ? "text-lead text-ink" : "mt-5 text-ink"}>
                    {paragraph}
                  </p>
                ))}
              </div>
            </Reveal>
          </Container>
        </Section>
      )}

      <Section tone={description.length > 0 ? "ivory" : "white"} labelledBy="domaine-actions">
        <Container>
          <SectionHeading
            id="domaine-actions"
            label={T.actionsLabel}
            title={T.actionsTitle}
            action={
              projects.length > 0 && (
                <LinkButton
                  href={projectsHref({ area: area.slug })}
                  variant="secondary"
                  iconRight={<ArrowRight aria-hidden="true" />}
                >
                  {T.actionsAll}
                </LinkButton>
              )
            }
          />
          {projects.length > 0 ? (
            <ProjectGrid projects={projects} />
          ) : (
            <EmptyState
              icon={FolderOpen}
              surface={description.length > 0 ? "white" : "ivory"}
              title={T.actionsEmptyTitle}
              description={T.actionsEmptyText}
              action={
                <LinkButton href="/projets" variant="secondary" iconRight={<ArrowRight aria-hidden="true" />}>
                  {T.actionsEmptyLink}
                </LinkButton>
              }
            />
          )}
        </Container>
      </Section>

      <Section spacing="compact" labelledBy={others.length > 0 ? "domaine-autres" : undefined}>
        <Container>
          {others.length > 0 && (
            <>
              <h2 id="domaine-autres" className="mb-8 text-h3">
                {T.othersTitle}
              </h2>
              <OtherAreas areas={others} />
            </>
          )}
          <BackLink href="/domaines" className={others.length > 0 ? "mt-8" : undefined}>
            {T.back}
          </BackLink>
        </Container>
      </Section>

      <PageCallToAction id="domaine-soutenir" explore="none" flushTop />
    </>
  );
}
