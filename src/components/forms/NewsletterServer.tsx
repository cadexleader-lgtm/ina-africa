import { Alert } from "@/components/ui/Alert";
import { NewsletterSignup } from "@/components/forms/NewsletterForms";
import { contactsFrom } from "@/components/forms/PageParts";
import { FORM_TEXT } from "@/content/fr/forms";
import { NEWSLETTER_TOKEN } from "@/lib/validation/forms";
import { requestNewsletterToken, subscribeNewsletter } from "@/server/actions/newsletter";
import { getSiteSettings } from "@/server/data/site";

/**
 * Bloc newsletter du pied de page (composant serveur) : transmet les actions
 * serveur au formulaire client. À n'afficher que si isNewsletterAvailable().
 */
export async function NewsletterFooterBlock() {
  const contacts = contactsFrom(await getSiteSettings());
  return <NewsletterSignup subscribeAction={subscribeNewsletter} tokenAction={requestNewsletterToken} contacts={contacts} />;
}

/**
 * Jeton du lien reçu par email (lu dans l'adresse par la page, rendu complet
 * côté serveur : visible et envoyé même sans JavaScript). Un jeton mal formé
 * n'est jamais recopié dans la page.
 */
export function TokenField({ token, formId }: { token: string | string[] | undefined; formId: string }) {
  const value = typeof token === "string" ? token.trim() : "";
  if (!NEWSLETTER_TOKEN.test(value)) {
    return (
      <Alert tone="warning" role="none">
        <p>{FORM_TEXT.newsletter.linkMissing}</p>
      </Alert>
    );
  }
  return <input type="hidden" name="token" value={value} form={formId} />;
}
