import { describe, expect, it } from "vitest";

import {
  amountsToText,
  countChars,
  errorCount,
  fieldError,
  linesToPoints,
  moveItem,
  nextSlug,
  normalizeSlugInput,
  unmatchedErrors,
} from "@/components/admin/contenus/form-utils";
import { formatFileSize } from "@/components/admin/contenus/labels";
import { adminNavFor, ADMIN_NAV, isActiveNavHref } from "@/components/admin/contenus/nav-items";
import { firstParam, keptParams, stateNotice } from "@/components/admin/contenus/page-helpers";
import {
  fitsUploadBudget,
  isAcceptedImageType,
  LARGE_WIDTH,
  needsSmallVersion,
  scaledSize,
  SMALL_WIDTH,
  UPLOAD_BUDGET_BYTES,
} from "@/components/admin/media/image-convert";
import { siteSettingsInputSchema } from "@/lib/validation/admin/settings";
import { parseAdminInput, slugify } from "@/lib/validation/admin/common";
import { SLUG } from "@/lib/validation/forms";

const hrefs = (role: Parameters<typeof adminNavFor>[0]) => adminNavFor(role).flatMap((group) => group.items.map((item) => item.href));

describe("menu de l'administration selon le rôle", () => {
  it("éditeur : tableau de bord, articles, médias seulement", () => {
    expect(hrefs("editor")).toEqual(["/admin", "/admin/articles", "/admin/medias"]);
  });

  it("admin : tout sauf les comptes (dons, demandes, newsletter compris)", () => {
    const links = hrefs("admin");
    expect(links).not.toContain("/admin/comptes");
    for (const href of ["/admin/dons", "/admin/demandes", "/admin/newsletter", "/admin/parametres", "/admin/categories", "/admin/appels-aux-dons"]) {
      expect(links).toContain(href);
    }
    expect(links).toHaveLength(ADMIN_NAV.flatMap((group) => group.items).length - 1);
  });

  it("super_admin : tout", () => {
    expect(hrefs("super_admin")).toHaveLength(ADMIN_NAV.flatMap((group) => group.items).length);
    expect(hrefs("super_admin")).toContain("/admin/comptes");
  });

  it("aucun groupe vide n'est affiché", () => {
    expect(adminNavFor("editor").every((group) => group.items.length > 0)).toBe(true);
    expect(adminNavFor("editor").map((group) => group.label)).toEqual([null, "Contenus"]);
  });

  it("lien actif : page exacte ou sous-page, tableau de bord exact seulement", () => {
    expect(isActiveNavHref("/admin", "/admin")).toBe(true);
    expect(isActiveNavHref("/admin", "/admin/articles")).toBe(false);
    expect(isActiveNavHref("/admin/articles", "/admin/articles/123")).toBe(true);
    expect(isActiveNavHref("/admin/articles", "/admin/articles/")).toBe(true);
    expect(isActiveNavHref("/admin/dons", "/admin/donsX")).toBe(false);
    expect(isActiveNavHref("/admin/dons", null)).toBe(false);
  });
});

describe("compteur de caractères", () => {
  it("compte comme le serveur (espaces réduits sur une ligne)", () => {
    const state = countChars("  Bonjour    le   monde  ", 160);
    expect(state.count).toBe("Bonjour le monde".length);
    expect(state.over).toBe(false);
    expect(state.label).toBe("16 caractères sur 160");
  });

  it("garde les retours à la ligne d'un texte long", () => {
    expect(countChars("a\nb", 10, true).count).toBe(3);
    expect(countChars("a\n\n\n\nb", 10, true).count).toBe(4);
  });

  it("signale le dépassement et l'approche de la limite", () => {
    const over = countChars("x".repeat(75), 70);
    expect(over.over).toBe(true);
    expect(over.remaining).toBe(-5);
    expect(over.label).toContain("5 de trop");
    expect(countChars("x".repeat(63), 70).near).toBe(true);
    expect(countChars("x".repeat(10), 70).near).toBe(false);
    expect(countChars("", 70).label).toBe("0 caractère sur 70");
  });
});

describe("adresse lisible (slug) depuis le titre", () => {
  it("suit le titre tant qu'elle n'a pas été modifiée", () => {
    expect(nextSlug({ title: "Rentrée scolaire 2026 !", slug: "", edited: false, locked: false })).toBe("rentree-scolaire-2026");
  });

  it("ne bouge plus une fois modifiée à la main ou déjà publiée", () => {
    expect(nextSlug({ title: "Nouveau titre", slug: "mon-adresse", edited: true, locked: false })).toBe("mon-adresse");
    expect(nextSlug({ title: "Nouveau titre", slug: "ancienne", edited: false, locked: true })).toBe("ancienne");
  });

  it("produit toujours une adresse acceptée par la base", () => {
    for (const title of ["Éducation & santé des filles", "  Œuvre — Été 2026  ", "Ça marche ?!"]) {
      expect(slugify(title)).toMatch(SLUG);
    }
  });

  it("nettoie la saisie (minuscules, sans accent, tirets)", () => {
    expect(normalizeSlugInput("Été Solidaire 2026")).toBe("ete-solidaire-2026");
    expect(normalizeSlugInput("--a__b--")).toBe("a-b-");
    expect(normalizeSlugInput("x".repeat(200))).toHaveLength(120);
  });
});

