import "server-only";

import { mediaFiltersSchema } from "@/lib/validation/admin/media";
import { check } from "@/server/admin/action";
import { ADMIN_PAGE_SIZE, adminReader, first } from "@/server/data/admin/reader";
import type { AdminMedia, Paginated } from "@/server/data/admin/types";
import { pageRange, paginated } from "@/server/data/reader";

type MediaRow = {
  id: string;
  bucket: AdminMedia["bucket"];
  storage_path: string;
  file_name: string;
  file_type: string;
  file_size: number;
  alt_text: string | null;
  created_at: string;
  uploader: { full_name: string } | { full_name: string }[] | null;
};

/**
 * Médiathèque, du plus récent au plus ancien. Photos du site : toute
 * l'équipe ; justificatifs (espace privé) : admins seulement.
 */
export async function listMedia(filters: unknown = {}): Promise<Paginated<AdminMedia>> {
  const f = mediaFiltersSchema.parse(filters ?? {});
  const { db } = await adminReader(f.bucket === "private-documents" ? "admin" : "editor");
  const range = pageRange(f.page, ADMIN_PAGE_SIZE);
  const result = await db
    .from("media")
    .select(
      "id, bucket, storage_path, file_name, file_type, file_size, alt_text, created_at, uploader:profiles!media_uploaded_by_fkey(full_name)",
      { count: "exact" },
    )
    .eq("bucket", f.bucket)
    .order("created_at", { ascending: false })
    .range(range.from, range.to);
  const items = ((check(result) ?? []) as unknown as MediaRow[]).map((row) => ({
    id: row.id,
    bucket: row.bucket,
    path: row.storage_path,
    fileName: row.file_name,
    fileType: row.file_type,
    fileSize: Number(row.file_size),
    altText: row.alt_text,
    uploadedByName: first(row.uploader)?.full_name ?? null,
    createdAt: row.created_at,
  }));
  return paginated(items, result.count ?? items.length, range.page, ADMIN_PAGE_SIZE);
}
