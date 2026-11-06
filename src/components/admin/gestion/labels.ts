/**
 * Libellés et petites fonctions PURES des écrans de gestion de
 * l'administration (dons, demandes, newsletter, comptes). Aucune dépendance
 * serveur : utilisables dans les composants serveur, client et les tests.
 */
import { MEDIA_RULES } from "@/lib/validation/admin/media";
import { formatFcfa } from "@/lib/money";

export { formatFcfa };

export type SearchParams = Record<string, string | string[] | undefined>;

export type Tone = "neutral" | "info" | "success" | "warning" | "danger";

// ---------------------------------------------------------------------------
// Dons
// ---------------------------------------------------------------------------

export type DonationChannel = "online" | "offline";
export type DonationStatus = "pending" | "paid" | "failed" | "cancelled" | "refunded";
export type TransactionStatus = "pending" | "succeeded" | "failed" | "cancelled" | "refunded";

export const CHANNEL_LABELS: Record<DonationChannel, string> = { online: "En ligne", offline: "Hors ligne" };

export const DONATION_STATUS: Record<DonationStatus, { label: string; tone: Tone }> = {
  pending: { label: "En attente", tone: "warning" },
  paid: { label: "Reçu", tone: "success" },
  failed: { label: "Échoué", tone: "danger" },
  cancelled: { label: "Annulé", tone: "neutral" },
  refunded: { label: "Remboursé", tone: "neutral" },
};

export const TRANSACTION_STATUS: Record<TransactionStatus, { label: string; tone: Tone }> = {
  pending: { label: "En attente", tone: "warning" },
  succeeded: { label: "Réussi", tone: "success" },
  failed: { label: "Échoué", tone: "danger" },
  cancelled: { label: "Abandonné", tone: "neutral" },
  refunded: { label: "Remboursé", tone: "neutral" },
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  mobile_money: "Mobile Money",
  bank_transfer: "Virement bancaire",
};

export const PROVIDER_LABELS: Record<string, string> = { kkiapay: "KKiaPay", cinetpay: "CinetPay" };

export function paymentMethodLabel(method: string | null): string | null {
  return method ? (PAYMENT_METHOD_LABELS[method] ?? method) : null;
}

