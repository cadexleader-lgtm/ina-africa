import "server-only";

import type { StoredContent } from "@/lib/page-content/types";
import { check } from "@/server/admin/action";
import { adminReader, first } from "@/server/data/admin/reader";

export type AdminStoredSection = {
  content: StoredContent;
  updatedAt: string;
  updatedByName: string | null;
};

type Row = {
  id: string;
  content: unknown;
  updated_at: string;
  updated_by_profile: { full_name: string } | { full_name: string }[] | null;
};

/** Sections d'une page telles qu'enregistrées (clé de section → contenu), pour l'administration. */
export async function getAdminPageSections(pageKey: string): Promise<Record<string, AdminStoredSection>> {
  const { db } = await adminReader("admin");
  const rows = check(
    await db
      .from("page_sections")
      .select("id, content, updated_at, updated_by_profile:profiles!page_sections_updated_by_fkey(full_name)")
      .like("id", `${pageKey}.%`),
  ) as unknown as Row[] | null;
  const sections: Record<string, AdminStoredSection> = {};
  for (const row of rows ?? []) {
    const content = row.content && typeof row.content === "object" && !Array.isArray(row.content) ? (row.content as StoredContent) : {};
    sections[row.id.slice(pageKey.length + 1)] = {
      content,
      updatedAt: row.updated_at,
      updatedByName: first(row.updated_by_profile)?.full_name ?? null,
    };
  }
  return sections;
}

/** Nombre de sections modifiées par page (liste des pages). */
export async function countCustomizedSections(): Promise<Record<string, number>> {
  const { db } = await adminReader("admin");
  const rows = check(await db.from("page_sections").select("id")) as { id: string }[] | null;
  const counts: Record<string, number> = {};
  for (const { id } of rows ?? []) {
    const page = id.split(".")[0] ?? "";
    counts[page] = (counts[page] ?? 0) + 1;
  }
  return counts;
}
