import type { OrgContacts } from "@/components/forms/ContactAlternatives";
import { ClientFormGuard } from "@/components/forms/ClientFormGuard";
import { FormGuard } from "@/components/forms/FormGuard";
import { FORM_IDS, FORM_KEYS } from "@/components/forms/ids";
import { OnlinePaymentSoon } from "@/components/donate/DonateBlocks";
import { DonationForm } from "@/components/donate/DonationForm";
import { DEFAULT_MIN_DONATION } from "@/lib/money";
import type { SiteSettings } from "@/lib/types/content";
import { requestDonationToken, startOnlineDonation } from "@/server/actions/donations";
import { getActiveProvider } from "@/server/payments/provider";

/**
 * Bloc « don en ligne » : le formulaire n'est rendu QUE si KKiaPay est
 * configuré (sinon : message honnête « le paiement en ligne arrive
 * bientôt »). En mode test, un bandeau annonce qu'aucun argent n'est prélevé.
 *
 * `staticPage` : page entièrement statique (appel aux dons) → l'horodatage
 * anti-robot est demandé par le navigateur (ClientFormGuard).
 */
export function OnlineDonation({
  settings,
  contacts,
  campaign,
  staticPage = false,
}: {
  settings: SiteSettings;
  contacts: OrgContacts;
  campaign?: { slug: string; title: string };
  staticPage?: boolean;
}) {
  const provider = getActiveProvider();
  if (!provider) {
    return <OnlinePaymentSoon hasOffline={settings.offlineDonationInstructions.length > 0} contacts={contacts} />;
  }
  return (
    <DonationForm
      action={startOnlineDonation}
      contacts={contacts}
      security={
        staticPage ? (
          <ClientFormGuard formKey={FORM_KEYS.donation} formId={FORM_IDS.donation} contacts={contacts} tokenAction={requestDonationToken} />
        ) : (
          <FormGuard formKey={FORM_KEYS.donation} formId={FORM_IDS.donation} contacts={contacts} />
        )
      }
      suggestedAmounts={settings.donationSuggestedAmounts.filter((amount) => Number.isSafeInteger(amount) && amount > 0)}
      minAmount={settings.donationMinAmount ?? DEFAULT_MIN_DONATION}
      providerLabel={provider.label}
      testMode={provider.mode === "sandbox"}
      campaign={campaign}
    />
  );
}
