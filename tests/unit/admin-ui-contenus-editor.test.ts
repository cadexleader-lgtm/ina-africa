import { describe, expect, it } from "vitest";

import {
  ALLOWED_MARKS,
  ALLOWED_NODES,
  checkVideoUrl,
  DISABLED_STARTER_KIT,
  isAllowedEditorHref,
  nextToolbarIndex,
  normalizeLinkInput,
  readableShortcut,
  starterKitOptions,
  TOOLBAR_GROUPS,
} from "@/components/admin/editor/editor-config";
import { richTextProblems, toClosedDoc } from "@/components/admin/editor/rich-text-filter";
import { richTextDocSchema } from "@/lib/validation/rich-text";

const text = (value: string, marks?: unknown[]) => ({ type: "text", text: value, ...(marks ? { marks } : {}) });
const p = (...content: unknown[]) => ({ type: "paragraph", content });

describe("options de l'éditeur (liste fermée)", () => {
  it("désactive tout ce qui n'est pas dans la liste fermée", () => {
    const options = starterKitOptions();
    for (const name of DISABLED_STARTER_KIT) expect(options[name]).toBe(false);
    expect(options.heading.levels).toEqual([2, 3, 4]);
  });

  it("n'ajoute pas d'ouverture automatique des liens ni de liens automatiques", () => {
    const { link } = starterKitOptions();
    expect(link.openOnClick).toBe(false);
    expect(link.autolink).toBe(false);
    expect(link.linkOnPaste).toBe(false);
    expect(link.isAllowedUri("javascript:alert(1)")).toBe(false);
    expect(link.isAllowedUri("https://ina-africa.org")).toBe(true);
  });

  it("nœuds et marques = ceux acceptés par le serveur", () => {
    expect([...ALLOWED_MARKS].sort()).toEqual(["bold", "italic", "link", "underline"]);
    expect(ALLOWED_NODES).not.toContain("codeBlock");
    expect(ALLOWED_NODES).toContain("video");
  });

  it("chaque bouton de la barre d'outils a un libellé en français, sans doublon", () => {
    const items = TOOLBAR_GROUPS.flatMap((group) => group.items);
    expect(new Set(items.map((item) => item.command)).size).toBe(items.length);
    expect(items.every((item) => item.label.length > 2)).toBe(true);
    expect(readableShortcut("Control+Shift+Z")).toBe("Ctrl+Maj+Z");
  });

  it("navigation au clavier dans la barre d'outils (flèches, Début, Fin, en boucle)", () => {
    expect(nextToolbarIndex(0, "ArrowRight", 5)).toBe(1);
    expect(nextToolbarIndex(4, "ArrowRight", 5)).toBe(0);
    expect(nextToolbarIndex(0, "ArrowLeft", 5)).toBe(4);
    expect(nextToolbarIndex(2, "Home", 5)).toBe(0);
    expect(nextToolbarIndex(2, "End", 5)).toBe(4);
    expect(nextToolbarIndex(2, "a", 5)).toBeNull();
  });
});

describe("liens : https et mailto seulement", () => {
  it("accepte https et mailto", () => {
    expect(isAllowedEditorHref("https://www.exemple.org/page?x=1")).toBe(true);
    expect(isAllowedEditorHref("mailto:contact@exemple.org")).toBe(true);
  });

  it("refuse le reste", () => {
    for (const href of ["http://exemple.org", "javascript:alert(1)", "tel:+22900000000", "data:text/html,x", "/actualites", "https://user:pass@exemple.org", "https://localhost", "mailto:pas-un-email"]) {
      expect(isAllowedEditorHref(href)).toBe(false);
    }
  });

  it("complète les saisies courantes", () => {
    expect(normalizeLinkInput("www.exemple.org")).toEqual({ ok: true, href: "https://www.exemple.org" });
    expect(normalizeLinkInput(" contact@exemple.org ")).toEqual({ ok: true, href: "mailto:contact@exemple.org" });
    expect(normalizeLinkInput("https://exemple.org")).toEqual({ ok: true, href: "https://exemple.org" });
  });

  it("explique les refus", () => {
    expect(normalizeLinkInput("")).toMatchObject({ ok: false });
    expect(normalizeLinkInput("http://exemple.org")).toMatchObject({ ok: false, message: expect.stringContaining("https") });
    expect(normalizeLinkInput("javascript:alert(1)")).toMatchObject({ ok: false });
  });
});

