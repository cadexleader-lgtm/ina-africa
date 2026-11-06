import type { Metadata } from "next";

import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { FORM_IDS } from "@/components/forms/ids";
import { LinkActionForm } from "@/components/forms/NewsletterForms";
import { TokenField } from "@/components/forms/NewsletterServer";
import { FormCard, PageIntro } from "@/components/forms/PageParts";
import { FORM_TEXT } from "@/content/fr/forms";
import { confirmNewsletter } from "@/server/actions/newsletter";

const N = FORM_TEXT.newsletter;

// Lit l'adresse (jeton) : rendu complet côté serveur à chaque visite, même sans JavaScript.
export const instant = false;

export const metadata: Metadata = {
  title: N.confirmMetaTitle,
  robots: { index: false, follow: false },
  // Le jeton est dans l'adresse : il n'est jamais transmis aux sites liés.
  // « same-origin » et non « no-referrer » : ce dernier fait envoyer « Origin: null »,
  // que la protection CSRF des actions serveur refuse.
  referrer: "same-origin",
};

/** Confirmation d'inscription : n'agit qu'au clic sur le bouton (jamais au chargement). */
export default async function NewsletterConfirmPage({ searchParams }: PageProps<"/newsletter/confirmer">) {
  const { token } = await searchParams;
  return (
    <>
      <PageIntro
        title={N.confirmTitle}
        intro={N.confirmIntro}
        breadcrumbs={[{ label: N.pageTitle, href: "/newsletter" }, { label: N.confirmTitle }]}
      />
      <Section labelledBy="newsletter-confirmer">
        <Container size="reading">
          <FormCard title={N.confirmAction} titleId="newsletter-confirmer" description={N.linkSafety}>
            <LinkActionForm
              id={FORM_IDS.newsletterConfirm}
              action={confirmNewsletter}
              token={<TokenField token={token} formId={FORM_IDS.newsletterConfirm} />}
              submitLabel={N.confirmAction}
              pendingLabel={N.confirmPending}
            />
          </FormCard>
        </Container>
      </Section>
    </>
  );
}
