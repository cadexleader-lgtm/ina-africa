import { afterEach, describe, expect, it, vi } from "vitest";

describe("getPublicEnv", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("refuse de démarrer avec une variable manquante, en la nommant", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://ina-africa.example");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");
    const { getPublicEnv } = await import("@/lib/public-env");
    expect(() => getPublicEnv()).toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
  });

  it("accepte une configuration complète", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://ina-africa.example");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://abcdefgh.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_0123456789abcdef");
    const { getPublicEnv } = await import("@/lib/public-env");
    expect(getPublicEnv().NEXT_PUBLIC_SUPABASE_URL).toBe("https://abcdefgh.supabase.co");
  });
});
