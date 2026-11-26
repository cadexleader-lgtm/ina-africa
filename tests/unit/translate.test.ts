import { describe, expect, it } from "vitest";

import { cookieDomains, languageFromCookie } from "@/lib/translate";

describe("langue du site (traduction Google)", () => {
  it("français par défaut", () => {
    expect(languageFromCookie("")).toBe("fr");
    expect(languageFromCookie("autre=1")).toBe("fr");
    expect(languageFromCookie("googtrans=/fr/fr")).toBe("fr");
    expect(languageFromCookie("googtrans=%E0%A4%A")).toBe("fr");
  });

  it("anglais quand Google traduit vers l'anglais", () => {
    expect(languageFromCookie("googtrans=/fr/en")).toBe("en");
    expect(languageFromCookie("a=1; googtrans=%2Ffr%2Fen; b=2")).toBe("en");
    expect(languageFromCookie("googtrans=/auto/en")).toBe("en");
  });

  it("domaines du cookie à effacer", () => {
    expect(cookieDomains("localhost")).toEqual([null]);
    expect(cookieDomains("127.0.0.1")).toEqual([null]);
    expect(cookieDomains("ina-africa.vercel.app")).toEqual([null, ".ina-africa.vercel.app", ".vercel.app"]);
    expect(cookieDomains("www.ina-africa.org")).toEqual([null, ".www.ina-africa.org", ".ina-africa.org"]);
  });
});
