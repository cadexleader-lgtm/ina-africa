import type { Metadata } from "next";

import { FormGuard } from "@/components/forms/FormGuard";
import { FORM_IDS, FORM_KEYS } from "@/components/forms/ids";
import { JoinLayout, joinPageTexts } from "@/components/forms/JoinLayout";
import { MembershipIntro } from "@/components/forms/MembershipIntro";
import { contactsFrom } from "@/components/forms/PageParts";
import { MembershipForm } from "@/components/forms/RequestForms";
import { FORM_TEXT } from "@/content/fr/forms";
import { submitMembership } from "@/server/actions/requests";
import { getSiteSettings } from "@/server/data/site";
import { JOIN_PAGE } from "@/content/page-sections/nous-rejoindre";
import { getPageContent } from "@/server/data/page-sections";

const M = FORM_TEXT.member;

export const metadata: Metadata = {
  title: M.metaTitle,
  description: M.metaDescription,
  alternates: { canonical: "/nous-rejoindre/membre" },
  openGraph: { title: M.metaTitle, description: M.metaDescription, url: "/nous-rejoindre/membre" },
};

export default async function MembershipPage() {
  const [settings, page, content] = await Promise.all([getSiteSettings(), joinPageTexts("membre"), getPageContent(JOIN_PAGE)]);
  const contacts = contactsFrom(settings);
  return (
    <JoinLayout
      backdrop={page.backdrop}
      current="member"
      title={page.title}
      intro={page.intro}
      formTitle={page.formTitle}
      formNote={page.s.text("conditionsNote")}
      before={<MembershipIntro s={content.section("adhesion")} />}
    >
      <MembershipForm
        action={submitMembership}
        contacts={contacts}
        security={<FormGuard formKey={FORM_KEYS.membership} formId={FORM_IDS.membership} contacts={contacts} />}
      />
    </JoinLayout>
  );
}
