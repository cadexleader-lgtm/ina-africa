import { afterEach, describe, expect, it, vi } from "vitest";

import { isSiteIndexable, pageRobots } from "@/lib/seo/indexing";
import { PRIVATE_PATHS, robotsRules } from "@/lib/seo/robots";

afterEach(() => vi.unstubAllEnvs());

describe("isSiteIndexable", () => {
  it("n'est vrai que pour la valeur exacte « true »", () => {
    expect(isSiteIndexable({ SITE_INDEXABLE: "true" })).toBe(true);
    for (const value of [undefined, "", "TRUE", "True", "1", "yes", " true", "true "]) {
      expect(isSiteIndexable({ SITE_INDEXABLE: value })).toBe(false);
    }
  });

  it("lit la variable d'environnement par défaut", () => {
    vi.stubEnv("SITE_INDEXABLE", "true");
    expect(isSiteIndexable()).toBe(true);
    vi.stubEnv("SITE_INDEXABLE", "false");
    expect(isSiteIndexable()).toBe(false);
  });
});

describe("pageRobots", () => {
  it("interdit tout tant que le site n'est pas indexable, même pour une page indexable", () => {
    expect(pageRobots({}, false)).toEqual({ index: false, follow: false });
    expect(pageRobots({ noindex: true }, false)).toEqual({ index: false, follow: false });
  });

  it("indexe le site en ligne, sauf les pages marquées noindex (liens suivis)", () => {
    expect(pageRobots({}, true)).toEqual({ index: true, follow: true });
    expect(pageRobots({ noindex: true }, true)).toEqual({ index: false, follow: true });
  });
});

describe("robotsRules", () => {
  it("site en construction : tout est interdit et aucun plan du site n'est annoncé", () => {
    const robots = robotsRules(false);
    expect(robots.rules).toEqual({ userAgent: "*", disallow: "/" });
    expect(robots.sitemap).toBeUndefined();
  });

  it("site en ligne : public autorisé, /admin et /styleguide interdits, plan du site absolu", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://ina-africa.example");
    const robots = robotsRules(true);
    expect(robots.rules).toEqual({ userAgent: "*", allow: "/", disallow: [...PRIVATE_PATHS] });
    expect(PRIVATE_PATHS).toContain("/admin");
    expect(PRIVATE_PATHS).toContain("/styleguide");
    expect(robots.sitemap).toBe("https://ina-africa.example/sitemap.xml");
  });

  it("suit SITE_INDEXABLE par défaut", () => {
    vi.stubEnv("SITE_INDEXABLE", "");
    expect(robotsRules().rules).toEqual({ userAgent: "*", disallow: "/" });
    vi.stubEnv("SITE_INDEXABLE", "true");
    expect(robotsRules().sitemap).toBeDefined();
  });
});
