import { z } from "zod";

/**
 * Contenu riche (articles, projets, appels aux dons, pages légales).
 *
 * Format : document JSON de l'éditeur Tiptap / ProseMirror. Ce schéma est la
 * LISTE FERMÉE des éléments autorisés : il est appliqué côté serveur avant
 * chaque enregistrement, et l'affichage (RichText) ne sait rendre que ces
 * éléments. Aucun HTML n'est stocké ni injecté.
 */

const MAX_TEXT = 20_000;

/** Liens autorisés : web, email, téléphone, ou page interne du site. */
export const SAFE_HREF = /^(https?:\/\/[^\s]+|mailto:[^\s]+|tel:[+0-9 ().-]+|\/(?!\/)[^\s]*)$/i;

/** Chemin d'une image de la médiathèque (même règle que la base : jamais d'URL externe). */
export const STORAGE_PATH = /^[A-Za-z0-9][A-Za-z0-9/_.-]*$/;

/** Vidéos autorisées : YouTube et Facebook uniquement (même règle que la base). */
export const YOUTUBE_URL = /^https:\/\/(www\.|m\.)?(youtube\.com|youtu\.be)\//;
export const FACEBOOK_URL = /^https:\/\/(www\.|m\.|web\.)?(facebook\.com|fb\.watch)\//;

const markSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("bold") }),
  z.object({ type: z.literal("italic") }),
  z.object({ type: z.literal("underline") }),
  z.object({
    type: z.literal("link"),
    attrs: z.object({
      href: z.string().max(2000).regex(SAFE_HREF, "Lien non autorisé"),
    }),
  }),
]);

const textNode = z.object({
  type: z.literal("text"),
  text: z.string().min(1).max(MAX_TEXT),
  marks: z.array(markSchema).max(4).optional(),
});

const hardBreak = z.object({ type: z.literal("hardBreak") });
const inlineNode = z.union([textNode, hardBreak]);

const paragraph = z.object({
  type: z.literal("paragraph"),
  content: z.array(inlineNode).optional(),
});

const heading = z.object({
  type: z.literal("heading"),
  // H1 réservé au titre de la page.
  attrs: z.object({ level: z.union([z.literal(2), z.literal(3), z.literal(4)]) }),
  content: z.array(inlineNode).optional(),
});

const image = z.object({
  type: z.literal("image"),
  attrs: z.object({
    path: z.string().max(300).regex(STORAGE_PATH, "Image hors de la médiathèque").refine((p) => !p.includes(".."), "Chemin invalide"),
    alt: z.string().min(1, "Texte alternatif obligatoire").max(300),
    caption: z.string().max(300).optional(),
  }),
});

const video = z.object({
  type: z.literal("video"),
  attrs: z
    .object({
      provider: z.enum(["youtube", "facebook"]),
      url: z.string().max(500),
      title: z.string().max(200).optional(),
    })
    .refine((v) => (v.provider === "youtube" ? YOUTUBE_URL : FACEBOOK_URL).test(v.url), "Vidéo YouTube ou Facebook uniquement"),
});

const horizontalRule = z.object({ type: z.literal("horizontalRule") });

export type RichTextBlock =
  | z.infer<typeof paragraph>
  | z.infer<typeof heading>
  | z.infer<typeof image>
  | z.infer<typeof video>
  | z.infer<typeof horizontalRule>
  | { type: "blockquote"; content: RichTextBlock[] }
  | { type: "bulletList" | "orderedList"; attrs?: { start?: number }; content: ListItem[] };

export type ListItem = { type: "listItem"; content: RichTextBlock[] };

const block: z.ZodType<RichTextBlock> = z.lazy(() =>
  z.union([
    paragraph,
    heading,
    image,
    video,
    horizontalRule,
    z.object({ type: z.literal("blockquote"), content: z.array(block).max(50) }),
    z.object({
      type: z.enum(["bulletList", "orderedList"]),
      attrs: z.object({ start: z.number().int().min(1).max(1000).optional() }).optional(),
      content: z.array(listItem).min(1).max(200),
    }),
  ]),
);

const listItem: z.ZodType<ListItem> = z.lazy(() =>
  z.object({ type: z.literal("listItem"), content: z.array(block).min(1).max(50) }),
);

export const richTextDocSchema = z
  .object({
    type: z.literal("doc"),
    content: z.array(block).max(2000).optional(),
  })
  .refine((doc) => JSON.stringify(doc).length <= 500_000, "Contenu trop long");

/**
 * Document de contenu riche. À l'enregistrement, TOUJOURS stocker le résultat
 * de `richTextDocSchema.parse()` (les propriétés inconnues y sont retirées),
 * jamais le JSON reçu tel quel.
 */
export type RichTextDoc = { type: "doc"; content?: RichTextBlock[] };

export const EMPTY_DOC: RichTextDoc = { type: "doc", content: [] };

/** Vrai si le document ne contient aucun texte ni média. */
export function isEmptyDoc(doc: RichTextDoc | null | undefined): boolean {
  return !doc?.content?.some((node) => node.type !== "paragraph" || (node.content?.length ?? 0) > 0);
}
