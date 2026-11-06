import type { OrgContacts } from "@/components/forms/ContactAlternatives";
import { FormGuard } from "@/components/forms/FormGuard";
import { FORM_IDS, FORM_KEYS } from "@/components/forms/ids";
import { OnlinePaymentSoon } from "@/components/donate/DonateBlocks";
import { DonationForm } from "@/components/donate/DonationForm";
import { DEFAULT_MIN_DONATION } from "@/lib/money";
import type { SiteSettings } from "@/lib/types/content";
import { startOnlineDonation } from "@/server/actions/donations";
import { getActiveProvider } from "@/server/payments/provider";

/**
 * Bloc « don en ligne » : le formulaire n'est rendu QUE si un prestataire
 * réel est actif. Aujourd'hui (aucun adaptateur, Phase 4) : message honnête
 * « le paiement en ligne arrive bientôt ».
 */
export function OnlineDonation({
  settings,
  contacts,
  campaign,
}: {
  settings: SiteSettings;
  contacts: OrgContacts;
  campaign?: { slug: string; title: string };
}) {
  const provider = getActiveProvider();
  if (!provider) {
    return <OnlinePaymentSoon hasOffline={settings.offlineDonationInstructions.length > 0} contacts={contacts} />;
  }
  return (
    <DonationForm
      action={startOnlineDonation}
      contacts={contacts}
      security={<FormGuard formKey={FORM_KEYS.donation} formId={FORM_IDS.donation} contacts={contacts} />}
      suggestedAmounts={settings.donationSuggestedAmounts.filter((amount) => Number.isSafeInteger(amount) && amount > 0)}
      minAmount={settings.donationMinAmount ?? DEFAULT_MIN_DONATION}
      providerLabel={provider.label}
      campaign={campaign}
    />
  );
}