/** Filtres de la liste des dons, lus dans l'adresse (?canal=…&statut=…&appel=…&page=…). */
export type DonationListFilters = {
  page: number;
  channel?: DonationChannel;
  status?: DonationStatus;
  campaignId?: string;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Première valeur d'un paramètre d'adresse. */
export function param(params: SearchParams, name: string): string | undefined {
  const value = params[name];
  const first = Array.isArray(value) ? value[0] : value;
  return first === undefined || first === "" ? undefined : first;
}

function oneOf<T extends string>(value: string | undefined, allowed: readonly T[]): T | undefined {
  return value !== undefined && (allowed as readonly string[]).includes(value) ? (value as T) : undefined;
}

export function pageParam(params: SearchParams): number {
  const page = Number(param(params, "page"));
  return Number.isInteger(page) && page >= 1 && page <= 100000 ? page : 1;
}

export function donationFiltersFromParams(params: SearchParams): DonationListFilters {
  const campaign = param(params, "appel");
  return {
    page: pageParam(params),
    channel: oneOf(param(params, "canal"), ["online", "offline"] as const),
    status: oneOf(param(params, "statut"), ["pending", "paid", "failed", "cancelled", "refunded"] as const),
    campaignId: campaign && UUID.test(campaign) ? campaign : undefined,
  };
}

/** Paramètres d'adresse conservés par la pagination (filtres valides seulement). */
export function donationFilterParams(filters: DonationListFilters): Record<string, string | undefined> {
  return { canal: filters.channel, statut: filters.status, appel: filters.campaignId };
}

export function hasActiveFilters(params: Record<string, string | undefined>): boolean {
  return Object.values(params).some(Boolean);
}

/** Un don hors ligne reçu (non annulé) peut être annulé ; jamais un don en ligne. */
export function canCancelDonation(donation: { channel: DonationChannel; status: DonationStatus }): boolean {
  return donation.channel === "offline" && donation.status === "paid";
}

/** Nom affiché du donateur dans l'administration (l'anonymat ne vaut que pour le site public). */
export function donorLabel(donation: { donorName: string | null; isAnonymous: boolean }): string {
  const name = donation.donorName?.trim();
  if (!name) return "Donateur non renseigné";
  return donation.isAnonymous ? `${name} (anonyme sur le site)` : name;
}

// ---------------------------------------------------------------------------
// Justificatifs (contrôle avant l'envoi, revérifié par le serveur)
// ---------------------------------------------------------------------------

export const PROOF_MAX_BYTES = MEDIA_RULES["private-documents"].maxBytes;
export const PROOF_TYPES = MEDIA_RULES["private-documents"].types;
export const PROOF_ACCEPT = ".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp";

const EXTENSION_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

/**
 * Type annoncé d'un fichier choisi : celui du navigateur s'il est accepté,
 * sinon déduit de l'extension (certains systèmes n'en donnent aucun).
 * Simple indication : le serveur relit le type RÉEL dans le fichier.
 */
export function declaredProofType(file: { name: string; type: string }): string | null {
  if ((PROOF_TYPES as readonly string[]).includes(file.type)) return file.type;
  const extension = /\.([a-z0-9]+)$/i.exec(file.name)?.[1]?.toLowerCase();
  return extension ? (EXTENSION_TYPES[extension] ?? null) : null;
}

/** Problème évident d'un fichier choisi (type annoncé, taille), ou null. Le serveur relit le type réel. */
export function proofFileProblem(file: { name: string; size: number; type: string }): string | null {
  if (file.size <= 0) return "Ce fichier est vide.";
  if (file.size > PROOF_MAX_BYTES) return `Ce fichier est trop lourd : ${PROOF_MAX_BYTES / 1024 / 1024} Mo au plus.`;
  if (!declaredProofType(file)) {
    return "Format non accepté : seuls les PDF et les images JPEG, PNG ou WebP sont acceptés.";
  }
  return null;
}

/** « 2,4 Mo », « 850 Ko ». */
export function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / 1024 / 1024).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} Mo`;
  }
  return `${Math.max(1, Math.round(bytes / 1024)).toLocaleString("fr-FR")} Ko`;
}

// ---------------------------------------------------------------------------
// Demandes
// ---------------------------------------------------------------------------

export type RequestType = "contact" | "volunteer" | "membership" | "sponsorship";
export type RequestStatus = "unread" | "read" | "processed" | "archived";

export const REQUEST_TYPE_LABELS: Record<RequestType, string> = {
  contact: "Contact",
  volunteer: "Bénévolat",
  membership: "Adhésion",
  sponsorship: "Partenariat",
};

export const REQUEST_STATUS: Record<RequestStatus, { label: string; tone: Tone }> = {
  unread: { label: "Non lue", tone: "info" },
  read: { label: "Lue", tone: "neutral" },
  processed: { label: "Traitée", tone: "success" },
  archived: { label: "Archivée", tone: "neutral" },
};

/** Informations complémentaires envoyées avec certains formulaires (src/server/actions/requests.ts). */
const DETAIL_LABELS: Record<string, string> = {
  profession: "Profession ou études",
  skills: "Compétences",
  city: "Ville de résidence",
  kind: "Type de collaboration",
};

const DETAIL_VALUES: Record<string, Record<string, string>> = {
  kind: { partnership: "Partenariat", sponsorship: "Sponsoring" },
};

/** Détails lisibles d'une demande (clés connues traduites, valeurs vides ignorées). */
export function requestDetails(details: Record<string, unknown>): { label: string; value: string }[] {
  return Object.entries(details)
    .filter(([, value]) => typeof value === "string" || typeof value === "number")
    .map(([key, value]) => {
      const text = String(value).trim();
      return { label: DETAIL_LABELS[key] ?? key, value: DETAIL_VALUES[key]?.[text] ?? text };
    })
    .filter((entry) => entry.value !== "");
}

export type RequestListFilters = { page: number; type?: RequestType; status?: RequestStatus };

export function requestFiltersFromParams(params: SearchParams): RequestListFilters {
  return {
    page: pageParam(params),
    type: oneOf(param(params, "type"), ["contact", "volunteer", "membership", "sponsorship"] as const),
    status: oneOf(param(params, "statut"), ["unread", "read", "processed", "archived"] as const),
  };
}

/** Lien « mailto: » sûr (adresse simple seulement), ou null. */
export function mailtoHref(email: string | null, subject?: string | null): string | null {
  if (!email || !/^[^\s@<>()"',;:]+@[^\s@<>()"',;:]+\.[^\s@<>()"',;:]+$/.test(email)) return null;
  const query = subject ? `?subject=${encodeURIComponent(subject)}` : "";
  return `mailto:${email}${query}`;
}

/** Lien « tel: » (chiffres et + initial seulement), ou null. */
export function telHref(phone: string | null): string | null {
  if (!phone) return null;
  const compact = phone.replace(/[\s.\-()]/g, "");
  return /^\+?\d{6,15}$/.test(compact) ? `tel:${compact}` : null;
}

// ---------------------------------------------------------------------------
// Newsletter
// ---------------------------------------------------------------------------

export type SubscriberStatus = "pending" | "subscribed" | "unsubscribed";

export const SUBSCRIBER_STATUS: Record<SubscriberStatus, { label: string; tone: Tone }> = {
  pending: { label: "En attente de confirmation", tone: "warning" },
  subscribed: { label: "Confirmé", tone: "success" },
  unsubscribed: { label: "Désinscrit", tone: "neutral" },
};

export function subscriberFiltersFromParams(params: SearchParams): { page: number; status?: SubscriberStatus } {
  return {
    page: pageParam(params),
    status: oneOf(param(params, "statut"), ["pending", "subscribed", "unsubscribed"] as const),
  };
}

// ---------------------------------------------------------------------------
// Dates et nombres
// ---------------------------------------------------------------------------

const TIME_ZONE = "Africa/Porto-Novo";

const DATE_TIME = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: TIME_ZONE,
});

const SHORT_DATE = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric", timeZone: TIME_ZONE });

/** « 6 nov. 2026, 14:05 » (heure du Bénin). */
export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : DATE_TIME.format(date);
}

/** « 6 nov. 2026 » ; une date seule (AAAA-MM-JJ) est lue telle quelle, sans décalage horaire. */
export function formatShortDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00Z`) : new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : SHORT_DATE.format(date);
}

const NUMBER = new Intl.NumberFormat("fr-FR");

export function formatCount(count: number): string {
  return NUMBER.format(count);
}

/** « 1 don », « 12 dons ». */
export function plural(count: number, one: string, many: string): string {
  return `${NUMBER.format(count)} ${count > 1 ? many : one}`;
}


/** Ajoute « nom=1 » à une adresse (message de confirmation après une redirection). */
export function withFlag(href: string, name: string): string {
  return `${href}${href.includes("?") ? "&" : "?"}${name}=1`;
}
