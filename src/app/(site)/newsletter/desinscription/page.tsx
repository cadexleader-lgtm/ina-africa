import type { Metadata } from "next";

import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { FORM_IDS } from "@/components/forms/ids";
import { LinkActionForm } from "@/components/forms/NewsletterForms";
import { TokenField } from "@/components/forms/NewsletterServer";
import { FormCard, PageIntro } from "@/components/forms/PageParts";
import { FORM_TEXT } from "@/content/fr/forms";
import { unsubscribeNewsletter } from "@/server/actions/newsletter";

const N = FORM_TEXT.newsletter;

// Lit l'adresse (jeton) : rendu complet côté serveur à chaque visite, même sans JavaScript.
export const instant = false;

export const metadata: Metadata = {
  title: N.unsubscribeMetaTitle,
  robots: { index: false, follow: false },
  // « same-origin » et non « no-referrer » : ce dernier fait envoyer « Origin: null »,
  // que la protection CSRF des actions serveur refuse.
  referrer: "same-origin",
};

/** Désinscription : n'agit qu'au clic sur le bouton (jamais au chargement). */
export default async function NewsletterUnsubscribePage({ searchParams }: PageProps<"/newsletter/desinscription">) {
  const { token } = await searchParams;
  return (
    <>
      <PageIntro
        title={N.unsubscribeTitle}
        intro={N.unsubscribeIntro}
        breadcrumbs={[{ label: N.pageTitle, href: "/newsletter" }, { label: N.unsubscribeMetaTitle }]}
      />
      <Section labelledBy="newsletter-desinscrire">
        <Container size="reading">
          <FormCard title={N.unsubscribeAction} titleId="newsletter-desinscrire" description={N.linkSafety}>
            <LinkActionForm
              id={FORM_IDS.newsletterUnsubscribe}
              action={unsubscribeNewsletter}
              token={<TokenField token={token} formId={FORM_IDS.newsletterUnsubscribe} />}
              submitLabel={N.unsubscribeAction}
              pendingLabel={N.unsubscribePending}
            />
          </FormCard>
        </Container>
      </Section>
    </>
  );
}
