import { richTextDocSchema, SAFE_HREF, STORAGE_PATH, YOUTUBE_URL, FACEBOOK_URL, type RichTextBlock, type RichTextDoc } from "@/lib/validation/rich-text";

import { HEADING_LEVELS, isAllowedEditorHref } from "./editor-config";

/*
 * Filtrage du document produit par l'éditeur (editor.getJSON()) AVANT
 * l'envoi : seuls les nœuds, marques et attributs de la liste fermée
 * (src/lib/validation/rich-text.ts) sont gardés, au format attendu. Le
 * serveur revalide de toute façon (richTextDocSchema) : ce filtre évite
 * seulement qu'un attribut ajouté par Tiptap (ex. `target`, `class`)
 * fasse refuser l'enregistrement.
 * Fonctions pures, testées (tests/unit/admin-ui-contenus-editor.test.ts).
 */

type JsonNode = {
  type?: unknown;
  attrs?: Record<string, unknown> | null;
  content?: unknown;
  marks?: unknown;
  text?: unknown;
};

type InlineOut = { type: "text"; text: string; marks?: MarkOut[] } | { type: "hardBreak" };
type MarkOut = { type: "bold" } | { type: "italic" } | { type: "underline" } | { type: "link"; attrs: { href: string } };

function asNodes(value: unknown): JsonNode[] {
  return Array.isArray(value) ? value.filter((node): node is JsonNode => !!node && typeof node === "object") : [];
}

function str(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function filterMarks(value: unknown): MarkOut[] {
  const marks: MarkOut[] = [];
  const seen = new Set<string>();
  for (const mark of asNodes(value)) {
    const type = str(mark.type);
    if (!type || seen.has(type)) continue;
    if (type === "bold" || type === "italic" || type === "underline") {
      marks.push({ type });
      seen.add(type);
    } else if (type === "link") {
      const href = str(mark.attrs?.href)?.trim();
      // Liens créés dans l'éditeur : https/mailto ; un lien déjà enregistré
      // reste accepté s'il respecte la règle du serveur (SAFE_HREF).
      if (href && (isAllowedEditorHref(href) || SAFE_HREF.test(href))) {
        marks.push({ type: "link", attrs: { href } });
        seen.add(type);
      }
    }
  }
  return marks;
}

function filterInline(value: unknown): InlineOut[] {
  const out: InlineOut[] = [];
  for (const node of asNodes(value)) {
    if (node.type === "hardBreak") {
      out.push({ type: "hardBreak" });
    } else if (node.type === "text") {
      const text = str(node.text);
      if (!text) continue;
      const marks = filterMarks(node.marks);
      out.push(marks.length ? { type: "text", text, marks } : { type: "text", text });
    }
  }
  return out;
}

function headingLevel(value: unknown): 2 | 3 | 4 {
  const level = typeof value === "number" ? value : Number(value);
  if ((HEADING_LEVELS as readonly number[]).includes(level)) return level as 2 | 3 | 4;
  // H1 réservé au titre de la page ; H5/H6 ramenés au plus petit sous-titre.
  return level <= 2 ? 2 : 4;
}

function withContent<T extends { type: string }>(base: T, content: unknown[]): T & { content?: unknown[] } {
  return content.length ? { ...base, content } : base;
}

function filterBlocks(value: unknown): RichTextBlock[] {
  const out: RichTextBlock[] = [];
  for (const node of asNodes(value)) {
    const block = filterBlock(node);
    if (block) out.push(block);
  }
  return out;
}

function filterBlock(node: JsonNode): RichTextBlock | null {
  switch (node.type) {
    case "paragraph":
      return withContent({ type: "paragraph" as const }, filterInline(node.content)) as RichTextBlock;
    case "heading":
      return withContent(
        { type: "heading" as const, attrs: { level: headingLevel(node.attrs?.level) } },
        filterInline(node.content),
      ) as RichTextBlock;
    case "blockquote": {
      const content = filterBlocks(node.content);
      return { type: "blockquote", content: content.length ? content : [{ type: "paragraph" }] };
    }
    case "bulletList":
    case "orderedList": {
      const items = asNodes(node.content)
        .filter((item) => item.type === "listItem")
        .map((item) => {
          const content = filterBlocks(item.content);
          return { type: "listItem" as const, content: content.length ? content : [{ type: "paragraph" as const }] };
        });
      if (items.length === 0) return null;
      if (node.type === "bulletList") return { type: "bulletList", content: items };
      const start = Number(node.attrs?.start);
      return Number.isInteger(start) && start > 1 && start <= 1000
        ? { type: "orderedList", attrs: { start }, content: items }
        : { type: "orderedList", content: items };
    }
    case "horizontalRule":
      return { type: "horizontalRule" };
    case "image": {
      const path = str(node.attrs?.path)?.trim() ?? "";
      if (!path || !STORAGE_PATH.test(path) || path.includes("..")) return null;
      const alt = (str(node.attrs?.alt) ?? "").trim();
      const caption = (str(node.attrs?.caption) ?? "").trim();
      return { type: "image", attrs: caption ? { path, alt, caption } : { path, alt } };
    }
    case "video": {
      const url = str(node.attrs?.url)?.trim() ?? "";
      const provider = YOUTUBE_URL.test(url) ? "youtube" : FACEBOOK_URL.test(url) ? "facebook" : null;
      if (!provider) return null;
      const title = (str(node.attrs?.title) ?? "").trim();
      return { type: "video", attrs: title ? { provider, url, title } : { provider, url } };
    }
    default:
      return null;
  }
}

function isEmptyParagraph(block: RichTextBlock): boolean {
  return block.type === "paragraph" && !(block.content?.length ?? 0);
}

/**
 * Document de l'éditeur → document de la liste fermée. Les paragraphes vides
 * de fin (ajoutés par l'éditeur) sont retirés ; un document sans contenu
 * devient `{ type: "doc", content: [] }`.
 */
export function toClosedDoc(json: unknown): RichTextDoc {
  const root = json && typeof json === "object" ? (json as JsonNode) : null;
  const content = root?.type === "doc" ? filterBlocks(root.content) : [];
  while (content.length && isEmptyParagraph(content[content.length - 1])) content.pop();
  while (content.length && isEmptyParagraph(content[0])) content.shift();
  return { type: "doc", content };
}

/** Problèmes à corriger avant l'envoi (images sans texte alternatif, contenu trop long…). */
export function richTextProblems(doc: RichTextDoc): string[] {
  const problems = new Set<string>();
  const visit = (blocks: RichTextBlock[] | undefined) => {
    for (const block of blocks ?? []) {
      if (block.type === "image" && !block.attrs.alt) problems.add("Une image n'a pas de texte alternatif : sélectionnez-la puis « Modifier l'image ».");
      if (block.type === "blockquote") visit(block.content);
      if (block.type === "bulletList" || block.type === "orderedList") block.content.forEach((item) => visit(item.content));
    }
  };
  visit(doc.content);
  const parsed = richTextDocSchema.safeParse(doc);
  if (!parsed.success && problems.size === 0) {
    const tooLong = parsed.error.issues.some((issue) => issue.message === "Contenu trop long" || issue.code === "too_big");
    problems.add(tooLong ? "Le texte est trop long : divisez-le en plusieurs articles." : "Le texte contient un élément non accepté.");
  }
  return [...problems];
}
