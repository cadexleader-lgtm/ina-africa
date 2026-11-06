import type { Metadata } from "next";

import { FormGuard } from "@/components/forms/FormGuard";
import { FORM_IDS, FORM_KEYS } from "@/components/forms/ids";
import { JoinLayout } from "@/components/forms/JoinLayout";
import { contactsFrom } from "@/components/forms/PageParts";
import { MembershipForm } from "@/components/forms/RequestForms";
import { FORM_TEXT } from "@/content/fr/forms";
import { submitMembership } from "@/server/actions/requests";
import { getSiteSettings } from "@/server/data/site";

const M = FORM_TEXT.member;

export const metadata: Metadata = {
  title: M.metaTitle,
  description: M.metaDescription,
  alternates: { canonical: "/nous-rejoindre/membre" },
  openGraph: { title: M.metaTitle, description: M.metaDescription, url: "/nous-rejoindre/membre" },
};

export default async function MembershipPage() {
  const contacts = contactsFrom(await getSiteSettings());
  return (
    <JoinLayout current="member" title={M.title} intro={M.intro} formTitle={M.formTitle} formNote={M.conditionsNote}>
      <MembershipForm
        action={submitMembership}
        contacts={contacts}
        security={<FormGuard formKey={FORM_KEYS.membership} formId={FORM_IDS.membership} contacts={contacts} />}
      />
    </JoinLayout>
  );
}
