import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalendarDays, Heart } from "lucide-react";

import { LinkButton } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { ResponsiveImage } from "@/components/ui/ResponsiveImage";
import { Section } from "@/components/ui/Section";
import { campaignPeriod, CampaignProgressBar, OfflineInstructions, SuggestedAmounts } from "@/components/donate/DonateBlocks";
import { OnlineDonation } from "@/components/donate/OnlineDonation";
import { contactsFrom, PageIntro } from "@/components/forms/PageParts";
import { RichText } from "@/components/site/RichText";
import { ShareLinks } from "@/components/site/ShareLinks";
import { DONATE_TEXT } from "@/content/fr/forms";
import { ORG } from "@/content/fr/site";
import { mediaUrl } from "@/lib/media";
import { absoluteUrl } from "@/lib/site-url";
import { SLUG } from "@/lib/validation/forms";
import { getCampaign, getCampaignProgress } from "@/server/data/campaigns";
import { getSiteSettings } from "@/server/data/site";

const D = DONATE_TEXT;

/*
 * Page d'un appel aux dons = LE lien à partager (WhatsApp, Facebook…).
 * Lit l'adresse (slug) : rendu complet côté serveur à chaque visite (même
 * sans JavaScript) et vrai code 404 pour un appel inconnu ou inactif.
 * Les données restent mises en cache (getCampaign, « use cache »).
 */
export const instant = false;

async function loadCampaign(slug: string) {
  return SLUG.test(slug) ? getCampaign(slug) : null;
}

export async function generateMetadata({ params }: PageProps<"/faire-un-don/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const campaign = await loadCampaign(slug);
  if (!campaign) return { title: D.campaign.notFound, robots: { index: false, follow: false } };

  const title = campaign.seoTitle ?? campaign.title;
  const description = campaign.seoDescription ?? campaign.summary ?? campaign.shareMessage ?? D.metaDescription;
  const path = `/faire-un-don/${campaign.slug}`;
  const image = campaign.cover
    ? { url: campaign.cover.path.startsWith("/") ? absoluteUrl(campaign.cover.path) : mediaUrl(campaign.cover.path), alt: campaign.cover.alt }
    : undefined;

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      locale: "fr_FR",
      siteName: ORG.name,
      title,
      description,
      url: path,
      ...(image ? { images: [image] } : {}),
    },
    twitter: { card: image ? "summary_large_image" : "summary", title, description, ...(image ? { images: [image.url] } : {}) },
  };
}

export default async function CampaignPage({ params }: PageProps<"/faire-un-don/[slug]">) {
  const { slug } = await params;
  const campaign = await loadCampaign(slug);
  if (!campaign) notFound();

  const [settings, progress] = await Promise.all([
    getSiteSettings(),
    campaign.showProgress ? getCampaignProgress(campaign.id) : Promise.resolve(null),
  ]);
  const contacts = contactsFrom(settings);
  const period = campaignPeriod(campaign);
  const url = absoluteUrl(`/faire-un-don/${campaign.slug}`);

  return (
    <>
      <PageIntro
        eyebrow={D.campaign.eyebrow}
        title={campaign.title}
        intro={campaign.summary}
        breadcrumbs={[{ label: D.campaign.breadcrumb, href: "/faire-un-don" }, { label: campaign.title }]}
      >
        {period && (
          <p className="mt-5 flex items-center gap-2 text-small font-medium text-muted">
            <CalendarDays aria-hidden="true" className="size-4" />
            {period}
          </p>
        )}
        <div className="mt-8">
          <LinkButton href="#soutenir" variant="donate" size="lg" iconLeft={<Heart aria-hidden="true" />}>
            {D.campaign.supportTitle}
          </LinkButton>
        </div>
      </PageIntro>

      <Section spacing="compact">
        <Container>
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
            <div className="flex min-w-0 flex-col gap-10 lg:col-span-7">
              {campaign.cover && (
                <ResponsiveImage
                  image={campaign.cover}
                  aspect="16/9"
                  priority
                  sizes="(min-width: 1024px) 680px, 100vw"
                  className="rounded-panel"
                />
              )}
              {progress && <CampaignProgressBar progress={progress} />}
              {(campaign.content.content?.length ?? 0) > 0 && (
                <section aria-labelledby="appel-presentation">
                  <h2 id="appel-presentation" className="sr-only">
                    {D.campaign.contentTitle}
                  </h2>
                  <RichText doc={campaign.content} />
                </section>
              )}
              <section aria-labelledby="appel-partage" className="rounded-card border border-line bg-ivory p-6">
                <h2 id="appel-partage" className="text-h4">
                  {D.campaign.shareTitle}
                </h2>
                <p className="mt-2 mb-5 text-small text-muted">{D.campaign.shareText}</p>
                <ShareLinks url={url} message={campaign.shareMessage} label={D.campaign.shareLabel} />
              </section>
            </div>

            <section
              id="soutenir"
              aria-labelledby="appel-soutenir"
              className="flex scroll-mt-24 flex-col gap-8 self-start rounded-panel border border-line bg-white p-5 shadow-card sm:p-8 lg:sticky lg:top-24 lg:col-span-5"
            >
              <h2 id="appel-soutenir" className="text-h3">
                {D.campaign.supportTitle}
              </h2>
              <OnlineDonation settings={settings} contacts={contacts} campaign={{ slug: campaign.slug, title: campaign.title }} />
              <SuggestedAmounts amounts={settings.donationSuggestedAmounts} headingLevel="h3" />
              <OfflineInstructions instructions={settings.offlineDonationInstructions} contacts={contacts} headingLevel="h3" compact />
            </section>
          </div>
        </Container>
      </Section>
    </>
  );
}
