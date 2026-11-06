import { describe, expect, it } from "vitest";

import { countWords, metaDescription, readingTimeMinutes } from "@/lib/seo/text";

describe("readingTimeMinutes", () => {
  it("n'affiche rien pour un article sans texte", () => {
    expect(readingTimeMinutes("")).toBeNull();
    expect(readingTimeMinutes("   \n ")).toBeNull();
    expect(readingTimeMinutes(null)).toBeNull();
  });

  it("compte au moins une minute", () => {
    expect(readingTimeMinutes("Quelques mots seulement.")).toBe(1);
  });

  it("arrondit à 200 mots par minute", () => {
    expect(readingTimeMinutes("mot ".repeat(200))).toBe(1);
    expect(readingTimeMinutes("mot ".repeat(700))).toBe(4); // 3,5 → 4
    expect(readingTimeMinutes("mot ".repeat(1000))).toBe(5);
  });
});

describe("countWords", () => {
  it("ignore la ponctuation isolée et les espaces multiples", () => {
    expect(countWords("Santé  et droits — l'ONG agit : 2017 !")).toBe(6);
  });
});

describe("metaDescription", () => {
  it("garde un texte court tel quel (espaces resserrés)", () => {
    expect(metaDescription("  Un   texte\ncourt. ")).toBe("Un texte court.");
  });

  it("coupe un texte long sur un mot, avec « … », sans dépasser la limite", () => {
    const text = "INA-AFRICA ".repeat(40);
    const result = metaDescription(text, 160);
    expect(result.length).toBeLessThanOrEqual(160);
    expect(result.endsWith("INA-AFRICA…")).toBe(true);
  });

  it("ne laisse pas de ponctuation avant les points de suspension", () => {
    const result = metaDescription(`${"a".repeat(50)}, ${"b".repeat(50)}, ${"c".repeat(80)}`, 110);
    expect(result).toBe(`${"a".repeat(50)}, ${"b".repeat(50)}…`);
  });
});
