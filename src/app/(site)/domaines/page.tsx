import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Compass } from "lucide-react";

import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { DomainCard } from "@/components/site/DomainCard";
import { PageCallToAction } from "@/components/pages/PageCallToAction";
import { PageHeader } from "@/components/pages/PageHeader";
import { excerpt } from "@/components/pages/page-helpers";
import { PAGES } from "@/content/fr/pages";
import { ORG } from "@/content/fr/site";
import { listActionAreas } from "@/server/data/site";

const T = PAGES.areas;

export async function generateMetadata(): Promise<Metadata> {
  const areas = await listActionAreas();
  // Description factuelle : la liste des domaines publiés.
  const description =
    excerpt(areas.length ? `${T.metaDescription.replace(/\.$/, "")} : ${areas.map((area) => area.title).join(", ")}.` : null) ??
    T.metaDescription;
  return {
    title: T.metaTitle,
    description,
    alternates: { canonical: "/domaines" },
    openGraph: { type: "website", locale: "fr_FR", siteName: ORG.name, title: `${T.metaTitle} — ${ORG.name}`, description, url: "/domaines" },
  };
}

/** Grille des domaines d'action publiés (+ accès aux projets). État vide si aucun domaine n'est actif. */
export default async function AreasPage() {
  const areas = await listActionAreas();

  return (
    <>
      <PageHeader
        id="domaines-titre"
        breadcrumbs={[{ label: PAGES.common.home, href: "/" }, { label: T.title }]}
        label={T.label}
        title={T.title}
        intro={<p>{T.intro}</p>}
        meta={
          areas.length > 0 && (
            <p className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-small font-semibold text-brand shadow-card">
              <Compass aria-hidden="true" className="size-4 text-brand-2" />
              {T.count(areas.length)}
            </p>
          )
        }
      />

      <Section aria-label={T.listLabel}>
        <Container>
          {areas.length === 0 ? (
            <EmptyState icon={Compass} headingLevel="h2" title={T.emptyTitle} description={T.emptyText} />
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
              {areas.map((area, index) => (
                <li key={area.id} className="flex">
                  <Reveal delay={(index % 4) * 70} className="flex w-full">
                    <DomainCard area={area} headingLevel="h2" className="w-full" />
                  </Reveal>
                </li>
              ))}
              <li className="flex">
                <Reveal delay={(areas.length % 4) * 70} className="flex w-full">
                  <Link
                    href="/projets"
                    className="group flex w-full items-center justify-between gap-4 rounded-card bg-brand p-5 font-heading text-h4 text-white transition-colors duration-(--duration-base) hover:bg-brand-strong sm:min-h-56 sm:flex-col sm:items-start sm:justify-end sm:p-6"
                  >
                    <span>{T.allProjects}</span>
                    <span
                      aria-hidden="true"
                      className="flex size-11 shrink-0 items-center justify-center rounded-full bg-gold text-brand transition-transform duration-(--duration-fast) motion-safe:group-hover:translate-x-1"
                    >
                      <ArrowRight className="size-5" />
                    </span>
                  </Link>
                </Reveal>
              </li>
            </ul>
          )}
        </Container>
      </Section>

      <PageCallToAction id="domaines-soutenir" explore="none" />
    </>
  );
}
