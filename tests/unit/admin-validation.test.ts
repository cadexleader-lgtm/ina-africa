import { describe, expect, it } from "vitest";

import { changeRoleSchema, inviteMemberSchema } from "@/lib/validation/admin/accounts";
import { parseAdminInput, slugify, todayIso } from "@/lib/validation/admin/common";
import {
  actionAreaInputSchema,
  articleFiltersSchema,
  articleInputSchema,
  articleUpdateSchema,
  categoryInputSchema,
  galleryItemInputSchema,
  partnerInputSchema,
  projectInputSchema,
  rejectArticleSchema,
  reorderSchema,
  teamMemberInputSchema,
} from "@/lib/validation/admin/content";
import {
  campaignInputSchema,
  cancelDonationSchema,
  donationFiltersSchema,
  offlineDonationSchema,
} from "@/lib/validation/admin/donations";
import { requestFiltersSchema, requestStatusSchema } from "@/lib/validation/admin/inbox";
import { mediaUploadFieldsSchema } from "@/lib/validation/admin/media";
import { siteSettingsInputSchema } from "@/lib/validation/admin/settings";

import { DOC, ID } from "./admin-test-utils";

function errorsOf(schema: Parameters<typeof parseAdminInput>[0], input: unknown) {
  const result = parseAdminInput(schema, input);
  if (result.ok) throw new Error("validation attendue en échec");
  return result.fieldErrors;
}

function dataOf<T>(schema: Parameters<typeof parseAdminInput>[0], input: unknown): T {
  const result = parseAdminInput(schema, input);
  if (!result.ok) throw new Error(`validation en échec : ${JSON.stringify(result.fieldErrors)}`);
  return result.data as T;
}

describe("briques communes", () => {
  it("calcule une adresse lisible à partir d'un titre", () => {
    expect(slugify("Rentrée scolaire 2026 : œuvres & écoles !")).toBe("rentree-scolaire-2026-oeuvres-ecoles");
    expect(slugify("  --  ")).toBe("");
    expect(slugify("a".repeat(200))).toHaveLength(120);
  });

  it("donne des messages en français, jamais les messages anglais par défaut", () => {
    const errors = errorsOf(teamMemberInputSchema, { fullName: 42, position: "" });
    expect(errors.fullName?.[0]).toBe("Indiquez le nom de la personne.");
    expect(errors.position?.[0]).toBe("Indiquez la fonction de la personne.");
    for (const messages of Object.values(errors)) {
      for (const message of messages) expect(message).not.toMatch(/Invalid|expected|received/);
    }
  });

  it("indique le chemin des erreurs imbriquées (listes, objets)", () => {
    const errors = errorsOf(siteSettingsInputSchema, {
      offlineDonationInstructions: [{ method: "cash", label: "Caisse" }],
    });
    expect(Object.keys(errors)).toContain("offlineDonationInstructions.0.method");
  });
});

