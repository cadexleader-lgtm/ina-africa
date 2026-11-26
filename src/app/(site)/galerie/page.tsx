import type { Metadata } from "next";
import { ArrowRight, Images, SearchX } from "lucide-react";

import { LinkButton } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { Section } from "@/components/ui/Section";
import { MediaGallery } from "@/components/pages/gallery/MediaGallery";
import { PageCallToAction } from "@/components/pages/PageCallToAction";
import { Paragraphs } from "@/components/pages/Paragraphs";
import { getPageContent } from "@/server/data/page-sections";
import { GALLERY_PAGE } from "@/content/page-sections/galerie";
import { PageHeader } from "@/components/pages/PageHeader";
import { parsePage } from "@/components/pages/page-helpers";
import { PAGES } from "@/content/fr/pages";
import { ORG } from "@/content/fr/site";
import { listGalleryItems } from "@/server/data/site";

const T = PAGES.gallery;

export const metadata: Metadata = {
  title: T.metaTitle,
  description: T.metaDescription,
  alternates: { canonical: "/galerie" },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: ORG.name,
    title: `${T.metaTitle} | ${ORG.name}`,
    description: T.metaDescription,
    url: "/galerie",
  },
};

/**
 * Rendu complet côté serveur (attente assumée) : la page est lue HORS
 * <Suspense> pour que la galerie soit dans le HTML même sans JavaScript.
 */
export const instant = false;

/** Galerie : photos et vidéos publiées, visionneuse accessible, pagination (?page=). */
export default async function GalleryPage({ searchParams }: PageProps<"/galerie">) {
  const [page, content] = await Promise.all([searchParams.then((params) => parsePage(params.page)), getPageContent(GALLERY_PAGE)]);
  const header = content.section("en-tete");
  return (
    <>
      <PageHeader
        backdrop={header.image("image") ?? undefined}
        id="galerie-titre"
        breadcrumbs={[{ label: PAGES.common.home, href: "/" }, { label: header.line("label") }]}
        label={header.line("label")}
        title={header.line("title")}
        intro={<Paragraphs items={header.paragraphs("intro")} />}
      />
      <Section spacing="compact">
        <Container>
          <GalleryResults page={page} />
        </Container>
      </Section>
      <PageCallToAction id="galerie-soutenir" explore="projects" flushTop />
    </>
  );
}

async function GalleryResults({ page }: { page: number }) {
  const result = await listGalleryItems(page);

  if (page > 1 && result.items.length === 0) {
    return (
      <EmptyState
        icon={SearchX}
        headingLevel="h2"
        title={T.pageMissingTitle}
        description={T.pageMissingText}
        action={
          <LinkButton href="/galerie" variant="secondary">
            {T.pageMissingLink}
          </LinkButton>
        }
      />
    );
  }

  if (result.items.length === 0) {
    return (
      <EmptyState
        icon={Images}
        headingLevel="h2"
        title={T.emptyTitle}
        description={T.emptyText}
        action={
          <LinkButton href="/projets" variant="secondary" iconRight={<ArrowRight aria-hidden="true" />}>
            {T.emptyLink}
          </LinkButton>
        }
      />
    );
  }

  return (
    <section aria-labelledby="galerie-elements" className="flex flex-col gap-8">
      <h2 id="galerie-elements" className="border-b border-line pb-5 text-h4">
        {T.count(result.total)}
      </h2>
      <MediaGallery items={result.items} />
      <Pagination page={result.page} pageCount={result.pageCount} basePath="/galerie" label={T.pagination} className="mt-4" />
    </section>
  );
}
