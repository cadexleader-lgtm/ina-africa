import { describe, expect, it } from "vitest";

import { EDITABLE_PAGES, findSection } from "@/content/page-sections";
import { resolveSection } from "@/lib/page-content/resolve";
import { sectionContentSchema } from "@/lib/page-content/validation";
import { parseAdminInput } from "@/lib/validation/admin/common";

const about = (key: string) => findSection("a-propos", key)!.section;

describe("définitions des pages", () => {
  it("clés uniques et valides (identifiants de la base)", () => {
    for (const page of EDITABLE_PAGES) {
      const keys = page.sections.map((section) => section.key);
      expect(new Set(keys).size).toBe(keys.length);
      for (const section of page.sections) {
        expect(`${page.key}.${section.key}`).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*\.[a-z0-9]+(-[a-z0-9]+)*$/);
        const fields = section.fields.map((field) => field.key);
        expect(new Set(fields).size).toBe(fields.length);
      }
    }
  });

  it("aucun tiret long dans les textes d'origine", () => {
    expect(JSON.stringify(EDITABLE_PAGES)).not.toContain("—");
  });
});

describe("valeurs affichées", () => {
  it("rien d'enregistré : textes d'origine", () => {
    const vision = resolveSection(about("vision"));
    expect(vision.line("title")).toBe("Notre vision");
    expect(vision.text("statement").length).toBeGreaterThan(20);
  });

  it("saisie de l'administration, champ vide = texte d'origine", () => {
    const missions = resolveSection(about("missions"), { title: "Ce que nous faisons", items: [], label: "  " });
    expect(missions.line("title")).toBe("Ce que nous faisons");
    expect(missions.line("label")).toBe("Ce qui nous anime");
    expect(missions.list("items").length).toBeGreaterThan(0);
  });

  it("paragraphes séparés par une ligne vide", () => {
    const intro = resolveSection(about("en-tete"), { intro: "Un.\n\nDeux.\nsuite" });
    expect(intro.paragraphs("intro")).toEqual(["Un.", "Deux.\nsuite"]);
  });

  it("photo de la médiathèque, sinon photo d'origine ; donnée mal formée ignorée", () => {
    const section = about("historique");
    const original = resolveSection(section).image("image");
    expect(resolveSection(section, { image: { path: "site/photo.webp", alt: "Distribution de kits" } }).image("image")).toEqual({
      path: "site/photo.webp",
      alt: "Distribution de kits",
    });
    expect(resolveSection(section, { image: { path: "https://ailleurs.com/x.jpg", alt: "x" } }).image("image")).toBe(original);
    expect(resolveSection(section, { image: { path: "site/photo.webp", alt: "" } }).image("image")).toBe(original);
  });

  it("liste fixe : même nombre de cartes, texte vide = texte d'origine", () => {
    const join = resolveSection(about("rejoindre"), { options: [{ title: "Adhérer" }, {}, { action: "Écrire" }, { title: "En trop" }] });
    const options = join.items("options");
    expect(options).toHaveLength(3);
    expect(options[0]!.title).toBe("Adhérer");
    expect(options[1]!.title).toBe("Devenir bénévole");
    expect(options[2]!.action).toBe("Écrire");
  });

  it("valeurs : section vide tant que rien n'est saisi", () => {
    expect(resolveSection(about("valeurs")).items("items")).toEqual([]);
  });
});

describe("validation de la saisie", () => {
  it("garde seulement les champs remplis, nettoyés", () => {
    const parsed = parseAdminInput(sectionContentSchema(about("gouvernance")), {
      label: "  Gouvernance  ",
      title: "",
      intro: null,
      items: [
        { title: " L'Assemblée ", text: "Rôle" },
        { title: "", text: "" },
      ],
    });
    expect(parsed).toEqual({ ok: true, data: { label: "Gouvernance", items: [{ title: "L'Assemblée", text: "Rôle" }] } });
  });

  it("refuse un texte trop long et indique le champ", () => {
    const parsed = parseAdminInput(sectionContentSchema(about("vision")), { title: "x".repeat(121) });
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(Object.keys(parsed.fieldErrors)).toEqual(["title"]);
  });

  it("photo : texte alternatif obligatoire, chemin de la médiathèque seulement", () => {
    const section = about("en-tete");
    const noAlt = parseAdminInput(sectionContentSchema(section), { image: { path: "site/a.webp", alt: "" } });
    expect(noAlt.ok === false && Object.keys(noAlt.fieldErrors)).toEqual(["image.alt"]);
    const external = parseAdminInput(sectionContentSchema(section), { image: { path: "https://x.com/a.jpg", alt: "x" } });
    expect(external.ok).toBe(false);
    expect(parseAdminInput(sectionContentSchema(section), { image: { path: "", alt: "" } })).toEqual({ ok: true, data: {} });
  });

  it("liste fixe : le nombre de cartes ne change pas", () => {
    const section = about("rejoindre");
    expect(parseAdminInput(sectionContentSchema(section), { options: [{ title: "Un" }] }).ok).toBe(false);
    const parsed = parseAdminInput(sectionContentSchema(section), { options: [{ title: "Un" }, { title: "" }, { title: "" }] });
    expect(parsed).toEqual({ ok: true, data: { options: [{ title: "Un" }, {}, {}] } });
  });
});

describe("formulaire de l'administration", () => {
  it("affiche le texte du site et n'envoie que ce qui change", async () => {
    const { toFormValues, toSubmission } = await import("@/lib/page-content/form");
    const section = about("gouvernance");
    const values = toFormValues(section);
    expect(values.title).toBe("Une organisation structurée");
    expect(toSubmission(section, values)).toEqual({});
    const items = values.items as Record<string, string>[];
    const edited = { ...values, title: "Nos instances", items: [{ ...items[0]!, title: "L'Assemblée des membres" }, ...items.slice(1)] };
    const sent = toSubmission(section, edited);
    expect(sent.title).toBe("Nos instances");
    expect((sent.items as Record<string, string>[])[0]!.title).toBe("L'Assemblée des membres");
    expect(sent.label).toBeUndefined();
  });

  it("le formulaire ne modifie jamais les valeurs d'origine", async () => {
    const { toFormValues } = await import("@/lib/page-content/form");
    const section = about("missions");
    const values = toFormValues(section);
    (values.items as string[])[0] = "Changé";
    expect(resolveSection(section).list("items")[0]).not.toBe("Changé");
  });

  it("liste fixe : seul le texte changé est envoyé", async () => {
    const { toFormValues, toSubmission } = await import("@/lib/page-content/form");
    const section = about("rejoindre");
    const values = toFormValues(section);
    const options = (values.options as Record<string, string>[]).map((option, index) =>
      index === 1 ? { ...option, action: "Je m'engage" } : option,
    );
    expect(toSubmission(section, { ...values, options })).toEqual({
      options: [
        { title: "", text: "", action: "" },
        { title: "", text: "", action: "Je m'engage" },
        { title: "", text: "", action: "" },
      ],
    });
  });
});

describe("jamais d'élision devant INA-AFRICA (demande de l'ONG)", () => {
  it("aucun « d'INA » ni « qu'INA » dans le code du site", async () => {
    const { execSync } = await import("node:child_process");
    const found = execSync("grep -rlE \"(d|qu)(&apos;|'|’)INA\" src || true", { encoding: "utf8" }).trim();
    expect(found).toBe("");
  });
});
