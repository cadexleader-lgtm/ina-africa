import { describe, expect, it } from "vitest";

import { isEmptyDoc, richTextDocSchema } from "@/lib/validation/rich-text";

const doc = (...content: unknown[]) => ({ type: "doc", content });
const p = (text: string, marks?: unknown[]) => ({ type: "paragraph", content: [{ type: "text", text, ...(marks ? { marks } : {}) }] });

describe("richTextDocSchema (liste fermée du contenu riche)", () => {
  it("accepte un article avec sous-titres, listes, lien, image de la médiathèque et vidéo YouTube", () => {
    const article = doc(
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Nos actions" }] },
      p("Formation des femmes", [{ type: "bold" }]),
      { type: "bulletList", content: [{ type: "listItem", content: [p("Couture")] }] },
      p("Voir le site", [{ type: "link", attrs: { href: "https://exemple.org" } }]),
      { type: "image", attrs: { path: "articles/2026/11/atelier.webp", alt: "Atelier de couture" } },
      { type: "video", attrs: { provider: "youtube", url: "https://www.youtube.com/watch?v=abc" } },
    );
    expect(richTextDocSchema.safeParse(article).success).toBe(true);
  });

  it("refuse un lien javascript:", () => {
    expect(richTextDocSchema.safeParse(doc(p("clic", [{ type: "link", attrs: { href: "javascript:alert(1)" } }]))).success).toBe(false);
  });

  it("refuse une image venant d'un autre site", () => {
    expect(
      richTextDocSchema.safeParse(doc({ type: "image", attrs: { path: "https://exemple.com/x.jpg", alt: "x" } })).success,
    ).toBe(false);
  });

  it("refuse une image sans texte alternatif", () => {
    expect(richTextDocSchema.safeParse(doc({ type: "image", attrs: { path: "a/b.webp", alt: "" } })).success).toBe(false);
  });

  it("refuse un titre H1 (réservé au titre de la page)", () => {
    expect(
      richTextDocSchema.safeParse(doc({ type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "x" }] })).success,
    ).toBe(false);
  });

  it("refuse tout élément inconnu (iframe, HTML brut…)", () => {
    expect(richTextDocSchema.safeParse(doc({ type: "iframe", attrs: { src: "https://evil.example" } })).success).toBe(false);
    expect(richTextDocSchema.safeParse({ type: "doc", html: "<script>alert(1)</script>" }).success).toBe(true);
    expect(richTextDocSchema.parse({ type: "doc", html: "<script>" })).not.toHaveProperty("html");
  });

  it("refuse une vidéo qui n'est ni YouTube ni Facebook", () => {
    expect(
      richTextDocSchema.safeParse(doc({ type: "video", attrs: { provider: "youtube", url: "https://evil.example/watch" } })).success,
    ).toBe(false);
  });

  it("reconnaît un document vide", () => {
    expect(isEmptyDoc({ type: "doc", content: [{ type: "paragraph" }] })).toBe(true);
    expect(isEmptyDoc(doc(p("Bonjour")) as never)).toBe(false);
  });
});
