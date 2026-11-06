import type { Metadata } from "next";

import { FormGuard } from "@/components/forms/FormGuard";
import { FORM_IDS, FORM_KEYS } from "@/components/forms/ids";
import { JoinLayout } from "@/components/forms/JoinLayout";
import { contactsFrom } from "@/components/forms/PageParts";
import { VolunteerForm } from "@/components/forms/RequestForms";
import { FORM_TEXT } from "@/content/fr/forms";
import { submitVolunteer } from "@/server/actions/requests";
import { getSiteSettings } from "@/server/data/site";

const V = FORM_TEXT.volunteer;

export const metadata: Metadata = {
  title: V.metaTitle,
  description: V.metaDescription,
  alternates: { canonical: "/nous-rejoindre/benevole" },
  openGraph: { title: V.metaTitle, description: V.metaDescription, url: "/nous-rejoindre/benevole" },
};

export default async function VolunteerPage() {
  const contacts = contactsFrom(await getSiteSettings());
  return (
    <JoinLayout current="volunteer" title={V.title} intro={V.intro} formTitle={V.formTitle}>
      <VolunteerForm
        action={submitVolunteer}
        contacts={contacts}
        security={<FormGuard formKey={FORM_KEYS.volunteer} formId={FORM_IDS.volunteer} contacts={contacts} />}
      />
    </JoinLayout>
  );
}
