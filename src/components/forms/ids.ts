/**
 * id des éléments <form> publics. Utilisés par le formulaire (composant
 * client) ET par FormGuard (composant serveur) : le champ caché de
 * l'horodatage se rattache à son formulaire par cet id (attribut `form`).
 */
export const FORM_IDS = {
  contact: "formulaire-contact",
  volunteer: "formulaire-benevole",
  membership: "formulaire-membre",
  partnership: "formulaire-partenaire",
  newsletterPage: "formulaire-newsletter",
  newsletterFooter: "formulaire-newsletter-pied",
  newsletterConfirm: "formulaire-newsletter-confirmer",
  newsletterUnsubscribe: "formulaire-newsletter-desinscrire",
  donation: "formulaire-don",
} as const;

/** Clés signées dans les horodatages (doivent correspondre aux actions serveur). */
export const FORM_KEYS = {
  contact: "contact",
  volunteer: "volunteer",
  membership: "membership",
  partnership: "partnership",
  newsletter: "newsletter",
  donation: "donation",
} as const;
