import { afterEach, describe, expect, it, vi } from "vitest";

type Header = { key: string; value: string };
type Rule = { source: string; headers: Header[] };

async function loadConfig(env: Record<string, string>) {
  vi.resetModules();
  for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value);
  const { default: config } = await import("../../next.config");
  const rules = (await config.headers!()) as Rule[];
  const all = rules.find((rule) => rule.source === "/:path*")!;
  const header = (key: string) => all.headers.find((item) => item.key === key)?.value;
  return { config, rules, header };
}

const BASE = {
  NEXT_PUBLIC_SITE_URL: "",
  NEXT_PUBLIC_SUPABASE_URL: "",
  SITE_INDEXABLE: "",
  VERCEL_ENV: "",
  VERCEL_PROJECT_PRODUCTION_URL: "",
};

describe("next.config.ts (mise en ligne)", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("garde Cache Components et le rendu partiel", async () => {
    const { config } = await loadConfig(BASE);
    expect(config.cacheComponents).toBe(true);
    expect(config.partialPrefetching).toBe(true);
  });

  it("CSP sans nonce, avec Supabase, Turnstile et les lecteurs vidéo", async () => {
    const { header, config } = await loadConfig({ ...BASE, NEXT_PUBLIC_SUPABASE_URL: "https://abcdefgh.supabase.co/" });
    const csp = header("Content-Security-Policy")!;
    expect(csp).not.toMatch(/nonce-/);
    expect(csp).not.toMatch(/unsafe-eval/);
    expect(csp).toContain("script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://cdn.kkiapay.me");
    expect(csp).toContain("img-src 'self' data: blob: https://abcdefgh.supabase.co");
    expect(csp).toContain("connect-src 'self' https://abcdefgh.supabase.co wss://abcdefgh.supabase.co");
    expect(csp).toContain("frame-src https://www.youtube-nocookie.com https://www.facebook.com https://challenges.cloudflare.com https://widget-v3.kkiapay.me");
    for (const directive of ["frame-ancestors 'none'", "base-uri 'self'", "form-action 'self'", "object-src 'none'", "upgrade-insecure-requests"]) {
      expect(csp).toContain(directive);
    }
    expect(header("X-Frame-Options")).toBe("DENY");
    expect(header("X-Content-Type-Options")).toBe("nosniff");
    expect(header("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    expect(header("Strict-Transport-Security")).toMatch(/^max-age=\d+/);
    expect(header("Permissions-Policy")).toContain("camera=()");
    expect(config.images?.remotePatterns?.[0]?.toString()).toBe(
      "https://abcdefgh.supabase.co/storage/v1/object/public/public-media/**",
    );
  });

  it("sans Supabase : aucun hôte Supabase, aucun motif d'image distant", async () => {
    const { header, config } = await loadConfig(BASE);
    expect(header("Content-Security-Policy")).not.toContain("supabase");
    expect(config.images?.remotePatterns).toEqual([]);
  });

  it("site non indexable : X-Robots-Tag noindex sur tout le site", async () => {
    const { header } = await loadConfig(BASE);
    expect(header("X-Robots-Tag")).toBe("noindex, nofollow");
  });

  it("site ouvert en production : plus de noindex global, sauf /admin et /styleguide", async () => {
    const { header, rules } = await loadConfig({ ...BASE, SITE_INDEXABLE: "true", VERCEL_ENV: "production" });
    expect(header("X-Robots-Tag")).toBeUndefined();
    expect(rules.map((rule) => rule.source)).toEqual(expect.arrayContaining(["/admin/:path*", "/styleguide"]));
  });

  it("prévisualisation Vercel : toujours noindex, même avec SITE_INDEXABLE=true", async () => {
    const { header } = await loadConfig({ ...BASE, SITE_INDEXABLE: "true", VERCEL_ENV: "preview" });
    expect(header("X-Robots-Tag")).toBe("noindex, nofollow");
  });

  it("sans NEXT_PUBLIC_SITE_URL sur Vercel : adresse de production Vercel figée au build", async () => {
    const { config } = await loadConfig({
      ...BASE,
      VERCEL_ENV: "production",
      VERCEL_PROJECT_PRODUCTION_URL: "ina-africa.vercel.app",
    });
    expect(config.env?.NEXT_PUBLIC_SITE_URL).toBe("https://ina-africa.vercel.app");
  });
});
