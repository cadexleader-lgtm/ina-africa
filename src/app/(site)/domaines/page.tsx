import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Compass } from "lucide-react";

import { LinkButton } from "@/components/ui/Button";

import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { AreaVisualFill } from "@/components/pages/areas/AreaVisual";
import { PageCallToAction } from "@/components/pages/PageCallToAction";
import { PageHeader } from "@/components/pages/PageHeader";
import { excerpt } from "@/components/pages/page-helpers";
import { AREAS } from "@/content/fr/ina-africa";
import { PAGES } from "@/content/fr/pages";
import { cn } from "@/lib/cn";
import { ORG } from "@/content/fr/site";
import { listActionAreas } from "@/server/data/site";
import { PAGE_BACKDROPS } from "@/content/provisional-images";

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
        backdrop={PAGE_BACKDROPS.areas}
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

      <Section tone="ivory" aria-label={T.listLabel}>
        <Container>
          {areas.length === 0 ? (
            <EmptyState icon={Compass} headingLevel="h2" title={T.emptyTitle} description={T.emptyText} />
          ) : (
            <ol className="space-y-8 lg:space-y-10">
              {areas.map((area, index) => {
                const official = AREAS.find((item) => item.slug === area.slug);
                const reversed = index % 2 === 1;
                return (
                  <li key={area.id}>
                    <Reveal>
                      <article className="grid overflow-hidden rounded-panel bg-white shadow-card md:grid-cols-12">
                        <div className={cn("relative aspect-[16/10] md:col-span-5 md:aspect-auto md:min-h-[20rem]", reversed && "md:order-2")}>
                          <AreaVisualFill area={area} />
                        </div>
                        <div className="p-6 sm:p-8 md:col-span-7 lg:p-10">
                          <p aria-hidden="true" className="font-heading text-h4 text-brand">
                            {String(index + 1).padStart(2, "0")}
                          </p>
                          <h2 className="mt-1 text-h3">
                            <Link href={`/domaines/${area.slug}`} className="hover:text-link-strong">
                              {area.title}
                            </Link>
                          </h2>
                          {area.summary && <p className="mt-3 text-body text-ink">{area.summary}</p>}
                          {official && <p className="mt-3 text-small text-muted">{official.problem}</p>}
                          {area.actions.length > 0 && (
                            <ul className="mt-5 flex flex-wrap gap-2">
                              {area.actions.slice(0, 4).map((action) => (
                                <li key={action} className="inline-flex items-center gap-1.5 rounded-full bg-ivory px-3 py-1.5 text-small text-ink">
                                  <Check aria-hidden="true" className="size-4 text-success" />
                                  {action}
                                </li>
                              ))}
                            </ul>
                          )}
                          <LinkButton
                            href={`/domaines/${area.slug}`}
                            variant="secondary"
                            className="mt-6"
                            iconRight={<ArrowRight aria-hidden="true" />}
                          >
                            Découvrir ce domaine
                            <span className="sr-only"> : {area.title}</span>
                          </LinkButton>
                        </div>
                      </article>
                    </Reveal>
                  </li>
                );
              })}
            </ol>
          )}
        </Container>
      </Section>

      <PageCallToAction id="domaines-soutenir" explore="none" />
    </>
  );
}
