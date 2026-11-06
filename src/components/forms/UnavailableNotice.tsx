import { Alert } from "@/components/ui/Alert";
import { ContactAlternatives, hasContacts, type OrgContacts } from "@/components/forms/ContactAlternatives";
import { FORM_TEXT } from "@/content/fr/forms";

/**
 * Message honnête : le formulaire n'enregistre encore rien (Supabase ou clé
 * serveur non configurés). Propose les coordonnées de l'ONG si elles existent.
 */
export function UnavailableNotice({
  contacts,
  message = FORM_TEXT.errors.unavailable,
  title = FORM_TEXT.errors.unavailableTitle,
  role = "none",
}: {
  contacts: OrgContacts;
  message?: string;
  title?: string;
  role?: "alert" | "status" | "none";
}) {
  const E = FORM_TEXT.errors;
  return (
    <Alert tone="warning" title={title} role={role}>
      <p>{message}</p>
      {hasContacts(contacts) ? (
        <>
          <p className="mt-2">{E.unavailableContact}</p>
          <ContactAlternatives contacts={contacts} className="mt-2" />
        </>
      ) : (
        <p className="mt-2">{E.unavailableLater}</p>
      )}
    </Alert>
  );
}
