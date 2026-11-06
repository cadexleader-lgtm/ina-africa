import { describe, expect, it } from "vitest";

import {
  canCancelDonation,
  declaredProofType,
  donationFilterParams,
  donationFiltersFromParams,
  donorLabel,
  formatFcfa,
  formatFileSize,
  formatShortDate,
  hasActiveFilters,
  mailtoHref,
  pageParam,
  proofFileProblem,
  requestDetails,
  requestFiltersFromParams,
  subscriberFiltersFromParams,
  telHref,
  withFlag,
} from "@/components/admin/gestion/labels";

const MB = 1024 * 1024;
const UUID = "11111111-1111-4111-8111-111111111111";

describe("filtres des listes (adresse)", () => {
  it("dons : ne garde que des valeurs connues", () => {
    expect(donationFiltersFromParams({ canal: "offline", statut: "paid", appel: UUID, page: "3" })).toEqual({
      page: 3,
      channel: "offline",
      status: "paid",
      campaignId: UUID,
    });
    expect(donationFiltersFromParams({ canal: "cash", statut: "ok", appel: "pas-un-id", page: "-2" })).toEqual({
      page: 1,
      channel: undefined,
      status: undefined,
      campaignId: undefined,
    });
    // Champ vide envoyé par le formulaire de filtres = pas de filtre.
    expect(donationFiltersFromParams({ canal: "", statut: ["refunded", "paid"] }).status).toBe("refunded");
  });

  it("dons : paramètres conservés par la pagination", () => {
    const params = donationFilterParams({ page: 2, channel: "online" });
    expect(params).toEqual({ canal: "online", statut: undefined, appel: undefined });
    expect(hasActiveFilters(params)).toBe(true);
    expect(hasActiveFilters({ canal: undefined })).toBe(false);
  });

  it("demandes et newsletter", () => {
    expect(requestFiltersFromParams({ type: "volunteer", statut: "unread" })).toEqual({
      page: 1,
      type: "volunteer",
      status: "unread",
    });
    expect(requestFiltersFromParams({ type: "spam" }).type).toBeUndefined();
    expect(subscriberFiltersFromParams({ statut: "subscribed", page: "2" })).toEqual({ page: 2, status: "subscribed" });
    expect(pageParam({ page: "1.5" })).toBe(1);
  });

  it("adresse de retour avec message", () => {
    expect(withFlag("/admin/newsletter", "supprime")).toBe("/admin/newsletter?supprime=1");
    expect(withFlag("/admin/newsletter?page=2", "supprime")).toBe("/admin/newsletter?page=2&supprime=1");
  });
});

describe("dons", () => {
  it("seul un don HORS LIGNE reçu peut être annulé (jamais un don en ligne)", () => {
    expect(canCancelDonation({ channel: "offline", status: "paid" })).toBe(true);
    expect(canCancelDonation({ channel: "offline", status: "cancelled" })).toBe(false);
    expect(canCancelDonation({ channel: "online", status: "paid" })).toBe(false);
    expect(canCancelDonation({ channel: "online", status: "pending" })).toBe(false);
  });

  it("nom du donateur dans l'administration", () => {
    expect(donorLabel({ donorName: "Awa", isAnonymous: false })).toBe("Awa");
    expect(donorLabel({ donorName: "Awa", isAnonymous: true })).toBe("Awa (anonyme sur le site)");
    expect(donorLabel({ donorName: "  ", isAnonymous: false })).toBe("Donateur non renseigné");
  });

  it("montants en FCFA cohérents avec src/lib/money.ts", () => {
    expect(formatFcfa(25000).replace(/\u00a0/g, " ")).toBe("25 000 FCFA");
  });
});

describe("justificatif choisi dans le navigateur", () => {
  it("type annoncé : celui du navigateur, sinon déduit de l'extension", () => {
    expect(declaredProofType({ name: "recu.pdf", type: "application/pdf" })).toBe("application/pdf");
    expect(declaredProofType({ name: "SMS.JPG", type: "" })).toBe("image/jpeg");
    expect(declaredProofType({ name: "page.html", type: "text/html" })).toBeNull();
    expect(declaredProofType({ name: "logo.svg", type: "image/svg+xml" })).toBeNull();
  });

  it("refuse avant l'envoi : vide, plus de 10 Mo, format non accepté", () => {
    expect(proofFileProblem({ name: "recu.pdf", type: "application/pdf", size: 0 })).toMatch(/vide/);
    expect(proofFileProblem({ name: "recu.pdf", type: "application/pdf", size: 10 * MB + 1 })).toMatch(/10 Mo/);
    expect(proofFileProblem({ name: "recu.docx", type: "application/msword", size: 1000 })).toMatch(/Format/);
    expect(proofFileProblem({ name: "recu.pdf", type: "application/pdf", size: 10 * MB })).toBeNull();
  });

  it("taille lisible", () => {
    expect(formatFileSize(2.5 * MB)).toBe("2,5 Mo");
    expect(formatFileSize(850 * 1024)).toBe("850 Ko");
  });
});

describe("demandes", () => {
  it("détails traduits, valeurs vides ignorées", () => {
    expect(requestDetails({ kind: "sponsorship", city: "Cotonou", skills: " ", extra: { a: 1 } })).toEqual([
      { label: "Type de collaboration", value: "Sponsoring" },
      { label: "Ville de résidence", value: "Cotonou" },
    ]);
  });

  it("liens mailto et tel sûrs", () => {
    expect(mailtoHref("awa@exemple.org", "Re : Bénévolat")).toBe("mailto:awa@exemple.org?subject=Re%20%3A%20B%C3%A9n%C3%A9volat");
    expect(mailtoHref("awa@exemple.org?bcc=x@y.z", null)).toBeNull();
    expect(mailtoHref(null)).toBeNull();
    expect(telHref("+229 01 97 00 00 00")).toBe("tel:+2290197000000");
    expect(telHref("97-00-00-00")).toBe("tel:97000000");
    expect(telHref("javascript:alert(1)")).toBeNull();
  });
});

describe("dates", () => {
  it("une date seule ne change pas de jour avec le fuseau", () => {
    expect(formatShortDate("2026-11-06")).toBe("6 nov. 2026");
    expect(formatShortDate(null)).toBe("—");
  });
});
