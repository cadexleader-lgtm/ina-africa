import type { Metadata } from "next";

import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { FormGuard } from "@/components/forms/FormGuard";
import { FORM_IDS, FORM_KEYS } from "@/components/forms/ids";
import { NewsletterPageForm } from "@/components/forms/NewsletterForms";
import { contactsFrom, FormCard, PageIntro } from "@/components/forms/PageParts";
import { FORM_TEXT } from "@/content/fr/forms";
import { subscribeNewsletter } from "@/server/actions/newsletter";
import { getSiteSettings } from "@/server/data/site";

const N = FORM_TEXT.newsletter;

export const metadata: Metadata = {
  title: N.pageMetaTitle,
  description: N.pageMetaDescription,
  alternates: { canonical: "/newsletter" },
};

/**
 * Inscription à la lettre d'information. Page de secours du formulaire du
 * pied de page : celle-ci fonctionne aussi sans JavaScript.
 */
export default async function NewsletterPage() {
  const contacts = contactsFrom(await getSiteSettings());
  return (
    <>
      <PageIntro eyebrow={N.pageTitle} title={N.pageTitle} intro={N.pageIntro} breadcrumbs={[{ label: N.pageTitle }]} />
      <Section labelledBy="newsletter-formulaire">
        <Container size="reading">
          <FormCard title={N.footerTitle} titleId="newsletter-formulaire">
            <NewsletterPageForm
              action={subscribeNewsletter}
              contacts={contacts}
              security={<FormGuard formKey={FORM_KEYS.newsletter} formId={FORM_IDS.newsletterPage} contacts={contacts} requireEmail />}
            />
          </FormCard>
        </Container>
      </Section>
    </>
  );
}
