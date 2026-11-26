import type { Metadata } from "next";
import { SearchX } from "lucide-react";

import { LinkButton } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { Section } from "@/components/ui/Section";
import { MediaGallery } from "@/components/pages/gallery/MediaGallery";
import { CLOTHING_KITS_2026_PHOTOS, LAUNCH_2023_PHOTOS, SCHOOL_KITS_2025_PHOTOS } from "@/content/action-photos";
import type { ImageRef } from "@/lib/types/content";
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
      <NgoAlbums />
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

  // Rien de publié dans l'admin : les albums de l'ONG ci-dessous suffisent.
  if (result.items.length === 0) return null;

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

/** Albums des vraies photos de l'ONG (src/content/action-photos.ts), toujours affichés. */
const ALBUMS: { id: string; title: string; photos: ImageRef[] }[] = [
  { id: "kits-vestimentaires-2026", title: "Distribution de kits vestimentaires à Tanmey (21 mars 2026)", photos: CLOTHING_KITS_2026_PHOTOS },
  { id: "kits-scolaires-2025", title: "Distribution de kits scolaires dans trois écoles (26 septembre 2025)", photos: SCHOOL_KITS_2025_PHOTOS },
  { id: "lancement-2023", title: "Lancement officiel des activités de l'ONG (26 août 2023)", photos: LAUNCH_2023_PHOTOS },
];

function NgoAlbums() {
  return (
    <Section tone="ivory" labelledBy="galerie-albums">
      <Container>
        <h2 id="galerie-albums" className="text-h2">
          Nos actions en images
        </h2>
        <p className="mt-3 max-w-measure text-lead text-muted">Les photos prises par INA-AFRICA lors de ses actions sur le terrain.</p>
        <div className="mt-10 flex flex-col gap-14">
          {ALBUMS.map((album) => (
            <section key={album.id} aria-labelledby={`album-${album.id}`} className="flex flex-col gap-5">
              <h3 id={`album-${album.id}`} className="border-b border-line pb-3 text-h3">
                {album.title} <span className="text-body font-normal text-muted">· {album.photos.length} photos</span>
              </h3>
              <MediaGallery
                items={album.photos.map((photo, index) => ({
                  id: `${album.id}-${index}`,
                  type: "photo" as const,
                  image: photo,
                  caption: photo.alt,
                  takenOn: null,
                }))}
                showCaptions={false}
              />
            </section>
          ))}
        </div>
      </Container>
    </Section>
  );
}
