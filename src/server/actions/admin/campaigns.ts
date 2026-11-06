"use server";

import { idInputSchema } from "@/lib/validation/admin/common";
import { activeToggleSchema } from "@/lib/validation/admin/content";
import { campaignInputSchema, campaignUpdateSchema, type CampaignInput } from "@/lib/validation/admin/donations";
import { isEmptyDoc, type RichTextDoc } from "@/lib/validation/rich-text";
import { adminAction, deleteRow, insertRow, invalidate, loadRow, updateRow } from "@/server/admin/action";
import { resolveSlug } from "@/server/admin/slug";
import { TAGS } from "@/server/data/tags";
import { AppError, type ActionResult } from "@/server/errors";

/*
 * Appels aux dons (admin). Chacun a sa page et son lien à partager ; il
 * n'est visible qu'une fois activé. Un appel qui a reçu des dons ne peut
 * pas être supprimé (clé étrangère « restrict ») : on le désactive.
 */

type CampaignRef = { id: string; slug: string; is_active: boolean };
const REF = "id, slug, is_active";

function campaignTags(...slugs: (string | undefined)[]) {
  return [TAGS.campaigns, TAGS.campaignProgress, ...slugs.map((slug) => (slug ? TAGS.campaign(slug) : undefined))];
}

function toCampaignRow(data: CampaignInput) {
  return {
    title: data.title,
    slug: resolveSlug(data.slug, data.title),
    summary: data.summary,
    content: data.content,
    cover_image_path: data.coverImagePath,
    cover_image_alt: data.coverImageAlt,
    goal_amount: data.goalAmount,
    starts_on: data.startsOn,
    ends_on: data.endsOn,
    show_progress: data.showProgress,
    share_message: data.shareMessage,
    seo_title: data.seoTitle,
    seo_description: data.seoDescription,
  };
}

export async function createCampaign(input: unknown): Promise<ActionResult<CampaignRef>> {
  return adminAction("admin", campaignInputSchema, input, async (data, { db }) => {
    const row = await insertRow<CampaignRef>(db, "donation_campaigns", { ...toCampaignRow(data), is_active: false }, REF);
    invalidate(...campaignTags(row.slug));
    return row;
  });
}

export async function updateCampaign(input: unknown): Promise<ActionResult<CampaignRef>> {
  return adminAction("admin", campaignUpdateSchema, input, async (data, { db }) => {
    const current = await loadRow<CampaignRef>(db, "donation_campaigns", data.id, REF);
    const row = await updateRow<CampaignRef>(db, "donation_campaigns", data.id, toCampaignRow(data), REF);
    invalidate(...campaignTags(current.slug, row.slug));
    return row;
  });
}

export async function setCampaignActive(input: unknown): Promise<ActionResult<CampaignRef>> {
  return adminAction("admin", activeToggleSchema, input, async ({ id, active }, { db }) => {
    if (active) {
      const campaign = await loadRow<{ content: RichTextDoc; summary: string | null }>(
        db,
        "donation_campaigns",
        id,
        "content, summary",
      );
      if (isEmptyDoc(campaign.content) && !campaign.summary) {
        throw new AppError("VALIDATION", "Ajoutez un résumé ou un texte avant d'activer l'appel aux dons.");
      }
    }
    const row = await updateRow<CampaignRef>(db, "donation_campaigns", id, { is_active: active }, REF);
    invalidate(...campaignTags(row.slug));
    return row;
  });
}

export async function deleteCampaign(input: unknown): Promise<ActionResult<{ id: string }>> {
  return adminAction("admin", idInputSchema, input, async ({ id }, { db }) => {
    const current = await loadRow<CampaignRef>(db, "donation_campaigns", id, REF);
    await deleteRow(db, "donation_campaigns", id);
    invalidate(...campaignTags(current.slug));
    return { id };
  });
}
