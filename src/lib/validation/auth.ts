import { z } from "zod";

/**
 * Validation des formulaires de CONNEXION à l'administration et du paramètre
 * de redirection `suite`. Partagé navigateur / serveur (et proxy) ; la seule
 * validation qui compte est celle du serveur (src/server/auth/actions.ts).
 */

// ---------------------------------------------------------------------------
// Redirection interne (paramètre `suite`)
// ---------------------------------------------------------------------------

/** Page d'arrivée par défaut après la connexion. */
export const ADMIN_HOME = "/admin";

/** Pages de l'administration accessibles SANS être connecté. */
export const ADMIN_LOGIN_PATH = "/admin/connexion";
export const PUBLIC_ADMIN_PATHS = [ADMIN_LOGIN_PATH, "/admin/mot-de-passe-oublie", "/admin/nouveau-mot-de-passe"] as const;

const MAX_REDIRECT_LENGTH = 500;
const SAFE_ORIGIN = "http://ina-africa.invalid";

/**
 * Renvoie un chemin INTERNE de l'administration sûr pour une redirection, ou
 * `null`. Protège contre les redirections ouvertes :
 *  - chemin commençant par `/admin` (puis rien, `/`, `?` ou `#`) ;
 *  - pas de `//`, pas de `\`, pas de schéma (`https:`, `javascript:`…),
 *    pas de caractère de contrôle, pas de segment `..` (même encodé) ;
 *  - le résultat est l'adresse normalisée (chemin + paramètres + ancre).
 */
