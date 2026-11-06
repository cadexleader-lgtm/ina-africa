import type { Metadata } from "next";

import { LegalPage } from "@/components/news/LegalPage";
import { NEWS_T } from "@/content/fr/news";
import { pageMetadata } from "@/lib/seo/metadata";
import { isEmptyDoc } from "@/lib/validation/rich-text";
import { getSiteSettings } from "@/server/data/site";

/** Politique de confidentialité : texte saisi dans l'administration, sinon état vide honnête (non indexé). */
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return pageMetadata({
    title: NEWS_T.legal.privacyPolicy.title,
    description: NEWS_T.legal.privacyPolicy.description,
    path: "/politique-de-confidentialite",
    noindex: isEmptyDoc(settings.privacyPolicy),
  });
}

export default async function PrivacyPolicyPage() {
  const settings = await getSiteSettings();
  return (
    <LegalPage
      title={NEWS_T.legal.privacyPolicy.title}
      doc={settings.privacyPolicy}
      other={{ href: "/mentions-legales", label: NEWS_T.legal.legalNotice.title }}
    />
  );
}
