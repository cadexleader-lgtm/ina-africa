/**
 * Gestion centralisée des erreurs.
 *
 * Chaque action serveur renvoie un `ActionResult` : jamais d'exception brute
 * vers l'interface, jamais de détail technique montré au visiteur. Le
 * message est en français et compréhensible ; le détail technique reste
 * dans les journaux du serveur.
 */

export type ErrorCode =
  | "VALIDATION"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "PAYMENT_PROVIDER"
  | "INTERNAL";

export type FieldErrors = Record<string, string[]>;

export type ActionError = {
  code: ErrorCode;
  message: string;
  fieldErrors?: FieldErrors;
};

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: ActionError };

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly fieldErrors?: FieldErrors;

  constructor(code: ErrorCode, message: string, fieldErrors?: FieldErrors) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

export const ok = <T>(data: T): ActionResult<T> => ({ ok: true, data });

export const fail = (code: ErrorCode, message: string, fieldErrors?: FieldErrors): ActionResult<never> => ({
  ok: false,
  error: { code, message, fieldErrors },
});

/** Forme d'une erreur renvoyée par Supabase (PostgREST ou Postgres). */
export type DatabaseErrorLike = {
  code?: string;
  message?: string;
  details?: string | null;
  hint?: string | null;
};

const GENERIC_MESSAGE = "Une erreur est survenue. Réessayez dans un instant.";

/** Indice posé sur toutes les erreurs levées par nos fonctions SQL (voir supabase/migrations). */
export const APP_ERROR_HINT = "ina-africa";

/** Messages clairs pour les contraintes connues de la base (voir supabase/migrations). */
const CONSTRAINT_MESSAGES: Record<string, string> = {
  articles_slug_key: "Cette adresse est déjà utilisée par un autre article.",
  projects_slug_key: "Cette adresse est déjà utilisée par un autre projet.",
  donation_campaigns_slug_key: "Cette adresse est déjà utilisée par un autre appel aux dons.",
  action_areas_slug_key: "Cette adresse est déjà utilisée par un autre domaine.",
  article_categories_slug_key: "Cette adresse est déjà utilisée par une autre catégorie.",
  newsletter_subscribers_email_key: "Cette adresse email est déjà inscrite.",
  articles_published_cover_has_alt: "Ajoutez un texte alternatif à l'image avant de publier.",
  projects_published_cover_has_alt: "Ajoutez un texte alternatif à l'image avant de publier.",
  gallery_items_published_image_has_alt: "Ajoutez un texte alternatif à la photo avant de la publier.",
  donation_campaigns_active_cover_has_alt: "Ajoutez un texte alternatif à l'image avant d'activer l'appel aux dons.",
  gallery_items_video_url_allowed: "Seules les vidéos YouTube ou Facebook sont acceptées.",
  media_type_and_size_allowed: "Format ou taille de fichier non accepté (JPEG, PNG ou WebP, 5 Mo maximum).",
  contact_requests_reachable: "Indiquez au moins un email ou un numéro de téléphone.",
  donations_online_fields: "Indiquez au moins un email ou un numéro de téléphone.",
  donations_offline_reference_uidx: "Cette opération (même mode de réception et même référence) est déjà enregistrée.",
  donations_campaign_id_fkey: "Cet appel aux dons a déjà reçu des dons : désactivez-le plutôt que de le supprimer.",
  // Administration (Phase 3)
  action_areas_title_key: "Un domaine porte déjà ce nom.",
  article_categories_name_key: "Une catégorie porte déjà ce nom.",
  site_settings_hero_image_has_alt: "Ajoutez un texte alternatif à l'image de l'accueil.",
  site_settings_impact_image_has_alt: "Ajoutez un texte alternatif à l'image de la section impact.",
  site_settings_whatsapp_number_check: "Numéro WhatsApp invalide : indicatif et numéro, 8 à 15 chiffres.",
  projects_dates_order: "La date de fin doit être postérieure à la date de début.",
  donation_campaigns_dates_order: "La date de fin doit être postérieure à la date de début.",
  gallery_items_photo_fields: "Une photo de la galerie doit avoir une image de la médiathèque, sans adresse de vidéo.",
  gallery_items_video_fields: "Une vidéo de la galerie doit avoir son adresse YouTube ou Facebook.",
  partners_website_url_check: "L'adresse du site doit commencer par https:// ou http://.",
  media_bucket_path_key: "Ce fichier existe déjà dans la médiathèque.",
  profiles_email_key: "Un compte existe déjà avec cette adresse.",
  user_roles_user_id_key: "Ce compte a déjà un rôle : modifiez-le plutôt.",
};

function constraintFrom(error: DatabaseErrorLike): string | undefined {
  const text = `${error.message ?? ""} ${error.details ?? ""}`;
  return Object.keys(CONSTRAINT_MESSAGES).find((name) => text.includes(`"${name}"`));
}

/**
 * Traduit une erreur Supabase en erreur d'application.
 * Les messages levés par nos propres fonctions SQL (codes P0001, 22023,
 * 42501, 23505 avec message en français) sont déjà rédigés pour l'utilisateur.
 */
export function fromDatabaseError(error: DatabaseErrorLike): AppError {
  const constraint = constraintFrom(error);
  if (constraint) {
    const code: ErrorCode = error.code === "23503" || error.code === "23505" ? "CONFLICT" : "VALIDATION";
    return new AppError(code, CONSTRAINT_MESSAGES[constraint]);
  }

  // Les erreurs levées par nos fonctions SQL portent l'indice « ina-africa » :
  // leur message est rédigé pour l'utilisateur et peut être affiché tel quel.
  const raisedByUs = error.hint === APP_ERROR_HINT && Boolean(error.message);

  switch (error.code) {
    case "42501":
      return new AppError("FORBIDDEN", raisedByUs ? error.message! : "Vous n'avez pas les droits pour cette action.");
    case "PGRST116":
    case "P0002":
      return new AppError("NOT_FOUND", raisedByUs ? error.message! : "Élément introuvable.");
    case "23505":
      return new AppError("CONFLICT", raisedByUs ? error.message! : "Cet élément existe déjà.");
    case "23503":
      return new AppError("CONFLICT", "Cet élément est lié à d'autres données et ne peut pas être supprimé.");
    case "23502":
    case "23514":
    case "22023":
    case "22P02":
    case "P0001":
      return new AppError("VALIDATION", raisedByUs ? error.message! : "Certaines informations sont invalides.");
    default:
      return new AppError("INTERNAL", GENERIC_MESSAGE);
  }
}

/**
 * Exécute une action et transforme toute erreur en `ActionResult`.
 * Les erreurs inattendues sont journalisées côté serveur, jamais renvoyées.
 */
export async function runAction<T>(action: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return ok(await action());
  } catch (error) {
    if (error instanceof AppError) {
      return fail(error.code, error.message, error.fieldErrors);
    }
    console.error("[ina-africa] erreur inattendue", error);
    return fail("INTERNAL", GENERIC_MESSAGE);
  }
}
