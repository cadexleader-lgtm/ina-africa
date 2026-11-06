import { afterEach, describe, expect, it, vi } from "vitest";

import { LOCAL_SITE_URL, resolveSiteOrigin } from "@/lib/site-url";

describe("resolveSiteOrigin", () => {
  it("préfère NEXT_PUBLIC_SITE_URL (origine seule, sans barre finale)", () => {
    expect(
      resolveSiteOrigin({
        NEXT_PUBLIC_SITE_URL: "https://ina-africa.example/une/page",
        VERCEL_ENV: "production",
        VERCEL_PROJECT_PRODUCTION_URL: "ina-africa.vercel.app",
      }),
    ).toBe("https://ina-africa.example");
  });

  it("accepte une adresse saisie sans https://", () => {
    expect(resolveSiteOrigin({ NEXT_PUBLIC_SITE_URL: "ina-africa.example" })).toBe("https://ina-africa.example");
  });

  it("production Vercel sans adresse : adresse de production fournie par Vercel", () => {
    expect(
      resolveSiteOrigin({
        VERCEL_ENV: "production",
        VERCEL_PROJECT_PRODUCTION_URL: "ina-africa.vercel.app",
        VERCEL_BRANCH_URL: "ina-africa-git-main-equipe.vercel.app",
        VERCEL_URL: "ina-africa-abc123-equipe.vercel.app",
      }),
    ).toBe("https://ina-africa.vercel.app");
  });

  it("prévisualisation Vercel : adresse de la branche, sinon du déploiement", () => {
    expect(
      resolveSiteOrigin({
        VERCEL_ENV: "preview",
        VERCEL_PROJECT_PRODUCTION_URL: "ina-africa.vercel.app",
        VERCEL_BRANCH_URL: "ina-africa-git-essai-equipe.vercel.app",
        VERCEL_URL: "ina-africa-abc123-equipe.vercel.app",
      }),
    ).toBe("https://ina-africa-git-essai-equipe.vercel.app");
    expect(resolveSiteOrigin({ VERCEL_ENV: "preview", VERCEL_URL: "ina-africa-abc123-equipe.vercel.app" })).toBe(
      "https://ina-africa-abc123-equipe.vercel.app",
    );
  });

  it("valeur mal formée ou vide : passe à la suivante, jamais d'erreur", () => {
    expect(resolveSiteOrigin({ NEXT_PUBLIC_SITE_URL: "http://", VERCEL_ENV: "production", VERCEL_URL: "x.vercel.app" })).toBe(
      "https://x.vercel.app",
    );
    expect(resolveSiteOrigin({ NEXT_PUBLIC_SITE_URL: "ftp://ina-africa.example" })).toBe(LOCAL_SITE_URL);
    expect(resolveSiteOrigin({ NEXT_PUBLIC_SITE_URL: "   " })).toBe(LOCAL_SITE_URL);
    expect(resolveSiteOrigin({})).toBe(LOCAL_SITE_URL);
  });
});

describe("getPublicEnv sans NEXT_PUBLIC_SITE_URL", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("ne bloque pas Supabase : l'adresse du site se replie sur celle de Vercel", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "ina-africa.vercel.app");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://abcdefgh.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_0123456789abcdef");
    const { getPublicEnv } = await import("@/lib/public-env");
    expect(getPublicEnv().NEXT_PUBLIC_SITE_URL).toBe("https://ina-africa.vercel.app");
  });
});