describe("articles", () => {
  const valid = { title: "Rentrée solidaire", content: DOC };

  it("accepte un brouillon minimal et vide les champs facultatifs", () => {
    const data = dataOf<Record<string, unknown>>(articleInputSchema, { ...valid, excerpt: "  ", categoryId: "" });
    expect(data).toMatchObject({ title: "Rentrée solidaire", slug: null, excerpt: null, categoryId: null });
  });

  it("enregistre la sortie du schéma du contenu riche (propriétés inconnues retirées)", () => {
    const content = {
      type: "doc",
      onclick: "alert(1)",
      content: [{ type: "paragraph", style: "x", content: [{ type: "text", text: "Bonjour", extra: 1 }] }],
    };
    const data = dataOf<{ content: unknown }>(articleInputSchema, { ...valid, content: JSON.stringify(content) });
    expect(data.content).toEqual({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Bonjour" }] }] });
  });

  it("refuse un lien javascript: dans le contenu riche, avec un message clair", () => {
    const content = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "clic", marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }] }],
        },
      ],
    };
    expect(errorsOf(articleInputSchema, { ...valid, content }).content?.[0]).toContain("Lien non autorisé");
    expect(errorsOf(articleInputSchema, { ...valid, content: "<p>html</p>" }).content?.[0]).toBe(
      "Le contenu contient des éléments non autorisés.",
    );
  });

  it("exige le texte alternatif d'une image de couverture", () => {
    const errors = errorsOf(articleInputSchema, { ...valid, coverImagePath: "articles/2026/11/abc.webp" });
    expect(errors.coverImageAlt?.[0]).toContain("texte alternatif");
  });

  it("refuse une image hors de la médiathèque et une adresse mal formée", () => {
    const errors = errorsOf(articleInputSchema, {
      ...valid,
      coverImagePath: "https://exemple.com/a.jpg",
      coverImageAlt: "x",
      slug: "Pas Bon",
    });
    expect(errors.coverImagePath).toBeDefined();
    expect(errors.slug?.[0]).toContain("Adresse invalide");
  });

  it("respecte les limites de la base (titre 3 à 200, SEO 70 / 160)", () => {
    const errors = errorsOf(articleInputSchema, { ...valid, title: "ab", seoTitle: "x".repeat(71), seoDescription: "x".repeat(161) });
    expect(Object.keys(errors).sort()).toEqual(["seoDescription", "seoTitle", "title"]);
  });

  it("exige un identifiant valide pour une modification", () => {
    expect(errorsOf(articleUpdateSchema, { ...valid, id: "1" }).id?.[0]).toBe("Identifiant invalide.");
    expect(dataOf<{ id: string }>(articleUpdateSchema, { ...valid, id: ID.a }).id).toBe(ID.a);
  });

  it("exige une remarque pour renvoyer un article à son auteur", () => {
    expect(errorsOf(rejectArticleSchema, { id: ID.a, reviewNote: " " }).reviewNote).toBeDefined();
  });

  it("filtres de liste : une valeur invalide est ignorée, jamais une erreur", () => {
    expect(articleFiltersSchema.parse({ page: "abc", status: "secret", categoryId: "x", mine: "on" })).toEqual({
      page: 1,
      status: undefined,
      categoryId: undefined,
      q: undefined,
      mine: true,
    });
  });

  it("catégorie : nom obligatoire", () => {
    expect(errorsOf(categoryInputSchema, { name: "" }).name?.[0]).toBe("Indiquez le nom de la catégorie.");
  });
});

describe("projets, domaines, partenaires, galerie", () => {
  it("projet : la date de fin suit la date de début", () => {
    const errors = errorsOf(projectInputSchema, {
      title: "Puits de Godomey",
      status: "ongoing",
      startDate: "2026-05-01",
      endDate: "2026-04-01",
    });
    expect(errors.endDate?.[0]).toContain("postérieure");
  });

  it("projet : refuse une date impossible et un état inconnu", () => {
    const errors = errorsOf(projectInputSchema, { title: "Projet", status: "secret", startDate: "2026-02-30" });
    expect(errors.startDate?.[0]).toContain("Date invalide");
    expect(errors.status?.[0]).toBe("Choisissez l'état du projet.");
  });

  it("projet : case « mis en avant » lue depuis un formulaire", () => {
    expect(dataOf<{ isFeatured: boolean }>(projectInputSchema, { title: "Projet", status: "planned", isFeatured: "on" }).isFeatured).toBe(true);
  });

  it("domaine : ordre d'affichage entier", () => {
    expect(errorsOf(actionAreaInputSchema, { title: "Éducation", displayOrder: "1.5" }).displayOrder).toBeDefined();
    expect(dataOf<{ displayOrder: number }>(actionAreaInputSchema, { title: "Éducation", displayOrder: "3" }).displayOrder).toBe(3);
  });

  it("partenaire : site web http(s) uniquement, sans identifiants", () => {
    const base = { name: "Mairie", kind: "partner" };
    expect(errorsOf(partnerInputSchema, { ...base, websiteUrl: "javascript:alert(1)" }).websiteUrl).toBeDefined();
    expect(errorsOf(partnerInputSchema, { ...base, websiteUrl: "https://user:pass@exemple.org" }).websiteUrl).toBeDefined();
    expect(dataOf<{ websiteUrl: string }>(partnerInputSchema, { ...base, websiteUrl: "https://exemple.org" }).websiteUrl).toBe(
      "https://exemple.org",
    );
  });

  it("galerie : une photo exige son image et son texte alternatif", () => {
    expect(errorsOf(galleryItemInputSchema, { itemType: "photo" }).imagePath).toBeDefined();
    expect(errorsOf(galleryItemInputSchema, { itemType: "photo", imagePath: "galerie/2026/11/a.webp" }).imageAlt).toBeDefined();
    const photo = dataOf<Record<string, unknown>>(galleryItemInputSchema, {
      itemType: "photo",
      imagePath: "galerie/2026/11/a.webp",
      imageAlt: "Distribution de kits scolaires",
      videoUrl: "https://youtube.com/watch?v=dQw4w9WgXcQ",
    });
    expect(photo).toMatchObject({ videoUrl: null, videoProvider: null });
  });

  it("galerie : vidéo YouTube ou Facebook seulement, fournisseur déduit de l'adresse", () => {
    const yt = dataOf<Record<string, unknown>>(galleryItemInputSchema, {
      itemType: "video",
      videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      videoProvider: "facebook",
    });
    expect(yt.videoProvider).toBe("youtube");
    const fb = dataOf<Record<string, unknown>>(galleryItemInputSchema, {
      itemType: "video",
      videoUrl: "https://www.facebook.com/inaafrica/videos/123",
    });
    expect(fb.videoProvider).toBe("facebook");
    expect(errorsOf(galleryItemInputSchema, { itemType: "video", videoUrl: "https://vimeo.com/1" }).videoUrl).toBeDefined();
    expect(errorsOf(galleryItemInputSchema, { itemType: "video", videoUrl: "http://youtube.com/watch?v=dQw4w9WgXcQ" }).videoUrl).toBeDefined();
    expect(errorsOf(galleryItemInputSchema, { itemType: "video", videoUrl: "https://www.youtube.com/@chaine" }).videoUrl?.[0]).toContain(
      "n'est pas reconnue",
    );
  });

  it("ordre d'affichage : refuse les doublons", () => {
    expect(errorsOf(reorderSchema, { ids: [ID.a, ID.a] }).ids?.[0]).toContain("deux fois");
  });
});

