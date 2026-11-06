import "server-only";

import { check } from "@/server/admin/action";
import { adminReader, isUuid, toDoc } from "@/server/data/admin/reader";
import type { AdminCampaign, AdminCampaignListItem } from "@/server/data/admin/types";

type CampaignRow = {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  content: unknown;
  cover_image_path: string | null;
  cover_image_alt: string | null;
  goal_amount: number | null;
  starts_on: string | null;
  ends_on: string | null;
  show_progress: boolean;
  share_message: string | null;
  seo_title: string | null;
  seo_description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

const amount = (value: number | null) => (value === null ? null : Number(value));

/** Tous les appels aux dons (actifs ou non), du plus récent au plus ancien. */
export async function listAdminCampaigns(): Promise<AdminCampaignListItem[]> {
  const { db } = await adminReader("editor");
  const rows = check(
    await db
      .from("donation_campaigns")
      .select("id, title, slug, goal_amount, starts_on, ends_on, is_active, show_progress, updated_at")
      .order("created_at", { ascending: false }),
  ) as unknown as CampaignRow[] | null;
  return (rows ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    goalAmount: amount(row.goal_amount),
    startsOn: row.starts_on,
    endsOn: row.ends_on,
    isActive: row.is_active,
    showProgress: row.show_progress,
    updatedAt: row.updated_at,
  }));
}

export async function getAdminCampaign(id: string): Promise<AdminCampaign | null> {
  const { db } = await adminReader("editor");
  if (!isUuid(id)) return null;
  const row = check(
    await db
      .from("donation_campaigns")
      .select(
        "id, title, slug, summary, content, cover_image_path, cover_image_alt, goal_amount, starts_on, ends_on, show_progress, share_message, seo_title, seo_description, is_active, created_at, updated_at",
      )
      .eq("id", id)
      .maybeSingle(),
  ) as unknown as CampaignRow | null;
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    summary: row.summary,
    content: toDoc(row.content),
    coverImagePath: row.cover_image_path,
    coverImageAlt: row.cover_image_alt,
    goalAmount: amount(row.goal_amount),
    startsOn: row.starts_on,
    endsOn: row.ends_on,
    showProgress: row.show_progress,
    shareMessage: row.share_message,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
