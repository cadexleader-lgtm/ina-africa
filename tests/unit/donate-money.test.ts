import { afterEach, describe, expect, it, vi } from "vitest";

import { formatFcfa, parseAmount, progressPercent } from "@/lib/money";

const plain = (value: string) => value.replace(/ /g, " ");

describe("montants en francs CFA", () => {
  it("formate « 25 000 FCFA » avec des espaces insécables", () => {
    expect(plain(formatFcfa(25000))).toBe("25 000 FCFA");
    expect(plain(formatFcfa(1500000))).toBe("1 500 000 FCFA");
    expect(plain(formatFcfa(500))).toBe("500 FCFA");
    expect(formatFcfa(25000)).not.toMatch(/ /);
  });

  it("lit un montant saisi, refuse les décimales et les valeurs non numériques", () => {
    expect(parseAmount("25 000")).toBe(25000);
    expect(parseAmount("25.000 FCFA")).toBe(25000);
    expect(parseAmount("10000")).toBe(10000);
    expect(parseAmount("1500,50")).toBeNull();
    expect(parseAmount("-500")).toBeNull();
    expect(parseAmount("0")).toBeNull();
    expect(parseAmount("abc")).toBeNull();
    expect(parseAmount(undefined)).toBeNull();
  });

  it("calcule l'avancement de la jauge, plafonné à 100 %", () => {
    expect(progressPercent(250000, 1000000)).toBe(25);
    expect(progressPercent(1500000, 1000000)).toBe(100);
    expect(progressPercent(1000, null)).toBeNull();
  });
});

describe("paiement en ligne", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("aucun prestataire actif sans adaptateur, même avec des variables renseignées", async () => {
    vi.stubEnv("KKIAPAY_PRIVATE_KEY", "valeur-de-test");
    vi.stubEnv("CINETPAY_API_KEY", "valeur-de-test");
    const { getActiveProvider, isOnlinePaymentAvailable } = await import("@/server/payments/provider");
    expect(getActiveProvider()).toBeNull();
    expect(isOnlinePaymentAvailable()).toBe(false);
  });
});

describe("emails en texte brut", () => {
  it("objet sur une seule ligne, sans caractère de contrôle", async () => {
    const { safeSubject } = await import("@/server/email");
    expect(safeSubject("Bonjour\r\nBcc: pirate@exemple.com")).toBe("Bonjour Bcc: pirate@exemple.com");
    expect(safeSubject("x".repeat(300)).length).toBeLessThanOrEqual(150);
  });

  it("notification lisible, saisie recopiée telle quelle (aucun HTML interprété)", async () => {
    const { requestNotificationEmail } = await import("@/server/email/templates");
    const { subject, text } = requestNotificationEmail({
      type: "volunteer",
      fullName: "Awa <b>Dossou</b>",
      email: "awa@exemple.org",
      phone: "+229 97 00 00 00",
      message: "Ma motivation",
      details: [["Compétences", "Animation"]],
      receivedAt: new Date("2026-11-05T10:00:00Z"),
    });
    expect(subject).toBe("[INA-AFRICA] Candidature de bénévole — Awa <b>Dossou</b>");
    expect(text).toContain("Compétences : Animation");
    expect(text).toContain("Message :\nMa motivation");
  });

  it("sans clé ni expéditeur, l'envoi d'emails est inactif", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("EMAIL_FROM", "");
    const { isEmailConfigured, isNewsletterAvailable } = await import("@/server/email");
    expect(isEmailConfigured()).toBe(false);
    expect(isNewsletterAvailable()).toBe(false);
  });
});
