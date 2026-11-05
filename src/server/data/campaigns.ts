import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import type { CampaignProgress, DonationCampaign } from "@/lib/types/content";
import { EMPTY_DOC, richTextDocSchema, type RichTextDoc } from "@/lib/validation/rich-text";
import { getReader, logReadError, toImage } from "@/server/data/reader";
import { TAGS } from "@/server/data/tags";

const COLUMNS =
  "id, slug, title, summary, content, cover_image_path, cover_image_alt, goal_amount, starts_on, ends_on, show_progress, share_message, seo_title, seo_description";

type CampaignRow = {
  id: string;
  slug: string;
  title: string;
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
};

function toCampaign(row: CampaignRow): DonationCampaign {
  const parsed = richTextDocSchema.safeParse(row.content);
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    content: parsed.success ? (parsed.data as RichTextDoc) : EMPTY_DOC,
    cover: toImage(row.cover_image_path, row.cover_image_alt, row.title),
    goalAmount: row.goal_amount === null ? null : Number(row.goal_amount),
    startsOn: row.starts_on,
    endsOn: row.ends_on,
    showProgress: row.show_progress,
    shareMessage: row.share_message,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
  };
}

/** Appels aux dons actifs (les visiteurs ne voient que ceux-là). */
export async function listActiveCampaigns(): Promise<DonationCampaign[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.campaigns);

  const db = getReader();
  if (!db) return [];
  const { data, error } = await db
    .from("donation_campaigns")
    .select(COLUMNS)
    .order("starts_on", { ascending: false, nullsFirst: false });
  if (error) {
    logReadError("donation_campaigns", error);
    return [];
  }
  return (data as CampaignRow[]).map(toCampaign);
}

export async function getCampaign(slug: string): Promise<DonationCampaign | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.campaigns, TAGS.campaign(slug));

  const db = getReader();
  if (!db) return null;
  const { data, error } = await db.from("donation_campaigns").select(COLUMNS).eq("slug", slug).maybeSingle();
  if (error) logReadError("donation_campaigns", error);
  return data ? toCampaign(data as CampaignRow) : null;
}

/**
 * Jauge d'un appel aux dons : totaux seulement (aucune donnée personnelle),
 * renvoyée par la base uniquement si l'admin a choisi de l'afficher.
 * Durée de cache courte : elle change à chaque don confirmé.
 */
export async function getCampaignProgress(campaignId: string): Promise<CampaignProgress | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag(TAGS.campaignProgress);

  const db = getReader();
  if (!db) return null;
  const { data, error } = await db.rpc("campaign_progress", { p_campaign_id: campaignId });
  if (error) {
    logReadError("campaign_progress", error);
    return null;
  }
  const row = Array.isArray(data) ? data[0] : null;
  if (!row) return null;
  return {
    onlineAmount: Number(row.online_amount),
    offlineAmount: Number(row.offline_amount),
    totalAmount: Number(row.total_amount),
    goalAmount: row.goal_amount === null ? null : Number(row.goal_amount),
    donationsCount: Number(row.donations_count),
  };
}
