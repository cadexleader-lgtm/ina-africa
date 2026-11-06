import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";

import { LinkButton } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { FormGuard } from "@/components/forms/FormGuard";
import { FORM_IDS, FORM_KEYS } from "@/components/forms/ids";
import { OrgContactCard } from "@/components/forms/OrgContactCard";
import { AsideCard, contactsFrom, FormCard, PageIntro } from "@/components/forms/PageParts";
import { ContactForm } from "@/components/forms/RequestForms";
import { FORM_TEXT } from "@/content/fr/forms";
import { submitContact } from "@/server/actions/requests";
import { getSiteSettings } from "@/server/data/site";
import { PAGE_BACKDROPS } from "@/content/provisional-images";

const C = FORM_TEXT.contact;

export const metadata: Metadata = {
  title: C.metaTitle,
  description: C.metaDescription,
  alternates: { canonical: "/contact" },
  openGraph: { title: C.metaTitle, description: C.metaDescription, url: "/contact" },
};

/** Contact : formulaire (enregistré dans contact_requests) et coordonnées renseignées. */
export default async function ContactPage() {
  const settings = await getSiteSettings();
  const contacts = contactsFrom(settings);

  return (
    <>
      <PageIntro
        backdrop={PAGE_BACKDROPS.contact} eyebrow={C.eyebrow} title={C.title} intro={C.intro} breadcrumbs={[{ label: C.eyebrow }]} />
      <Section labelledBy="contact-formulaire">
        <Container>
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-7">
              <FormCard title={C.formTitle} titleId="contact-formulaire">
                <ContactForm
                  action={submitContact}
                  contacts={contacts}
                  security={<FormGuard formKey={FORM_KEYS.contact} formId={FORM_IDS.contact} contacts={contacts} />}
                />
              </FormCard>
            </div>
            <div className="flex flex-col gap-6 lg:col-span-5">
              <OrgContactCard settings={settings} />
              <AsideCard title={C.joinTitle} tone="white">
                <p className="text-muted">{C.joinText}</p>
                <LinkButton href="/nous-rejoindre" variant="link" className="mt-4" iconRight={<ArrowRight aria-hidden="true" />}>
                  {C.joinAction}
                </LinkButton>
              </AsideCard>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
