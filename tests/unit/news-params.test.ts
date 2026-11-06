import { describe, expect, it } from "vitest";

import { isValidSlug, newsHref, newsQuery, parseNewsParams } from "@/components/news/news-params";

describe("parseNewsParams", () => {
  it("lit catégorie, recherche et page", () => {
    expect(parseNewsParams({ categorie: "sante", q: "  formation   des jeunes ", page: "3" })).toEqual({
      category: "sante",
      q: "formation des jeunes",
      page: 3,
    });
  });

  it("ignore les valeurs mal formées sans erreur", () => {
    expect(parseNewsParams({ categorie: "../admin", page: "-2" })).toEqual({ category: undefined, q: "", page: 1 });
    expect(parseNewsParams({ page: "abc" }).page).toBe(1);
    expect(parseNewsParams({ page: "0" }).page).toBe(1);
    expect(parseNewsParams({ page: "99999999999" }).page).toBe(1);
    expect(parseNewsParams({}).q).toBe("");
  });

  it("prend la première valeur d'un paramètre répété et limite la recherche", () => {
    expect(parseNewsParams({ categorie: ["a", "b"], q: "x".repeat(200) })).toEqual({ category: "a", q: "x".repeat(80), page: 1 });
  });
});

describe("isValidSlug", () => {
  it("suit la règle de la base", () => {
    expect(isValidSlug("sante-et-droits")).toBe(true);
    expect(isValidSlug("Sante")).toBe(false);
    expect(isValidSlug("a--b")).toBe(false);
    expect(isValidSlug("-a")).toBe(false);
    expect(isValidSlug("a".repeat(121))).toBe(false);
  });
});

describe("newsHref / newsQuery", () => {
  it("construit des adresses canoniques (page 1 sans paramètre)", () => {
    expect(newsHref({})).toBe("/actualites");
    expect(newsHref({ page: 1 })).toBe("/actualites");
    expect(newsHref({ category: "sante", page: 2 })).toBe("/actualites?categorie=sante&page=2");
    expect(newsHref({ q: "école & santé" })).toBe("/actualites?q=%C3%A9cole+%26+sant%C3%A9");
  });

  it("ne garde que les filtres reconnus", () => {
    expect(newsQuery({ category: "sante", q: "" })).toEqual({ categorie: "sante" });
  });
});