describe("paramètres du site", () => {
  it("mise à jour partielle : seuls les champs envoyés sont gardés", () => {
    expect(dataOf(siteSettingsInputSchema, { heroTitle: "Agir ensemble", vision: "" })).toEqual({
      heroTitle: "Agir ensemble",
      vision: null,
    });
  });

  it("refuse un envoi vide ou un champ inconnu", () => {
    expect(errorsOf(siteSettingsInputSchema, {})._form).toBeDefined();
    expect(errorsOf(siteSettingsInputSchema, { updated_by: ID.a })).toBeDefined();
  });

  it("réseaux sociaux : https:// uniquement, réseaux proposés uniquement, vides retirés", () => {
    expect(errorsOf(siteSettingsInputSchema, { socialLinks: { facebook: "http://facebook.com/ina" } })["socialLinks.facebook"]).toBeDefined();
    expect(errorsOf(siteSettingsInputSchema, { socialLinks: { myspace: "https://myspace.com/ina" } })).toBeDefined();
    expect(
      dataOf(siteSettingsInputSchema, { socialLinks: { facebook: "https://facebook.com/ina", youtube: "" } }),
    ).toEqual({ socialLinks: { facebook: "https://facebook.com/ina" } });
  });

  it("montants : entiers, sans doublon, triés, au moins le minimum", () => {
    expect(dataOf(siteSettingsInputSchema, { donationSuggestedAmounts: "10 000; 5000, 5000" })).toEqual({
      donationSuggestedAmounts: [5000, 10000],
    });
    expect(
      errorsOf(siteSettingsInputSchema, { donationMinAmount: 1000, donationSuggestedAmounts: [500, 2000] }).donationSuggestedAmounts,
    ).toBeDefined();
    expect(errorsOf(siteSettingsInputSchema, { donationSuggestedAmounts: [1, 2, 3, 4, 5, 6, 7, 8, 9] })).toBeDefined();
  });

  it("WhatsApp : espaces retirés, même règle que la base", () => {
    expect(dataOf(siteSettingsInputSchema, { whatsappNumber: "+229 01 90 00 00 00" })).toEqual({ whatsappNumber: "+2290190000000" });
    expect(errorsOf(siteSettingsInputSchema, { whatsappNumber: "abc" }).whatsappNumber).toBeDefined();
  });

  it("image d'accueil : texte alternatif obligatoire", () => {
    expect(errorsOf(siteSettingsInputSchema, { heroImagePath: "site/2026/11/a.webp" }).heroImageAlt).toBeDefined();
  });

  it("consignes de don hors ligne : clés vides retirées (format lu par le site)", () => {
    expect(
      dataOf(siteSettingsInputSchema, {
        offlineDonationInstructions: [{ method: "mobile_money", label: "MTN Mobile Money", holder: "", number: "01 90 00 00 00" }],
      }),
    ).toEqual({ offlineDonationInstructions: [{ method: "mobile_money", label: "MTN Mobile Money", number: "01 90 00 00 00" }] });
  });

  it("pages légales : document de l'éditeur ou vide", () => {
    expect(dataOf(siteSettingsInputSchema, { legalNotice: "" })).toEqual({ legalNotice: null });
    expect(dataOf(siteSettingsInputSchema, { privacyPolicy: DOC })).toEqual({ privacyPolicy: DOC });
    expect(errorsOf(siteSettingsInputSchema, { legalNotice: { type: "html" } }).legalNotice).toBeDefined();
  });

  it("email de contact mis en minuscules", () => {
    expect(dataOf(siteSettingsInputSchema, { contactEmail: " Contact@INA-Africa.org " })).toEqual({
      contactEmail: "contact@ina-africa.org",
    });
  });
});

