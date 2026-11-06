import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { absoluteMediaUrl, pageMetadata, shareImage } from "@/lib/seo/metadata";

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://ina-africa.example");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://projet.supabase.co");
});
afterEach(() => vi.unstubAllEnvs());

describe("pageMetadata", () => {
  it("construit titre, description, adresse canonique absolue et Open Graph", () => {
    vi.stubEnv("SITE_INDEXABLE", "true");
    const metadata = pageMetadata({ title: "Actualités", description: "Les nouvelles de l'ONG.", path: "/actualites" });
    expect(metadata.title).toBe("Actualités");
    expect(metadata.description).toBe("Les nouvelles de l'ONG.");
    expect(metadata.alternates?.canonical).toBe("https://ina-africa.example/actualites");
    expect(metadata.robots).toEqual({ index: true, follow: true });
    expect(metadata.openGraph).toMatchObject({
      type: "website",
      locale: "fr_FR",
      siteName: "INA-AFRICA",
      url: "https://ina-africa.example/actualites",
    });
    expect(metadata.twitter).toMatchObject({ card: "summary" });
  });

  it("n'autorise jamais l'indexation tant que le site n'est pas en ligne", () => {
    vi.stubEnv("SITE_INDEXABLE", "");
    expect(pageMetadata({ title: "x", description: "y", path: "/" }).robots).toEqual({ index: false, follow: false });
  });

  it("article : type article, dates, rubrique et VRAIE image de couverture", () => {
    const metadata = pageMetadata({
      title: "Un article",
      description: "x".repeat(300),
      path: "/actualites/un-article",
      type: "article",
      image: shareImage({ path: "articles/couverture.webp", alt: "Une formation" }),
      publishedTime: "2026-11-01T10:00:00Z",
      modifiedTime: "2026-11-02T10:00:00Z",
      section: "Éducation",
    });
    expect((metadata.description ?? "").length).toBeLessThanOrEqual(160);
    expect(metadata.openGraph).toMatchObject({
      type: "article",
      publishedTime: "2026-11-01T10:00:00Z",
      modifiedTime: "2026-11-02T10:00:00Z",
      section: "Éducation",
      images: [
        {
          url: "https://projet.supabase.co/storage/v1/object/public/public-media/articles/couverture.webp",
          alt: "Une formation",
        },
      ],
    });
    expect(metadata.twitter).toMatchObject({ card: "summary_large_image" });
  });

  it("titre absolu (sans gabarit) sur demande", () => {
    expect(pageMetadata({ title: "Accueil", description: "x", path: "/", absoluteTitle: true }).title).toEqual({
      absolute: "Accueil",
    });
  });

  it("aucune image de partage sans image réelle", () => {
    const metadata = pageMetadata({ title: "x", description: "y", path: "/", image: shareImage(null) });
    expect(metadata.openGraph?.images).toBeUndefined();
  });
});

describe("absoluteMediaUrl", () => {
  it("rend absolue une image locale", () => {
    expect(absoluteMediaUrl("/images/a.webp")).toBe("https://ina-africa.example/images/a.webp");
  });
});
