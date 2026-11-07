import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarDays, Handshake, HandHeart, Heart, MapPin, Users } from "lucide-react";

import { LinkButton } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { OfflineInstructions, SuggestedAmounts } from "@/components/donate/DonateBlocks";
import { NeedCard } from "@/components/donate/NeedCard";
import { OnlineDonation } from "@/components/donate/OnlineDonation";
import { formatAchievementDate } from "@/components/site/AchievementCard";
import { AsideCard, contactsFrom, PageIntro } from "@/components/forms/PageParts";
import { DONATE_TEXT } from "@/content/fr/forms";
import { ACHIEVEMENTS } from "@/content/fr/ina-africa";
import { PAGE_BACKDROPS } from "@/content/provisional-images";
import { getCampaignProgress, listActiveCampaigns } from "@/server/data/campaigns";
import { getSiteSettings } from "@/server/data/site";
import { getActiveProvider } from "@/server/payments/provider";

const D = DONATE_TEXT;

export const metadata: Metadata = {
  title: D.metaTitle,
  description: D.metaDescription,
  alternates: { canonical: "/faire-un-don" },
  openGraph: { title: D.metaTitle, description: D.metaDescription, url: "/faire-un-don" },
};

const LINK = "inline-flex items-center gap-2 font-semibold text-link underline-offset-4 hover:text-link-strong hover:underline";

/** Actions datées transmises par l'ONG (preuves concrètes, jamais inventées). */
const PROOF = ACHIEVEMENTS.filter((achievement) => achievement.date).slice(0, 3);

/**
 * Page générale de don : formulaire de don en ligne (si KKiaPay est
 * configuré), coordonnées Mobile Money / virement saisies par l'ONG, actions
 * réelles de l'ONG, besoins du moment (appels aux dons actifs).
 */
export default async function DonatePage() {
  const [settings, campaigns] = await Promise.all([getSiteSettings(), listActiveCampaigns()]);
  const contacts = contactsFrom(settings);
  const online = getActiveProvider() !== null;
  const featured = campaigns.slice(0, 3);
  const progress = await Promise.all(
    featured.map((campaign) => (campaign.showProgress ? getCampaignProgress(campaign.id) : Promise.resolve(null))),
  );

  return (
    <>
      <PageIntro backdrop={PAGE_BACKDROPS.donate} eyebrow={D.eyebrow} title={D.title} intro={D.intro} breadcrumbs={[{ label: D.eyebrow }]}>
        <div className="mt-8 flex flex-wrap gap-3">
          <LinkButton href="#votre-don" variant="donate" size="lg" iconLeft={<Heart aria-hidden="true" />}>
            {D.online.submit}
          </LinkButton>
          <LinkButton href="/nos-besoins" variant="secondary" size="lg">
            {D.campaigns.all}
          </LinkButton>
        </div>
      </PageIntro>

      <Section labelledBy="votre-don-titre">
        <Container>
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
            <div className="flex min-w-0 flex-col gap-10 lg:col-span-7">
              <section
                id="votre-don"
                aria-labelledby="votre-don-titre"
                className="scroll-mt-24 rounded-panel border border-line bg-white p-5 shadow-card sm:p-8"
              >
                <div className="mb-6 flex flex-col gap-2">
                  <h2 id="votre-don-titre" className="text-h2">
                    {D.formTitle}
                  </h2>
                  <p className="text-body text-muted">{D.formIntro}</p>
                </div>
                <OnlineDonation settings={settings} contacts={contacts} />
              </section>
              <OfflineInstructions instructions={settings.offlineDonationInstructions} contacts={contacts} />
            </div>

            <div className="flex flex-col gap-6 lg:col-span-5">
              {PROOF.length > 0 && (
                <section aria-labelledby="don-preuves" className="rounded-card border border-line bg-ivory p-6 sm:p-7">
                  <h2 id="don-preuves" className="text-h4">
                    {D.proofTitle}
                  </h2>
                  <p className="mt-1 text-small text-muted">{D.proofIntro}</p>
                  <ol className="mt-5 flex flex-col gap-4">
                    {PROOF.map((achievement) => (
                      <li key={achievement.title} className="flex gap-3">
                        <span aria-hidden="true" className="mt-1 size-2.5 shrink-0 rounded-full bg-gold" />
                        <div className="flex min-w-0 flex-col gap-0.5">
                          <p className="font-semibold text-brand">{achievement.title}</p>
                          <p className="flex flex-wrap gap-x-3 gap-y-0.5 text-small text-muted">
                            <span className="inline-flex items-center gap-1">
                              <CalendarDays aria-hidden="true" className="size-3.5" />
                              {formatAchievementDate(achievement.date!)}
                            </span>
                            {achievement.place && (
                              <span className="inline-flex items-center gap-1">
                                <MapPin aria-hidden="true" className="size-3.5" />
                                {achievement.place}
                              </span>
                            )}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>
                  <Link href="/projets#actions-documentees" className={`${LINK} mt-5`}>
                    {D.proofAction}
                    <ArrowRight aria-hidden="true" className="size-4" />
                  </Link>
                </section>
              )}

              {!online && settings.donationSuggestedAmounts.length > 0 && (
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

      {featured.length > 0 && (
        <Section tone="ivory" labelledBy="don-appels">
          <Container>
            <SectionHeading id="don-appels" label={D.needs.eyebrow} title={D.campaigns.title} intro={D.campaigns.intro} />
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((campaign, index) => (
                <li key={campaign.id} className="flex">
                  <NeedCard campaign={campaign} progress={progress[index]} />
                </li>
              ))}
            </ul>
            {campaigns.length > featured.length && (
              <p className="mt-8">
                <Link href="/nos-besoins" className={LINK}>
                  {D.campaigns.all}
                  <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
              </p>
            )}
          </Container>
        </Section>
      )}
    </>
  );
}
