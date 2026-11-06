import { describe, expect, it } from "vitest";

import { adminRedirectTarget, isPublicAdminPath, safeAdminPath, withSuite } from "@/lib/validation/auth";

describe("paramètre suite : redirection interne uniquement", () => {
  it.each([
    ["/admin", "/admin"],
    ["/admin/articles", "/admin/articles"],
    ["/admin/articles?page=2&statut=brouillon", "/admin/articles?page=2&statut=brouillon"],
    ["/admin/articles#liste", "/admin/articles#liste"],
    ["  /admin/dons  ", "/admin/dons"],
    ["/admin/nouveau-mot-de-passe", "/admin/nouveau-mot-de-passe"],
  ])("accepte %j", (input, expected) => {
    expect(safeAdminPath(input)).toBe(expected);
  });

  it.each([
    "",
    "admin",
    "https://exemple.com/admin",
    "//exemple.com/admin",
    "///exemple.com",
    "/\\exemple.com",
    "\\\\exemple.com",
    "javascript:alert(1)",
    "/admin\\..\\..\\x",
    "/administrateur",
    "/adminx",
    "/",
    "/actualites",
    "/admin/../actualites",
    "/admin/%2e%2e/actualites",
    "/admin/%2F%2Fexemple.com",
    "/admin/./x",
    "/admin\n/x",
    "/admin\t/x",
    "/admin x",
    "/admin/connexion",
    "/admin/connexion?suite=/admin",
    `/admin/${"a".repeat(600)}`,
  ])("refuse %j", (input) => {
    expect(safeAdminPath(input)).toBeNull();
  });

  it("refuse ce qui n'est pas du texte", () => {
    expect(safeAdminPath(undefined)).toBeNull();
    expect(safeAdminPath(null)).toBeNull();
    expect(safeAdminPath(["/admin"])).toBeNull();
    expect(safeAdminPath(42)).toBeNull();
  });

  it("renvoie à l'accueil de l'administration par défaut", () => {
    expect(adminRedirectTarget("https://exemple.com")).toBe("/admin");
    expect(adminRedirectTarget("/admin/projets")).toBe("/admin/projets");
  });
});

describe("withSuite", () => {
  it("ajoute un chemin sûr encodé", () => {
    expect(withSuite("/admin/connexion", "/admin/articles?page=2")).toBe("/admin/connexion?suite=%2Fadmin%2Farticles%3Fpage%3D2");
    expect(withSuite("/admin/connexion?erreur=lien", "/admin/dons")).toBe("/admin/connexion?erreur=lien&suite=%2Fadmin%2Fdons");
  });

  it("n'ajoute rien pour un chemin dangereux ou pour l'accueil", () => {
    expect(withSuite("/admin/connexion", "//exemple.com")).toBe("/admin/connexion");
    expect(withSuite("/admin/connexion", "/admin")).toBe("/admin/connexion");
    expect(withSuite("/admin/connexion", null)).toBe("/admin/connexion");
  });
});

describe("pages accessibles sans être connecté", () => {
  it("connexion, mot de passe oublié et nouveau mot de passe seulement", () => {
    expect(isPublicAdminPath("/admin/connexion")).toBe(true);
    expect(isPublicAdminPath("/admin/mot-de-passe-oublie")).toBe(true);
    expect(isPublicAdminPath("/admin/nouveau-mot-de-passe")).toBe(true);
    expect(isPublicAdminPath("/admin")).toBe(false);
    expect(isPublicAdminPath("/admin/verification")).toBe(false);
    expect(isPublicAdminPath("/admin/securite/double-authentification")).toBe(false);
    expect(isPublicAdminPath("/admin/connexionx")).toBe(false);
  });
});
