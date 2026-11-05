import { describe, expect, it } from "vitest";

import { sanitizeSearch } from "@/server/data/articles";

describe("sanitizeSearch", () => {
  it("retire les caractères qui ont un sens dans les filtres de l'API", () => {
    expect(sanitizeSearch("santé),status.eq.draft")).toBe("santé status eq draft");
  });
  it("ignore une recherche trop courte", () => {
    expect(sanitizeSearch(" a ")).toBeNull();
    expect(sanitizeSearch(undefined)).toBeNull();
  });
  it("limite la longueur", () => {
    expect(sanitizeSearch("x".repeat(200))?.length).toBe(80);
  });
});
