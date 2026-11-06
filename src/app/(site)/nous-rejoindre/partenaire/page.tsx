import type { Metadata } from "next";

import { FormGuard } from "@/components/forms/FormGuard";
import { FORM_IDS, FORM_KEYS } from "@/components/forms/ids";
import { JoinLayout } from "@/components/forms/JoinLayout";
import { contactsFrom } from "@/components/forms/PageParts";
import { PartnerForm } from "@/components/forms/RequestForms";
import { FORM_TEXT } from "@/content/fr/forms";
import { submitPartnership } from "@/server/actions/requests";
import { getSiteSettings } from "@/server/data/site";
import { PAGE_BACKDROPS } from "@/content/provisional-images";

const P = FORM_TEXT.partner;

export const metadata: Metadata = {
  title: P.metaTitle,
  description: P.metaDescription,
  alternates: { canonical: "/nous-rejoindre/partenaire" },
  openGraph: { title: P.metaTitle, description: P.metaDescription, url: "/nous-rejoindre/partenaire" },
};

export default async function PartnerPage() {
  const contacts = contactsFrom(await getSiteSettings());
  return (
    <JoinLayout
        backdrop={PAGE_BACKDROPS.partner} current="partner" title={P.title} intro={P.intro} formTitle={P.formTitle}>
      <PartnerForm
        action={submitPartnership}
        contacts={contacts}
        security={<FormGuard formKey={FORM_KEYS.partnership} formId={FORM_IDS.partnership} contacts={contacts} />}
      />
    </JoinLayout>
  );
}
