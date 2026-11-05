import Link from "next/link";
import type { ReactNode } from "react";

import { ResponsiveImage } from "@/components/ui/ResponsiveImage";
import { VideoEmbed } from "@/components/site/VideoEmbed";
import { cn } from "@/lib/cn";
import { SAFE_HREF, STORAGE_PATH, type ListItem, type RichTextBlock, type RichTextDoc } from "@/lib/validation/rich-text";
import { T } from "@/content/fr/site";

/**
 * Affichage SÉCURISÉ d'un contenu riche (articles, projets, appels aux dons,
 * pages légales). Composant serveur.
 *  - Ne sait rendre QUE la liste fermée de src/lib/validation/rich-text.ts ;
 *    tout élément inconnu est ignoré.
 *  - Aucun HTML injecté (jamais dangerouslySetInnerHTML) : tout est du JSX.
 *  - Liens revérifiés (SAFE_HREF) ; liens externes : nouvel onglet + rel="noopener noreferrer".
 *  - Images de la médiathèque (responsiveImage) ; vidéos par façade (VideoEmbed).
 */

type InlineNode = { type: string; text?: string; marks?: { type: string; attrs?: { href?: string } }[] };

function renderLink(href: string, children: ReactNode, key: string): ReactNode {
  if (!SAFE_HREF.test(href)) return <span key={key}>{children}</span>;
  const className = "font-medium text-link underline decoration-1 underline-offset-4 hover:text-link-strong hover:decoration-2";
  if (href.startsWith("/")) {
    return (
      <Link key={key} href={href} className={className}>
        {children}
      </Link>
    );
  }
  if (/^https?:\/\//i.test(href)) {
    return (
      <a key={key} href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
        <span className="sr-only"> {T.a11y.newTab}</span>
      </a>
    );
  }
  return (
    <a key={key} href={href} className={className}>
      {children}
    </a>
  );
}

function renderInline(nodes: InlineNode[] | undefined, keyPrefix: string): ReactNode[] {
  return (nodes ?? []).map((node, index) => {
    const key = `${keyPrefix}-${index}`;
    if (node.type === "hardBreak") return <br key={key} />;
    if (node.type !== "text" || !node.text) return null;
    let content: ReactNode = node.text;
    let href: string | null = null;
    for (const mark of node.marks ?? []) {
      if (mark.type === "bold") content = <strong className="font-semibold text-brand">{content}</strong>;
      else if (mark.type === "italic") content = <em>{content}</em>;
      else if (mark.type === "underline") content = <span className="underline decoration-1 underline-offset-4">{content}</span>;
      else if (mark.type === "link" && typeof mark.attrs?.href === "string") href = mark.attrs.href;
    }
    return href ? renderLink(href, content, key) : <span key={key}>{content}</span>;
  });
}

function renderList(items: ListItem[], keyPrefix: string): ReactNode[] {
  return items
    .filter((item) => item.type === "listItem")
    .map((item, index) => (
      <li key={`${keyPrefix}-${index}`} className="pl-1.5 [&>p]:my-0">
        {renderBlocks(item.content, `${keyPrefix}-${index}`)}
      </li>
    ));
}

function renderBlocks(blocks: RichTextBlock[] | undefined, keyPrefix = "b"): ReactNode[] {
  return (blocks ?? []).map((block, index) => {
    const key = `${keyPrefix}-${index}`;
    switch (block.type) {
      case "paragraph": {
        const content = renderInline(block.content as InlineNode[] | undefined, key);
        return content.length ? <p key={key}>{content}</p> : null;
      }
      case "heading": {
        const content = renderInline(block.content as InlineNode[] | undefined, key);
        if (block.attrs.level === 2) return <h2 key={key} className="mt-6 text-h2 first:mt-0">{content}</h2>;
        if (block.attrs.level === 3) return <h3 key={key} className="mt-4 text-h3 first:mt-0">{content}</h3>;
        if (block.attrs.level === 4) return <h4 key={key} className="mt-2 text-h4 first:mt-0">{content}</h4>;
        return null;
      }
      case "bulletList":
        return (
          <ul key={key} className="list-disc pl-6 marker:text-brand-2">
            {renderList(block.content, key)}
          </ul>
        );
      case "orderedList":
        return (
          <ol key={key} start={block.attrs?.start} className="list-decimal pl-6 marker:font-semibold marker:text-brand">
            {renderList(block.content, key)}
          </ol>
        );
      case "blockquote":
        return (
          <blockquote key={key} className="border-l-[3px] border-gold pl-6 font-heading text-lead font-semibold text-brand">
            {renderBlocks(block.content, key)}
          </blockquote>
        );
      case "horizontalRule":
        return <hr key={key} className="my-4 border-line" />;
      case "image": {
        const { path, alt, caption } = block.attrs;
        if (!STORAGE_PATH.test(path) || path.includes("..")) return null;
        return (
          <figure key={key} className="my-4">
            <ResponsiveImage image={{ path, alt }} sizes="(min-width: 768px) 680px, 100vw" className="rounded-card" />
            {caption && <figcaption className="mt-3 text-small text-muted">{caption}</figcaption>}
          </figure>
        );
      }
      case "video":
        return (
          <div key={key} className="my-4">
            <VideoEmbed provider={block.attrs.provider} url={block.attrs.url} title={block.attrs.title} />
          </div>
        );
      default:
        return null;
    }
  });
}

type RichTextProps = {
  doc: RichTextDoc | null | undefined;
  className?: string;
};

/** Contenu riche mis en forme pour la lecture (largeur de lecture conseillée : Container size="reading"). */
export function RichText({ doc, className }: RichTextProps) {
  if (!doc?.content?.length) return null;
  return (
    <div className={cn("flex flex-col gap-5 text-body text-ink [&_li+li]:mt-2", className)}>
      {renderBlocks(doc.content)}
    </div>
  );
}
