import { mergeAttributes, Node } from "@tiptap/core";

import { mediaUrl } from "@/lib/media";
import { STORAGE_PATH } from "@/lib/validation/rich-text";

/*
 * Nœuds propres à INA-AFRICA pour l'éditeur (mêmes noms et attributs que la
 * liste fermée src/lib/validation/rich-text.ts) :
 *  - `image` : image de la MÉDIATHÈQUE (chemin, texte alternatif, légende) —
 *    une image collée depuis un autre site n'est jamais reprise ;
 *  - `video` : vidéo YouTube / Facebook, affichée ici comme un encadré (la
 *    lecture n'a lieu que sur le site public, au clic).
 */

function smallPath(path: string): string {
  return /\.webp$/i.test(path) ? path.replace(/\.webp$/i, "-sm.webp") : path;
}

export const MediaImage = Node.create({
  name: "image",
  group: "block",
  atom: true,
  draggable: false,
  selectable: true,

  addAttributes() {
    return {
      path: { default: null, rendered: false },
      alt: { default: "", rendered: false },
      caption: { default: "", rendered: false },
    };
  },

  parseHTML() {
    return [
      {
        // Seules les images marquées par l'éditeur lui-même (copier-coller interne).
        tag: "figure[data-media-path]",
        getAttrs: (element) => {
          const path = (element as HTMLElement).getAttribute("data-media-path") ?? "";
          if (!STORAGE_PATH.test(path) || path.includes("..")) return false;
          return {
            path,
            alt: (element as HTMLElement).getAttribute("data-alt") ?? "",
            caption: (element as HTMLElement).getAttribute("data-caption") ?? "",
          };
        },
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const path = String(node.attrs.path ?? "");
    const alt = String(node.attrs.alt ?? "");
    const caption = String(node.attrs.caption ?? "");
    const valid = STORAGE_PATH.test(path) && !path.includes("..");
    return [
      "figure",
      mergeAttributes(HTMLAttributes, {
        "data-media-path": path,
        "data-alt": alt,
        "data-caption": caption,
        class: "admin-editor-figure",
      }),
      ["img", { src: valid ? mediaUrl(smallPath(path)) : "", alt, loading: "lazy" }],
      [
        "figcaption",
        {},
        caption || (alt ? `Description : ${alt}` : "⚠ Texte alternatif manquant : sélectionnez l'image puis « Image de la médiathèque »."),
      ],
    ];
  },
});

export const VideoEmbedNode = Node.create({
  name: "video",
  group: "block",
  atom: true,
  draggable: false,
  selectable: true,

  addAttributes() {
    return {
      provider: { default: "youtube", rendered: false },
      url: { default: "", rendered: false },
      title: { default: "", rendered: false },
    };
  },

  parseHTML() {
    return [
      {
        tag: "div[data-video-url]",
        getAttrs: (element) => ({
          provider: (element as HTMLElement).getAttribute("data-provider") ?? "youtube",
          url: (element as HTMLElement).getAttribute("data-video-url") ?? "",
          title: (element as HTMLElement).getAttribute("data-title") ?? "",
        }),
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const provider = node.attrs.provider === "facebook" ? "Facebook" : "YouTube";
    const title = String(node.attrs.title ?? "");
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-video-url": String(node.attrs.url ?? ""),
        "data-provider": String(node.attrs.provider ?? ""),
        "data-title": title,
        class: "admin-editor-video",
      }),
      ["strong", {}, `Vidéo ${provider}${title ? ` : ${title}` : ""}`],
      ["span", {}, String(node.attrs.url ?? "")],
    ];
  },
});