describe("vidéos YouTube / Facebook", () => {
  it("reconnaît les adresses acceptées", () => {
    expect(checkVideoUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toMatchObject({ ok: true, provider: "youtube" });
    expect(checkVideoUrl("https://youtu.be/dQw4w9WgXcQ")).toMatchObject({ ok: true, provider: "youtube" });
    expect(checkVideoUrl("https://www.facebook.com/ina/videos/123")).toMatchObject({ ok: true, provider: "facebook" });
  });

  it("refuse les autres", () => {
    expect(checkVideoUrl("https://vimeo.com/1")).toMatchObject({ ok: false });
    expect(checkVideoUrl("https://www.youtube.com/channel/x")).toMatchObject({ ok: false });
  });
});

describe("filtrage du document de l'éditeur", () => {
  it("garde un document conforme tel quel (accepté par le serveur)", () => {
    const doc = {
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 2 }, content: [text("Nos actions")] },
        p(text("Gras", [{ type: "bold" }]), { type: "hardBreak" }, text("lien", [{ type: "link", attrs: { href: "https://exemple.org" } }])),
        { type: "bulletList", content: [{ type: "listItem", content: [p(text("Un"))] }] },
        { type: "orderedList", attrs: { start: 3 }, content: [{ type: "listItem", content: [p(text("Trois"))] }] },
        { type: "blockquote", content: [p(text("Citation"))] },
        { type: "horizontalRule" },
        { type: "image", attrs: { path: "articles/2026/11/abc.webp", alt: "Atelier", caption: "Porto-Novo" } },
        { type: "video", attrs: { provider: "youtube", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", title: "" } },
      ],
    };
    const closed = toClosedDoc(doc);
    expect(richTextDocSchema.safeParse(closed).success).toBe(true);
    expect(closed.content).toHaveLength(8);
    expect(closed.content?.[7]).toEqual({ type: "video", attrs: { provider: "youtube", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" } });
  });

  it("retire les attributs ajoutés par Tiptap (target, rel, class, textAlign)", () => {
    const closed = toClosedDoc({
      type: "doc",
      content: [
        {
          type: "paragraph",
          attrs: { textAlign: "center" },
          content: [text("x", [{ type: "link", attrs: { href: "https://exemple.org", target: "_blank", rel: "noopener", class: null } }])],
        },
      ],
    });
    expect(closed).toEqual({ type: "doc", content: [p(text("x", [{ type: "link", attrs: { href: "https://exemple.org" } }]))] });
  });

  it("retire les nœuds et marques inconnus, et les liens dangereux", () => {
    const closed = toClosedDoc({
      type: "doc",
      content: [
        { type: "codeBlock", content: [text("rm -rf")] },
        { type: "table", content: [] },
        p(text("barré", [{ type: "strike" }, { type: "italic" }, { type: "italic" }]), text("x", [{ type: "link", attrs: { href: "javascript:alert(1)" } }])),
        { type: "image", attrs: { path: "https://autre-site.com/photo.jpg", alt: "x" } },
        { type: "video", attrs: { provider: "youtube", url: "https://vimeo.com/1" } },
      ],
    });
    expect(closed).toEqual({ type: "doc", content: [p(text("barré", [{ type: "italic" }]), text("x"))] });
  });

  it("ramène les titres hors niveaux autorisés (H1 → H2, H6 → H4)", () => {
    const closed = toClosedDoc({
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 1 }, content: [text("A")] },
        { type: "heading", attrs: { level: 6 }, content: [text("B")] },
      ],
    });
    expect(closed.content?.map((block) => (block.type === "heading" ? block.attrs.level : null))).toEqual([2, 4]);
  });

  it("retire les paragraphes vides en début et fin ; un document vide reste valide", () => {
    expect(toClosedDoc({ type: "doc", content: [p(), p(text("x")), p(), p()] }).content).toHaveLength(1);
    expect(toClosedDoc({ type: "doc", content: [p()] })).toEqual({ type: "doc", content: [] });
    expect(toClosedDoc(null)).toEqual({ type: "doc", content: [] });
    expect(toClosedDoc({ type: "nimportequoi" })).toEqual({ type: "doc", content: [] });
  });

  it("une liste vide disparaît, un élément de liste vide garde un paragraphe", () => {
    const closed = toClosedDoc({
      type: "doc",
      content: [
        { type: "bulletList", content: [] },
        { type: "bulletList", content: [{ type: "listItem", content: [] }] },
      ],
    });
    expect(closed.content).toEqual([{ type: "bulletList", content: [{ type: "listItem", content: [{ type: "paragraph" }] }] }]);
    expect(richTextDocSchema.safeParse(closed).success).toBe(true);
  });

  it("signale une image sans texte alternatif avant l'envoi", () => {
    const doc = toClosedDoc({ type: "doc", content: [{ type: "image", attrs: { path: "articles/2026/11/a.webp", alt: "" } }] });
    expect(richTextProblems(doc)).toHaveLength(1);
    expect(richTextProblems(toClosedDoc({ type: "doc", content: [p(text("ok"))] }))).toEqual([]);
  });
});