export function safeAdminPath(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const raw = value.trim();
  if (!raw || raw.length > MAX_REDIRECT_LENGTH) return null;
  if (!raw.startsWith("/") || raw.startsWith("//")) return null;
  // Contrôles, espaces et barres obliques inversées (certains navigateurs les lisent comme « / »).
  if (/[\u0000- \u007f\\]/.test(raw)) return null;
  // Segments « .. » ou « / » encodés : jamais utiles ici, souvent un contournement.
  if (/%(2e|2f|5c)/i.test(raw) || /(^|\/)\.\.?(\/|$|\?|#)/.test(raw)) return null;

  let url: URL;
  try {
    url = new URL(raw, SAFE_ORIGIN);
  } catch {
    return null;
  }
  if (url.origin !== SAFE_ORIGIN) return null;
  if (url.pathname !== ADMIN_HOME && !url.pathname.startsWith(`${ADMIN_HOME}/`)) return null;
  // Jamais renvoyer vers la page de connexion elle-même (boucle).
  if (url.pathname === ADMIN_LOGIN_PATH) return null;

  return `${url.pathname}${url.search}${url.hash}`;
}

/** Chemin de redirection sûr, ou la page d'accueil de l'administration. */
export function adminRedirectTarget(value: unknown): string {
  return safeAdminPath(value) ?? ADMIN_HOME;
}

/** Ajoute `?suite=<chemin>` à une adresse de l'administration (si `suite` est sûr et utile). */
export function withSuite(path: string, suite: unknown): string {
  const safe = safeAdminPath(suite);
  if (!safe || safe === ADMIN_HOME) return path;
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}suite=${encodeURIComponent(safe)}`;
}

/** Vrai si le chemin est une page de l'administration accessible sans être connecté. */
export function isPublicAdminPath(pathname: string): boolean {
  return PUBLIC_ADMIN_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

// ---------------------------------------------------------------------------
// Formulaires
// ---------------------------------------------------------------------------

export const PASSWORD_RULES = {
  /** Longueur minimale d'un nouveau mot de passe. */
  min: 12,
  /** Supabase Auth (bcrypt) ne tient compte que des 72 premiers octets. */
  maxBytes: 72,
} as const;

export const AUTH_MESSAGES = {
  emailEmpty: "Indiquez votre adresse email.",
  emailInvalid: "Cette adresse email n'est pas valide.",
  passwordEmpty: "Indiquez votre mot de passe.",
  passwordShort: `Le mot de passe doit contenir au moins ${PASSWORD_RULES.min} caractères.`,
  passwordLong: `Le mot de passe est trop long (${PASSWORD_RULES.maxBytes} octets au maximum, soit environ 70 caractères).`,
  passwordWeak: "Le mot de passe ne doit pas être une répétition d'un même caractère.",
  passwordMismatch: "Les deux mots de passe ne sont pas identiques.",
  codeEmpty: "Indiquez le code à 6 chiffres affiché par votre application.",
  codeInvalid: "Le code doit contenir exactement 6 chiffres.",
} as const;

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/** Email : espaces retirés, minuscules. */
const emailField = z.preprocess(
  (value) => asString(value).trim().toLowerCase(),
  z
    .string()
    .min(1, AUTH_MESSAGES.emailEmpty)
    .max(254, AUTH_MESSAGES.emailInvalid)
    .pipe(z.email({ error: AUTH_MESSAGES.emailInvalid })),
);

function byteLength(value: string): number {
  return new TextEncoder().encode(value).length;
}

/** Connexion : le mot de passe n'est JAMAIS modifié (pas de trim). */
export const loginSchema = z.object({
  email: emailField,
  password: z.preprocess(
    asString,
    z.string().min(1, AUTH_MESSAGES.passwordEmpty).refine((value) => byteLength(value) <= 1024, AUTH_MESSAGES.passwordLong),
  ),
});

/** Demande de réinitialisation du mot de passe. */
export const passwordResetRequestSchema = z.object({ email: emailField });

/** Code TOTP : 6 chiffres (espaces et tirets saisis par confort retirés). */
export const totpCodeField = z.preprocess(
  (value) => asString(value).replace(/[\s-]/g, ""),
  z.string().min(1, AUTH_MESSAGES.codeEmpty).regex(/^\d{6}$/, AUTH_MESSAGES.codeInvalid),
);

export const totpCodeSchema = z.object({ code: totpCodeField });

/** Identifiant d'un facteur (UUID renvoyé par Supabase). */
export const factorIdField = z.uuid();

/** Nouveau mot de passe : au moins 12 caractères, 72 octets au plus, confirmation identique. */
export const newPasswordSchema = z
  .object({
    password: z.preprocess(
      asString,
      z
        .string()
        .min(1, AUTH_MESSAGES.passwordEmpty)
        .refine((value) => [...value].length >= PASSWORD_RULES.min, AUTH_MESSAGES.passwordShort)
        .refine((value) => byteLength(value) <= PASSWORD_RULES.maxBytes, AUTH_MESSAGES.passwordLong)
        .refine((value) => new Set(value).size > 1, AUTH_MESSAGES.passwordWeak),
    ),
    confirmation: z.preprocess(asString, z.string()),
  })
  .refine((value) => value.password === value.confirmation, {
    path: ["confirmation"],
    message: AUTH_MESSAGES.passwordMismatch,
  });

// ---------------------------------------------------------------------------
// État des formulaires (useActionState)
// ---------------------------------------------------------------------------

export type AuthFormState = {
  status: "idle" | "error" | "success";
  message?: string;
  /** Premier message d'erreur de chaque champ. */
  fieldErrors?: Record<string, string>;
  /** Email saisi, renvoyé pour ne pas le perdre (jamais le mot de passe). */
  email?: string;
  respondedAt?: number;
};

export const INITIAL_AUTH_STATE: AuthFormState = { status: "idle" };

/** État du formulaire d'activation de la double authentification. */
export type EnrollState = AuthFormState & {
  /** Facteur en cours d'activation (non vérifié). */
  factorId?: string;
  /** QR code (image SVG en adresse data:) renvoyé par Supabase. */
  qrCode?: string;
  /** Clé à saisir à la main si le QR code ne peut pas être lu. */
  secret?: string;
};

export const INITIAL_ENROLL_STATE: EnrollState = { status: "idle" };

/** Premier message d'erreur de chaque champ d'une validation Zod. */
export function firstFieldErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!(key in errors)) errors[key] = issue.message;
  }
  return errors;
}
