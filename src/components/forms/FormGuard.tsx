import { Suspense } from "react";
import { connection } from "next/server";

import { UnavailableNotice } from "@/components/forms/UnavailableNotice";
import type { OrgContacts } from "@/components/forms/ContactAlternatives";
import { SPAM_FIELDS } from "@/lib/validation/forms";
import { isEmailConfigured } from "@/server/email";
import { issueFormToken } from "@/server/security/form-token";
import { formsConfigProblem, getFormSecret } from "@/server/security/forms-backend";

/**
 * Partie de formulaire calculée À CHAQUE VISITE (composant serveur sous
 * <Suspense>, le reste de la page reste prérendu) :
 *  - formulaire utilisable : horodatage signé dans un champ caché ;
 *  - formulaire pas encore configuré : message honnête et coordonnées.
 *
 * Le champ caché porte l'attribut `form` : même sans JavaScript (contenu
 * diffusé en fin de page), il est envoyé avec SON formulaire.
 */
type FormGuardProps = {
  /** Clé signée dans l'horodatage (doit être celle attendue par l'action). */
  formKey: string;
  /** id de l'élément <form>. */
  formId: string;
  contacts: OrgContacts;
  /** Condition supplémentaire (ex. envoi d'emails configuré pour la newsletter). */
  requireEmail?: boolean;
};

async function GuardContent({ formKey, formId, contacts, requireEmail = false }: FormGuardProps) {
  await connection();
  const secret = getFormSecret();
  if (!secret || (requireEmail && !isEmailConfigured())) {
    // Diagnostic (noms de variables seulement) : visible dans les journaux de l'hébergeur.
    console.warn(
      `[ina-africa] formulaire « ${formKey} » indisponible :`,
      !secret ? formsConfigProblem() : "envoi d'emails non configuré (RESEND_API_KEY, EMAIL_FROM)",
    );
    return <UnavailableNotice contacts={contacts} />;
  }
  return <input type="hidden" name={SPAM_FIELDS.token} value={issueFormToken(formKey, secret)} form={formId} />;
}

export function FormGuard(props: FormGuardProps) {
  return (
    <Suspense fallback={null}>
      <GuardContent {...props} />
    </Suspense>
  );
}