describe("erreurs par champ", () => {
  const errors = { title: ["Indiquez le titre."], "offlineDonationInstructions.0.label": ["Intitulé ?"], _form: ["Erreur générale"] };

  it("lit le premier message d'un champ, imbriqué compris", () => {
    expect(fieldError(errors, "title")).toBe("Indiquez le titre.");
    expect(fieldError(errors, "offlineDonationInstructions.0.label")).toBe("Intitulé ?");
    expect(fieldError(errors, "slug")).toBeNull();
    expect(fieldError(undefined, "slug")).toBeNull();
  });

  it("isole les erreurs sans champ affiché", () => {
    expect(unmatchedErrors(errors, ["title", "offlineDonationInstructions.0.label"])).toEqual(["Erreur générale"]);
    expect(errorCount(errors)).toBe(3);
  });

  it("les clés renvoyées par le serveur correspondent aux champs du formulaire", () => {
    const result = parseAdminInput(siteSettingsInputSchema, {
      offlineDonationInstructions: [{ method: "mobile_money", label: "" }],
      socialLinks: { facebook: "http://facebook.com/ina" },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(Object.keys(result.fieldErrors)).toEqual(
        expect.arrayContaining(["offlineDonationInstructions.0.label", "socialLinks.facebook"]),
      );
    }
  });
});

describe("listes « une ligne = un point » et montants", () => {
  it("découpe par ligne, retire les puces et les lignes vides", () => {
    expect(linesToPoints("- Éduquer\n\n• Soigner\n2. Former\n   ")).toEqual(["Éduquer", "Soigner", "Former"]);
    expect(linesToPoints(null)).toEqual([]);
  });

  it("affiche les montants suggérés dans un format relu par le serveur", () => {
    const text = amountsToText([1000, 5000, 10000]);
    const parsed = siteSettingsInputSchema.safeParse({ donationSuggestedAmounts: text });
    expect(parsed.success && parsed.data.donationSuggestedAmounts).toEqual([1000, 5000, 10000]);
  });
});

describe("ordre d'affichage", () => {
  it("déplace un élément d'un cran", () => {
    expect(moveItem(["a", "b", "c"], 1, -1)).toEqual(["b", "a", "c"]);
    expect(moveItem(["a", "b", "c"], 1, 1)).toEqual(["a", "c", "b"]);
  });

  it("refuse de sortir de la liste", () => {
    expect(moveItem(["a", "b"], 0, -1)).toBeNull();
    expect(moveItem(["a", "b"], 1, 1)).toBeNull();
  });
});

describe("préparation des photos (calculs)", () => {
  it("réduit à la largeur voulue sans déformer", () => {
    expect(scaledSize(4000, 3000, LARGE_WIDTH)).toEqual({ width: 2000, height: 1500 });
    expect(scaledSize(4000, 3000, SMALL_WIDTH)).toEqual({ width: 800, height: 600 });
  });

  it("n'agrandit jamais une petite photo", () => {
    expect(scaledSize(640, 480, LARGE_WIDTH)).toEqual({ width: 640, height: 480 });
    expect(needsSmallVersion(640)).toBe(false);
    expect(needsSmallVersion(1200)).toBe(true);
  });

  it("refuse les dimensions invalides", () => {
    expect(scaledSize(0, 100, 800)).toEqual({ width: 0, height: 0 });
  });

  it("respecte la limite d'envoi des Server Actions (4 Mo)", () => {
    expect(UPLOAD_BUDGET_BYTES).toBeLessThan(4 * 1024 * 1024);
    expect(fitsUploadBudget(2 * 1024 * 1024, 500 * 1024)).toBe(true);
    expect(fitsUploadBudget(3.9 * 1024 * 1024, 200 * 1024)).toBe(false);
  });

  it("n'accepte que JPEG, PNG et WebP (jamais SVG)", () => {
    expect(isAcceptedImageType("image/jpeg")).toBe(true);
    expect(isAcceptedImageType("image/webp")).toBe(true);
    expect(isAcceptedImageType("image/svg+xml")).toBe(false);
    expect(isAcceptedImageType("image/heic")).toBe(false);
  });

  it("affiche une taille lisible", () => {
    expect(formatFileSize(512)).toBe("512 o");
    expect(formatFileSize(2048)).toBe("2 ko");
    expect(formatFileSize(1.5 * 1024 * 1024)).toBe("1,5 Mo");
  });
});

describe("paramètres d'adresse des pages", () => {
  it("message après redirection", () => {
    expect(stateNotice({ etat: "cree" }, { created: "Créé." })).toEqual({ tone: "success", message: "Créé." });
    expect(stateNotice({ etat: "supprime" }, { created: "Créé." })).toBeNull();
    expect(stateNotice({ etat: ["supprime"] }, { deleted: "Supprimé." })?.message).toBe("Supprimé.");
  });

  it("filtres conservés par la pagination", () => {
    expect(keptParams({ q: "école", status: "", page: "2", other: "x" }, ["q", "status"])).toEqual({ q: "école" });
    expect(firstParam({ q: ["a", "b"] }, "q")).toBe("a");
  });
});
