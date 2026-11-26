import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import { resolveSection, type ResolvedSection } from "@/lib/page-content/resolve";
import type { PageDef, StoredContent } from "@/lib/page-content/types";
import { getReader, logReadError } from "@/server/data/reader";
import { TAGS } from "@/server/data/tags";

/**
 * Textes et photos saisis dans l'administration pour une page (table
 * page_sections, lisible par tous). Si la base ne répond pas, ou tant que la
 * table n'existe pas, les valeurs d'origine sont affichées.
 */
async function readStoredSections(pageKey: string): Promise<Record<string, StoredContent>> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.pageSections);

  const db = getReader();
  if (!db) return {};
  const { data, error } = await db.from("page_sections").select("id, content").like("id", `${pageKey}.%`);
  if (error || !data) {
    logReadError("page_sections", error);
    return {};
  }
  const stored: Record<string, StoredContent> = {};
  for (const row of data as { id: string; content: unknown }[]) {
    const section = row.id.slice(pageKey.length + 1);
    if (row.content && typeof row.content === "object" && !Array.isArray(row.content)) stored[section] = row.content as StoredContent;
  }
  return stored;
}

export type PageContent = { section(key: string): ResolvedSection };

/** Valeurs affichées de chaque section d'une page (saisie de l'administration, sinon valeur d'origine). */
export async function getPageContent(page: PageDef): Promise<PageContent> {
  const stored = await readStoredSections(page.key);
  const resolved = new Map(page.sections.map((section) => [section.key, resolveSection(section, stored[section.key])]));
  return {
    section(key) {
      const found = resolved.get(key);
      if (!found) throw new Error(`Section inconnue : ${page.key}.${key}`);
      return found;
    },
  };
}
