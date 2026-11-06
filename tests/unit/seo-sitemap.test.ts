import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { STATIC_PUBLIC_PATHS, buildSitemap, type SitemapInput } from "@/lib/seo/sitemap";

beforeEach(() => vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://ina-africa.example"));
afterEach(() => vi.unstubAllEnvs());

const EMPTY: SitemapInput = {
  areas: [],
  projects: [],
  articles: [],
  campaigns: [],
  legal: { legalNotice: false, privacyPolicy: false },
};

describe("buildSitemap", () => {
  it("sans contenu : seulement les pages fixes, adresses absolues, sans date inventée", () => {
    const sitemap = buildSitemap(EMPTY);
    expect(sitemap.map((entry) => entry.url)).toEqual(STATIC_PUBLIC_PATHS.map((path) => `https://ina-africa.example${path}`));
    expect(sitemap.every((entry) => entry.lastModified === undefined)).toBe(true);
    expect(sitemap.some((entry) => entry.url.includes("/admin") || entry.url.includes("/styleguide"))).toBe(false);
  });

  it("n'inclut les pages légales que si leur texte est rédigé", () => {
    const urls = buildSitemap({ ...EMPTY, legal: { legalNotice: true, privacyPolicy: false } }).map((entry) => entry.url);
    expect(urls).toContain("https://ina-africa.example/mentions-legales");
    expect(urls).not.toContain("https://ina-africa.example/politique-de-confidentialite");
  });

  it("liste les contenus publiés avec leur date, et date la liste des actualités", () => {
    const sitemap = buildSitemap({
      ...EMPTY,
      areas: [{ slug: "education" }],
      projects: [{ slug: "projet-a", updatedAt: "2026-10-01T00:00:00Z" }],
      articles: [
        { slug: "article-a", updatedAt: "2026-10-05T08:00:00Z" },
        { slug: "article-b", updatedAt: "2026-11-02T08:00:00Z" },
        { slug: "article-b", updatedAt: "2026-11-02T08:00:00Z" },
      ],
      campaigns: [{ slug: "appel-a" }],
    });
    const byUrl = new Map(sitemap.map((entry) => [entry.url, entry]));
    expect(byUrl.get("https://ina-africa.example/domaines/education")).toEqual({ url: "https://ina-africa.example/domaines/education" });
    expect(byUrl.get("https://ina-africa.example/projets/projet-a")?.lastModified).toBe("2026-10-01T00:00:00.000Z");
    expect(byUrl.get("https://ina-africa.example/actualites/article-b")?.lastModified).toBe("2026-11-02T08:00:00.000Z");
    expect(byUrl.get("https://ina-africa.example/actualites")?.lastModified).toBe("2026-11-02T08:00:00.000Z");
    expect(byUrl.has("https://ina-africa.example/faire-un-don/appel-a")).toBe(true);
    // Pas de doublon.
    expect(sitemap.filter((entry) => entry.url.endsWith("/article-b"))).toHaveLength(1);
  });
});