describe("dons et appels aux dons", () => {
  const offline = {
    amount: "25 000",
    receivedOn: "2026-11-01",
    paymentMethod: "mobile_money",
    externalReference: "MP261101.1234",
    idempotencyKey: ID.c,
  };

  it("don hors ligne : montant lu comme un entier de francs CFA", () => {
    expect(dataOf<{ amount: number }>(offlineDonationSchema, offline).amount).toBe(25000);
    expect(errorsOf(offlineDonationSchema, { ...offline, amount: "25,5" }).amount).toBeDefined();
    expect(errorsOf(offlineDonationSchema, { ...offline, amount: "0" }).amount).toBeDefined();
  });

  it("don hors ligne : date non future, mode connu, clé d'idempotence obligatoire", () => {
    const tomorrow = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);
    const errors = errorsOf(offlineDonationSchema, { ...offline, receivedOn: tomorrow, paymentMethod: "cash", idempotencyKey: "" });
    expect(errors.receivedOn?.[0]).toContain("futur");
    expect(errors.paymentMethod).toBeDefined();
    expect(errors.idempotencyKey?.[0]).toContain("Rechargez");
    expect(dataOf<{ receivedOn: string }>(offlineDonationSchema, { ...offline, receivedOn: todayIso() }).receivedOn).toBe(todayIso());
  });

  it("don hors ligne : email du donateur en minuscules, champs vides → null", () => {
    const data = dataOf<Record<string, unknown>>(offlineDonationSchema, { ...offline, donorEmail: "Awa@Exemple.BJ", donorPhone: "" });
    expect(data).toMatchObject({ donorEmail: "awa@exemple.bj", donorPhone: null, campaignId: null, proofPath: null });
  });

  it("annulation : motif obligatoire (3 à 500 caractères)", () => {
    expect(errorsOf(cancelDonationSchema, { id: ID.a, reason: "x" }).reason).toBeDefined();
    expect(dataOf<{ reason: string }>(cancelDonationSchema, { id: ID.a, reason: "  Saisie en double  " }).reason).toBe("Saisie en double");
  });

  it("filtres des dons : valeurs invalides ignorées", () => {
    expect(donationFiltersSchema.parse({ channel: "cash", status: "paid", campaignId: "x", from: "hier" })).toMatchObject({
      page: 1,
      channel: undefined,
      status: "paid",
      campaignId: undefined,
      from: undefined,
    });
  });

  it("appel aux dons : objectif entier positif et dates dans l'ordre", () => {
    expect(errorsOf(campaignInputSchema, { title: "Rentrée", goalAmount: "-5" }).goalAmount).toBeDefined();
    expect(errorsOf(campaignInputSchema, { title: "Rentrée", startsOn: "2026-12-01", endsOn: "2026-11-01" }).endsOn).toBeDefined();
    expect(dataOf<{ goalAmount: number }>(campaignInputSchema, { title: "Rentrée", goalAmount: "1 500 000" }).goalAmount).toBe(1500000);
  });
});

describe("boîte de réception, médias, comptes", () => {
  it("statut d'une demande : valeurs de la base uniquement", () => {
    expect(errorsOf(requestStatusSchema, { id: ID.a, status: "spam" }).status).toBeDefined();
    expect(requestFiltersSchema.parse({ type: "volunteer", status: "nope" })).toEqual({ page: 1, type: "volunteer", status: undefined });
  });

  it("envoi de fichier : espace connu, dossier par défaut", () => {
    expect(errorsOf(mediaUploadFieldsSchema, { bucket: "autre" }).bucket).toBeDefined();
    expect(dataOf(mediaUploadFieldsSchema, { bucket: "public-media", altText: "" })).toEqual({
      bucket: "public-media",
      folder: "divers",
      altText: null,
    });
  });

  it("invitation : email en minuscules, rôle de la liste", () => {
    expect(dataOf(inviteMemberSchema, { email: "Awa@INA-Africa.org", fullName: "Awa", role: "editor" })).toEqual({
      email: "awa@ina-africa.org",
      fullName: "Awa",
      role: "editor",
    });
    expect(errorsOf(changeRoleSchema, { userId: ID.a, role: "owner" }).role).toBeDefined();
  });
});
