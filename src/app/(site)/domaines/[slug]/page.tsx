import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowRight, Check, FileCheck2, MapPin, Users } from "lucide-react";

import { LinkButton } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
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
import { ACHIEVEMENTS, AREAS } from "@/content/fr/ina-africa";
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
  const official = AREAS.find((item) => item.slug === area.slug) ?? null;
  const achievements = ACHIEVEMENTS.filter((achievement) => achievement.areaSlug === area.slug);
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
        intro={area.summary ? <p>{area.summary}</p> : undefined}
        aside={<AreaVisual area={area} priority />}
      />

      <Section labelledBy="domaine-presentation">
        <Container>
          <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
            {official && (
              <Reveal className="lg:col-span-5">
                <div className="h-full rounded-panel bg-ivory p-6 sm:p-8">
                  <p className="text-small font-semibold text-muted">La problématique</p>
                  <h2 className="mt-2 text-h3">Pourquoi ce domaine compte</h2>
                  <p className="mt-4 text-body text-ink">{official.problem}</p>
                </div>
              </Reveal>
            )}
            <Reveal delay={80} className={official ? "lg:col-span-7" : "lg:col-span-12"}>
              <p className="text-small font-semibold text-muted">Notre engagement</p>
              <h2 id="domaine-presentation" className="mt-2 text-h2">
                Ce que fait INA-AFRICA
              </h2>
              <div className="mt-5 max-w-measure">
                {description.length > 0 ? (
                  description.map((paragraph, index) => (
                    <p key={index} className={index === 0 ? "text-lead text-ink" : "mt-5 text-ink"}>
                      {paragraph}
                    </p>
                  ))
                ) : (
                  <p className="text-muted">{T.noDescriptionText}</p>
                )}
              </div>
            </Reveal>
          </div>

          {(area.actions.length > 0 || (official?.audiences.length ?? 0) > 0) && (
            <div className="mt-10 grid gap-8 lg:grid-cols-12 lg:gap-12">
              {area.actions.length > 0 && (
                <Reveal className="lg:col-span-7">
                  <h2 className="text-h3">Nos interventions</h2>
                  <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                    {area.actions.map((action) => (
                      <li key={action} className="flex items-start gap-3 rounded-card border border-line bg-white p-4 text-body text-ink">
                        <span aria-hidden="true" className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-gold text-brand">
                          <Check className="size-4" strokeWidth={2.5} />
                        </span>
                        {action}
                      </li>
                    ))}
                  </ul>
                </Reveal>
              )}
              {official && official.audiences.length > 0 && (
                <Reveal delay={80} className="lg:col-span-5">
                  <h2 className="text-h3">Les publics concernés</h2>
                  <ul className="mt-5 space-y-3">
                    {official.audiences.map((audience) => (
                      <li key={audience} className="flex items-center gap-3 rounded-card bg-brand-50 px-4 py-3 font-semibold text-brand">
                        <Users aria-hidden="true" className="size-5 shrink-0 text-brand-2" />
                        {audience}
                      </li>
                    ))}
                  </ul>
                </Reveal>
              )}
            </div>
          )}
        </Container>
      </Section>

      {(achievements.length > 0 || projects.length > 0) && (
        <Section tone="ivory" labelledBy="domaine-actions">
          <Container>
            <SectionHeading
              id="domaine-actions"
              label={T.actionsLabel}
              title={T.actionsTitle}
              action={
                projects.length > 0 && (
                  <LinkButton href={projectsHref({ area: area.slug })} variant="secondary" iconRight={<ArrowRight aria-hidden="true" />}>
                    {T.actionsAll}
                  </LinkButton>
                )
              }
            />
            {achievements.length > 0 && (
              <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {achievements.map((achievement) => (
                  <li key={achievement.title} className="flex">
                    <article className="flex w-full flex-col rounded-card bg-white p-6 shadow-card">
                      <p className="inline-flex items-center gap-1.5 self-start rounded-full bg-success-50 px-3 py-1 text-small font-semibold text-success">
                        <FileCheck2 aria-hidden="true" className="size-4" />
                        Action documentée
                      </p>
                      <h3 className="mt-4 text-h4">{achievement.title}</h3>
                      <p className="mt-2 text-small text-muted">{achievement.text}</p>
                      <p className="mt-4 flex items-center gap-2 border-t border-line pt-4 text-small text-ink">
                        <MapPin aria-hidden="true" className="size-4 shrink-0 text-brand-2" />
                        {achievement.place} · {achievement.audience}
                      </p>
                    </article>
                  </li>
                ))}
              </ul>
            )}
            {projects.length > 0 && (
              <div className={achievements.length > 0 ? "mt-10" : undefined}>
                <h3 className="mb-5 text-h3">Projets publiés</h3>
                <ProjectGrid projects={projects} />
              </div>
            )}
          </Container>
        </Section>
      )}

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
