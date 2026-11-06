import { describe, expect, it } from "vitest";

import {
  AUTH_MESSAGES,
  firstFieldErrors,
  loginSchema,
  newPasswordSchema,
  passwordResetRequestSchema,
  totpCodeSchema,
} from "@/lib/validation/auth";

describe("formulaire de connexion", () => {
  it("accepte une saisie valide, email en minuscules, mot de passe intact", () => {
    const result = loginSchema.safeParse({ email: "  Awa.Dossou@Exemple.ORG ", password: "  mot de passe  " });
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ email: "awa.dossou@exemple.org", password: "  mot de passe  " });
  });

  it("signale les champs vides ou invalides", () => {
    const empty = loginSchema.safeParse({ email: "", password: "" });
    expect(empty.success).toBe(false);
    expect(firstFieldErrors(empty.error!)).toEqual({ email: AUTH_MESSAGES.emailEmpty, password: AUTH_MESSAGES.passwordEmpty });

    const invalid = loginSchema.safeParse({ email: "pas-un-email", password: "x" });
    expect(firstFieldErrors(invalid.error!).email).toBe(AUTH_MESSAGES.emailInvalid);
  });

  it("refuse ce qui n'est pas du texte", () => {
    expect(loginSchema.safeParse({ email: 42, password: null }).success).toBe(false);
  });
});

describe("mot de passe oublié", () => {
  it("valide l'email", () => {
    expect(passwordResetRequestSchema.safeParse({ email: "Equipe@Exemple.org" }).data).toEqual({ email: "equipe@exemple.org" });
    expect(passwordResetRequestSchema.safeParse({ email: "equipe@" }).success).toBe(false);
  });
});

describe("code TOTP", () => {
  it.each(["123456", " 123 456 ", "123-456", "000000"])("accepte %j", (code) => {
    const result = totpCodeSchema.safeParse({ code });
    expect(result.success).toBe(true);
    expect(result.data?.code).toMatch(/^\d{6}$/);
  });

  it.each(["", "12345", "1234567", "12a456", "１２３４５６", "123 45"])("refuse %j", (code) => {
    expect(totpCodeSchema.safeParse({ code }).success).toBe(false);
  });

  it("explique l'erreur", () => {
    expect(firstFieldErrors(totpCodeSchema.safeParse({ code: "" }).error!).code).toBe(AUTH_MESSAGES.codeEmpty);
    expect(firstFieldErrors(totpCodeSchema.safeParse({ code: "12" }).error!).code).toBe(AUTH_MESSAGES.codeInvalid);
  });
});

describe("nouveau mot de passe", () => {
  const strong = "une phrase de passe solide";

  it("accepte 12 caractères ou plus avec une confirmation identique", () => {
    expect(newPasswordSchema.safeParse({ password: strong, confirmation: strong }).success).toBe(true);
    expect(newPasswordSchema.safeParse({ password: "Abcdefghijk1", confirmation: "Abcdefghijk1" }).success).toBe(true);
  });

  it("refuse moins de 12 caractères", () => {
    const result = newPasswordSchema.safeParse({ password: "Abcdefghij1", confirmation: "Abcdefghij1" });
    expect(firstFieldErrors(result.error!).password).toBe(AUTH_MESSAGES.passwordShort);
  });

  it("compte les caractères, pas les octets, pour le minimum", () => {
    expect(newPasswordSchema.safeParse({ password: "éééééééééééa", confirmation: "éééééééééééa" }).success).toBe(true);
  });

  it("refuse plus de 72 octets (limite de Supabase Auth)", () => {
    const long = "a".repeat(60) + "é".repeat(7);
    const result = newPasswordSchema.safeParse({ password: long, confirmation: long });
    expect(firstFieldErrors(result.error!).password).toBe(AUTH_MESSAGES.passwordLong);
  });

  it("refuse la répétition d'un seul caractère", () => {
    const same = "a".repeat(16);
    expect(firstFieldErrors(newPasswordSchema.safeParse({ password: same, confirmation: same }).error!).password).toBe(
      AUTH_MESSAGES.passwordWeak,
    );
  });

  it("signale une confirmation différente sur le champ de confirmation", () => {
    const result = newPasswordSchema.safeParse({ password: strong, confirmation: `${strong}!` });
    expect(firstFieldErrors(result.error!)).toEqual({ confirmation: AUTH_MESSAGES.passwordMismatch });
  });
});
