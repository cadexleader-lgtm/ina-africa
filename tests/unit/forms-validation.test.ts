import { describe, expect, it } from "vitest";

import {
  cleanLine,
  cleanText,
  contactSchema,
  donationSchema,
  echoValues,
  membershipSchema,
  newsletterSchema,
  partnerSchema,
  pickDonationAmount,
  validate,
  VALIDATION_MESSAGES,
  volunteerSchema,
} from "@/lib/validation/forms";

const validContact = {
  fullName: "  Awa   Dossou ",
  email: "  Awa.Dossou@Exemple.ORG ",
  phone: "",
  subject: "Une question",
  message: "Bonjour,\r\n\r\n\r\n\r\nJe souhaite des informations.",
  consent: "on",
};

describe("formulaire de contact", () => {
  it("accepte une saisie valide et met l'email en minuscules", () => {
    const result = validate(contactSchema, validContact);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.email).toBe("awa.dossou@exemple.org");
    expect(result.data.fullName).toBe("Awa Dossou");
    expect(result.data.phone).toBeUndefined();
    expect(result.data.message).toBe("Bonjour,\n\nJe souhaite des informations.");
  });

  it("donne un message clair sous chaque champ d'un formulaire vide", () => {
    const result = validate(contactSchema, {});
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.fieldErrors).toEqual({
      fullName: VALIDATION_MESSAGES.nameEmpty,
      email: VALIDATION_MESSAGES.emailEmpty,
      subject: "Indiquez le sujet de votre message.",
      message: "Écrivez votre message.",
      consent: VALIDATION_MESSAGES.consent,
    });
  });

  it("refuse le formulaire sans consentement", () => {
    const result = validate(contactSchema, { ...validContact, consent: "" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(Object.keys(result.fieldErrors)).toEqual(["consent"]);
  });

  it("refuse un email invalide et un téléphone hors règles SQL (6 à 30 caractères)", () => {
    const result = validate(contactSchema, { ...validContact, email: "awa@exemple", phone: "12345" });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.fieldErrors.email).toBe(VALIDATION_MESSAGES.emailInvalid);
    expect(result.fieldErrors.phone).toBe(VALIDATION_MESSAGES.phoneInvalid);
    expect(validate(contactSchema, { ...validContact, phone: "+229 01 97 00 00 00" }).ok).toBe(true);
    expect(validate(contactSchema, { ...validContact, phone: "0".repeat(31) }).ok).toBe(false);
  });

  it("respecte les longueurs de la base", () => {
    expect(validate(contactSchema, { ...validContact, fullName: "A" }).ok).toBe(false);
    expect(validate(contactSchema, { ...validContact, fullName: "A".repeat(121) }).ok).toBe(false);
    expect(validate(contactSchema, { ...validContact, subject: "s".repeat(201) }).ok).toBe(false);
    expect(validate(contactSchema, { ...validContact, message: "m".repeat(5001) }).ok).toBe(false);
  });
});

describe("formulaires Nous rejoindre", () => {
  const base = { fullName: "Koffi Agbo", email: "KOFFI@exemple.bj", phone: "+229 97 00 00 00", consent: "on" };

  it("bénévole : compétences et motivation obligatoires, profession facultative", () => {
    expect(validate(volunteerSchema, { ...base, skills: "Animation", motivation: "Aider" }).ok).toBe(true);
    const missing = validate(volunteerSchema, { ...base });
    expect(missing.ok).toBe(false);
    if (!missing.ok) expect(Object.keys(missing.fieldErrors).sort()).toEqual(["motivation", "skills"]);
  });

  it("membre : ville obligatoire, motivation facultative, email en minuscules", () => {
    const result = validate(membershipSchema, { ...base, city: "Cotonou" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.email).toBe("koffi@exemple.bj");
      expect(result.data.motivation).toBeUndefined();
    }
  });

  it("partenaire : type de collaboration limité à partenariat ou sponsoring", () => {
    const ok = validate(partnerSchema, { ...base, organization: "Entreprise", partnershipKind: "sponsorship", message: "Bonjour" });
    expect(ok.ok).toBe(true);
    const bad = validate(partnerSchema, { ...base, organization: "Entreprise", partnershipKind: "autre", message: "Bonjour" });
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.fieldErrors.partnershipKind).toBe("Choisissez le type de collaboration.");
  });
});

describe("newsletter", () => {
  it("met l'email en minuscules et exige le consentement", () => {
    const result = validate(newsletterSchema, { email: "Nom@Exemple.COM", consent: "on", source: "footer" });
    expect(result.ok && result.data.email).toBe("nom@exemple.com");
    expect(validate(newsletterSchema, { email: "nom@exemple.com" }).ok).toBe(false);
  });
});

describe("don en ligne", () => {
  const schema = donationSchema(1000);
  const base = { consent: "on", email: "Don@Exemple.org", idempotencyKey: "0b8f5c1e-4f5a-4b6e-9c1d-2a3b4c5d6e7f" };

  it("accepte un montant suggéré ou libre (entier, au-dessus du minimum)", () => {
    expect(pickDonationAmount("5000", "")).toBe("5000");
    expect(pickDonationAmount("autre", " 25 000 ")).toBe("25 000");
    const result = validate(schema, { ...base, amount: "25 000" });
    expect(result.ok && result.data.amount).toBe(25000);
    expect(result.ok && result.data.email).toBe("don@exemple.org");
  });

  it("refuse un montant trop petit, décimal ou absent", () => {
    for (const amount of ["500", "1500,50", "", "abc"]) {
      const result = validate(schema, { ...base, amount });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.fieldErrors.amount).toBeDefined();
    }
  });

  it("exige au moins un email ou un téléphone", () => {
    const result = validate(schema, { ...base, email: "", amount: "5000" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.fieldErrors.email).toBe(VALIDATION_MESSAGES.reachable);
    expect(validate(schema, { ...base, email: "", phone: "97000000", amount: "5000" }).ok).toBe(true);
  });
});

describe("nettoyage des saisies", () => {
  it("retire caractères de contrôle et caractères invisibles", () => {
    expect(cleanLine("Awa\u0000​ Dossou\r\nObjet")).toBe("Awa Dossou Objet");
    expect(cleanText("Ligne 1‮\n\n\n\nLigne 2  ")).toBe("Ligne 1\n\nLigne 2");
  });

  it("renvoie la saisie au formulaire sans les cases non cochées", () => {
    expect(echoValues({ email: "a@b.co", consent: "" }, ["consent"])).toEqual({ email: "a@b.co", consent: false });
  });
});
