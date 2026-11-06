import type { Metadata } from "next";

import { LegalPage } from "@/components/news/LegalPage";
import { NEWS_T } from "@/content/fr/news";
import { pageMetadata } from "@/lib/seo/metadata";
import { isEmptyDoc } from "@/lib/validation/rich-text";
import { getSiteSettings } from "@/server/data/site";

/** Mentions légales : texte saisi dans l'administration, sinon état vide honnête (non indexé). */
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return pageMetadata({
    title: NEWS_T.legal.legalNotice.title,
    description: NEWS_T.legal.legalNotice.description,
    path: "/mentions-legales",
    noindex: isEmptyDoc(settings.legalNotice),
  });
}

export default async function LegalNoticePage() {
  const settings = await getSiteSettings();
  return (
    <LegalPage
      title={NEWS_T.legal.legalNotice.title}
      doc={settings.legalNotice}
      other={{ href: "/politique-de-confidentialite", label: NEWS_T.legal.privacyPolicy.title }}
    />
  );
}
