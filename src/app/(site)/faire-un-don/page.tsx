import type { Metadata } from "next";
import Link from "next/link";
import { Handshake, HandHeart, Users } from "lucide-react";

import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { CampaignCard, OfflineInstructions, SuggestedAmounts } from "@/components/donate/DonateBlocks";
import { OnlineDonation } from "@/components/donate/OnlineDonation";
import { AsideCard, contactsFrom, PageIntro } from "@/components/forms/PageParts";
import { DONATE_TEXT } from "@/content/fr/forms";
import { listActiveCampaigns } from "@/server/data/campaigns";
import { getSiteSettings } from "@/server/data/site";

const D = DONATE_TEXT;

export const metadata: Metadata = {
  title: D.metaTitle,
  description: D.metaDescription,
  alternates: { canonical: "/faire-un-don" },
  openGraph: { title: D.metaTitle, description: D.metaDescription, url: "/faire-un-don" },
};

const LINK = "inline-flex items-center gap-2 font-semibold text-link underline-offset-4 hover:text-link-strong hover:underline";

/**
 * Page générale de don : paiement en ligne SEULEMENT si un prestataire est
 * actif, sinon message honnête ; instructions de don hors ligne et montants
 * suggérés venant de l'administration ; appels aux dons actifs.
 */
export default async function DonatePage() {
  const [settings, campaigns] = await Promise.all([getSiteSettings(), listActiveCampaigns()]);
  const contacts = contactsFrom(settings);

  return (
    <>
      <PageIntro eyebrow={D.eyebrow} title={D.title} intro={D.intro} breadcrumbs={[{ label: D.eyebrow }]} />

      <Section labelledBy="don-comment">
        <Container>
          <h2 id="don-comment" className="sr-only">
            {D.online.title}
          </h2>
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
            <div className="flex flex-col gap-10 lg:col-span-7">
              <OnlineDonation settings={settings} contacts={contacts} />
              <OfflineInstructions instructions={settings.offlineDonationInstructions} contacts={contacts} />
            </div>
            <div className="flex flex-col gap-6 lg:col-span-5">
              {settings.donationSuggestedAmounts.length > 0 && (
                <div className="rounded-card border border-line bg-white p-6 sm:p-7">
                  <SuggestedAmounts amounts={settings.donationSuggestedAmounts} />
                </div>
              )}
              <AsideCard title={D.otherWays.title}>
                <ul className="flex flex-col gap-3">
                  <li>
                    <Link href="/nous-rejoindre/benevole" className={LINK}>
                      <HandHeart aria-hidden="true" className="size-5 text-brand-2" />
                      {D.otherWays.volunteer}
                    </Link>
                  </li>
                  <li>
                    <Link href="/nous-rejoindre/membre" className={LINK}>
                      <Users aria-hidden="true" className="size-5 text-brand-2" />
                      {D.otherWays.member}
                    </Link>
                  </li>
                  <li>
                    <Link href="/nous-rejoindre/partenaire" className={LINK}>
                      <Handshake aria-hidden="true" className="size-5 text-brand-2" />
                      {D.otherWays.partner}
                    </Link>
                  </li>
                </ul>
              </AsideCard>
            </div>
          </div>
        </Container>
      </Section>

      {campaigns.length > 0 && (
        <Section tone="ivory" labelledBy="don-appels">
          <Container>
            <SectionHeading id="don-appels" label={D.eyebrow} title={D.campaigns.title} intro={D.campaigns.intro} />
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {campaigns.map((campaign) => (
                <li key={campaign.id} className="flex">
                  <CampaignCard campaign={campaign} />
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      )}
    </>
  );
}
