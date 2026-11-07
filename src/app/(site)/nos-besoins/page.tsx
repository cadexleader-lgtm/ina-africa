import type { Metadata } from "next";
import { HandHeart, Heart } from "lucide-react";

import { LinkButton } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { NeedCard } from "@/components/donate/NeedCard";
import { PageIntro } from "@/components/forms/PageParts";
import { DONATE_TEXT } from "@/content/fr/forms";
import { PAGE_BACKDROPS } from "@/content/provisional-images";
import { getCampaignProgress, listActiveCampaigns } from "@/server/data/campaigns";

const N = DONATE_TEXT.needs;

export const metadata: Metadata = {
  title: N.metaTitle,
  description: N.metaDescription,
  alternates: { canonical: "/nos-besoins" },
  openGraph: { title: N.metaTitle, description: N.metaDescription, url: "/nos-besoins" },
};

/**
 * « Nos besoins » : les appels aux dons ACTIFS, saisis par l'ONG dans
 * l'administration (titre, photo, objectif, jauge). Aucun besoin ni montant
 * n'est inventé : sans appel actif, un message honnête et le don général.
 */
export default async function NeedsPage() {
  const campaigns = await listActiveCampaigns();
  const progress = await Promise.all(
    campaigns.map((campaign) => (campaign.showProgress ? getCampaignProgress(campaign.id) : Promise.resolve(null))),
  );

  return (
    <>
      <PageIntro
        backdrop={PAGE_BACKDROPS.needs}
        eyebrow={N.eyebrow}
        title={N.title}
        intro={N.intro}
        breadcrumbs={[{ label: N.eyebrow }]}
      />

      <Section labelledBy="besoins-liste">
        <Container>
          <h2 id="besoins-liste" className="sr-only">
            {N.title}
          </h2>
          {campaigns.length > 0 ? (
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {campaigns.map((campaign, index) => (
                <li key={campaign.id} className="flex">
                  <NeedCard campaign={campaign} progress={progress[index]} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="mx-auto flex max-w-reading flex-col items-center gap-5 rounded-panel border border-line bg-ivory px-6 py-12 text-center sm:px-10">
              <span aria-hidden="true" className="flex size-16 items-center justify-center rounded-full bg-gold-50">
                <HandHeart className="size-8 text-brand" strokeWidth={1.75} />
              </span>
              <p className="text-h3 text-brand">{N.emptyTitle}</p>
              <p className="text-body text-ink">{N.emptyText}</p>
              <LinkButton href="/faire-un-don" variant="donate" size="lg" iconLeft={<Heart aria-hidden="true" />}>
                {N.emptyAction}
              </LinkButton>
            </div>
          )}
        </Container>
      </Section>

      {campaigns.length > 0 && (
        <Section tone="brand" spacing="compact" labelledBy="besoins-general">
          <Container>
            <div className="flex flex-col items-start gap-5 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-col gap-2">
                <h2 id="besoins-general" className="text-h3">
                  {N.generalTitle}
                </h2>
                <p className="text-lead text-muted-inverse">{N.generalText}</p>
              </div>
              <LinkButton href="/faire-un-don" variant="donate" size="lg" iconLeft={<Heart aria-hidden="true" />}>
                {N.generalAction}
              </LinkButton>
            </div>
          </Container>
        </Section>
      )}
    </>
  );
}
