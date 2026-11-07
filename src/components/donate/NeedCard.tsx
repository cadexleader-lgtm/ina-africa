import Link from "next/link";
import { HandCoins, Heart, Target } from "lucide-react";

import { LinkButton } from "@/components/ui/Button";
import { ResponsiveImage } from "@/components/ui/ResponsiveImage";
import { campaignPeriod } from "@/components/donate/DonateBlocks";
import { MediaTile } from "@/components/site/MediaTile";
import { DONATE_TEXT } from "@/content/fr/forms";
import { formatFcfa, progressPercent } from "@/lib/money";
import type { CampaignProgress, DonationCampaign } from "@/lib/types/content";

const N = DONATE_TEXT.needs;

/**
 * Carte « besoin » (= appel aux dons actif, saisi par l'ONG dans
 * l'administration) : photo réelle, objectif, jauge si l'ONG a choisi de
 * l'afficher, et un bouton qui mène directement au formulaire de don.
 * Aucun montant n'est inventé : sans objectif saisi, rien n'est affiché.
 */
export function NeedCard({
  campaign,
  progress,
  headingLevel: Heading = "h3",
}: {
  campaign: DonationCampaign;
  progress?: CampaignProgress | null;
  headingLevel?: "h2" | "h3";
}) {
  const href = `/faire-un-don/${campaign.slug}`;
  const period = campaignPeriod(campaign);
  const goal = progress?.goalAmount ?? campaign.goalAmount;
  const percent = progress ? progressPercent(progress.totalAmount, progress.goalAmount) : null;

  return (
    <article className="flex w-full flex-col overflow-hidden rounded-card border border-line bg-white shadow-card">
      <div className="relative aspect-[16/10] shrink-0 overflow-hidden bg-brand-50">
        {campaign.cover ? (
          <ResponsiveImage
            image={campaign.cover}
            fill
            sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
            imgClassName="object-cover"
          />
        ) : (
          <MediaTile icon={HandCoins} className="absolute inset-0" />
        )}
        {goal ? (
          <p className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-gold px-3 py-1 text-small font-semibold text-brand shadow-card">
            <Target aria-hidden="true" className="size-4" />
            {N.goal} : <span className="tabular-nums">{formatFcfa(goal)}</span>
          </p>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-6">
        {period && <p className="text-small font-medium text-muted">{period}</p>}
        <Heading className="text-h4">
          <Link href={href} className="hover:text-link-strong hover:underline hover:underline-offset-4">
            {campaign.title}
          </Link>
        </Heading>
        {campaign.summary && <p className="line-clamp-3 text-muted">{campaign.summary}</p>}

        {progress && percent !== null && (
          <div className="mt-1">
            <div
              role="progressbar"
              aria-label={DONATE_TEXT.progress.barLabel}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={percent}
              aria-valuetext={DONATE_TEXT.progress.percent(percent)}
              className="h-2.5 overflow-hidden rounded-full bg-brand-50"
            >
              <div className="h-full rounded-full bg-gold" style={{ width: `${percent}%` }} />
            </div>
            <p className="mt-2 flex flex-wrap justify-between gap-x-3 text-small">
              <span className="font-semibold text-brand tabular-nums">{N.collected(formatFcfa(progress.totalAmount))}</span>
              <span className="text-muted tabular-nums">{DONATE_TEXT.progress.percent(percent)}</span>
            </p>
          </div>
        )}

        <div className="mt-auto pt-3">
          <LinkButton href={`${href}#soutenir`} variant="donate" fullWidth iconLeft={<Heart aria-hidden="true" />}>
            {N.support}
          </LinkButton>
        </div>
      </div>
    </article>
  );
}
