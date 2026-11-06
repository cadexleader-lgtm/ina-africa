import { describe, expect, it } from "vitest";

import { nextAuthStep, roleAtLeast as guardRoleAtLeast, sessionFromState, type AuthState } from "@/server/auth/guard";
import { APP_ROLES, isAppRole, requiresMfa, roleAtLeast, type AppRole } from "@/server/auth/roles";

describe("roleAtLeast", () => {
  const cases: [AppRole, AppRole, boolean][] = [
    ["editor", "editor", true],
    ["editor", "admin", false],
    ["editor", "super_admin", false],
    ["admin", "editor", true],
    ["admin", "admin", true],
    ["admin", "super_admin", false],
    ["super_admin", "editor", true],
    ["super_admin", "admin", true],
    ["super_admin", "super_admin", true],
  ];
  it.each(cases)("%s ≥ %s : %s", (role, min, expected) => {
    expect(roleAtLeast(role, min)).toBe(expected);
  });

  it("est réexporté tel quel par le garde (contrat)", () => {
    expect(guardRoleAtLeast).toBe(roleAtLeast);
  });
});

describe("rôles", () => {
  it("reconnaît uniquement les trois rôles de la base", () => {
    expect(APP_ROLES).toEqual(["editor", "admin", "super_admin"]);
    expect(isAppRole("admin")).toBe(true);
    expect(isAppRole("ADMIN")).toBe(false);
    expect(isAppRole("owner")).toBe(false);
    expect(isAppRole(null)).toBe(false);
  });

  it("exige la double authentification pour admin et super_admin seulement", () => {
    expect(requiresMfa("editor")).toBe(false);
    expect(requiresMfa("admin")).toBe(true);
    expect(requiresMfa("super_admin")).toBe(true);
  });
});

function signedIn(role: AppRole, aal: "aal1" | "aal2", hasVerifiedFactor: boolean): AuthState {
  return {
    kind: "signed_in",
    userId: "11111111-1111-4111-8111-111111111111",
    email: "equipe@exemple.org",
    fullName: "Équipe",
    role,
    aal,
    hasVerifiedFactor,
    verifiedFactorId: hasVerifiedFactor ? "22222222-2222-4222-8222-222222222222" : null,
  };
}

describe("parcours de connexion (nextAuthStep)", () => {
  it("renvoie vers la connexion sans session, en gardant la page demandée", () => {
    expect(nextAuthStep({ kind: "anonymous" }, "/admin/articles")).toBe("/admin/connexion?suite=%2Fadmin%2Farticles");
    expect(nextAuthStep({ kind: "unconfigured" }, null)).toBe("/admin/connexion");
  });

  it("déconnecte un compte sans rôle", () => {
    expect(nextAuthStep({ kind: "no_role", userId: "x", email: "x@exemple.org" }, null)).toBe("/auth/sans-acces");
  });

  it("force l'activation de la double authentification pour admin et super_admin", () => {
    expect(nextAuthStep(signedIn("admin", "aal1", false), null)).toBe("/admin/securite/double-authentification");
    expect(nextAuthStep(signedIn("super_admin", "aal1", false), "/admin/dons")).toBe(
      "/admin/securite/double-authentification?suite=%2Fadmin%2Fdons",
    );
  });

  it("demande le code quand un facteur existe et que la session est aal1", () => {
    expect(nextAuthStep(signedIn("admin", "aal1", true), null)).toBe("/admin/verification");
    expect(nextAuthStep(signedIn("editor", "aal1", true), null)).toBe("/admin/verification");
  });

  it("laisse passer un éditeur sans facteur et une session aal2", () => {
    expect(nextAuthStep(signedIn("editor", "aal1", false), null)).toBeNull();
    expect(nextAuthStep(signedIn("admin", "aal2", true), null)).toBeNull();
  });
});

describe("session complète (sessionFromState)", () => {
  it("refuse admin et super_admin sans aal2", () => {
    expect(sessionFromState(signedIn("admin", "aal1", true))).toBeNull();
    expect(sessionFromState(signedIn("super_admin", "aal1", false))).toBeNull();
    expect(sessionFromState({ kind: "anonymous" })).toBeNull();
    expect(sessionFromState({ kind: "no_role", userId: "x", email: "x@exemple.org" })).toBeNull();
  });

  it("accepte un éditeur sans double authentification (mfaVerified = false)", () => {
    expect(sessionFromState(signedIn("editor", "aal1", false))).toEqual({
      userId: "11111111-1111-4111-8111-111111111111",
      email: "equipe@exemple.org",
      fullName: "Équipe",
      role: "editor",
      mfaVerified: false,
    });
  });

  it("accepte un admin en aal2", () => {
    expect(sessionFromState(signedIn("admin", "aal2", true))?.mfaVerified).toBe(true);
  });
});
