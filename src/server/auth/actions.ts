"use server";

import { redirect } from "next/navigation";

import { hasPublicSupabaseEnv } from "@/lib/public-env";
import { absoluteUrl } from "@/lib/site-url";
import {
  adminRedirectTarget,
  factorIdField,
  firstFieldErrors,
  loginSchema,
  newPasswordSchema,
  passwordResetRequestSchema,
  safeAdminPath,
  totpCodeSchema,
  withSuite,
  type AuthFormState,
  type EnrollState,
} from "@/lib/validation/auth";
import { createSessionClient } from "@/server/supabase/server";

import { AUTH_TEXT } from "@/components/admin/auth-texts";

import { isEmailLinkType } from "./email-link";
import { AUTH_PATHS, nextAuthStep, readAuthState } from "./guard";

/*
 * Actions de CONNEXION à l'administration. Aucune n'utilise le client
 * privilégié : tout passe par la session de la personne (Supabase Auth + RLS).
 * Les messages ne disent jamais si un compte existe.
 */

const T = AUTH_TEXT;

const NEW_PASSWORD_PATH = "/admin/nouveau-mot-de-passe";

function errorState(message: string, extra: Partial<AuthFormState> = {}): AuthFormState {
  return { status: "error", message, respondedAt: Date.now(), ...extra };
}

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function logAuthError(context: string, error: { code?: string; status?: number; message?: string }) {
  // Jamais l'email ni le mot de passe dans les journaux.
  console.error(`[ina-africa] ${context}`, { code: error.code, status: error.status, message: error.message });
}

function isRateLimited(error: { code?: string; status?: number }): boolean {
  return error.status === 429 || error.code === "over_request_rate_limit" || error.code === "over_email_send_rate_limit";
}

// ---------------------------------------------------------------------------
// Connexion
// ---------------------------------------------------------------------------

export async function signInAction(_previous: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const suite = safeAdminPath(field(formData, "suite"));
  const parsed = loginSchema.safeParse({ email: field(formData, "email"), password: field(formData, "password") });
  const email = field(formData, "email").trim().slice(0, 254);
  if (!parsed.success) {
    return errorState(T.common.fixFields, { fieldErrors: firstFieldErrors(parsed.error), email });
  }
  if (!hasPublicSupabaseEnv()) return errorState(T.common.unconfigured, { email });

  const supabase = await createSessionClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    if (isRateLimited(error)) return errorState(T.login.rateLimited, { email });
    if (error.code !== "invalid_credentials") logAuthError("connexion refusée", error);
    return errorState(T.login.invalid, { email });
  }

  let step: string | null;
  try {
    const state = await readAuthState(supabase);
    if (state.kind === "no_role") {
      await supabase.auth.signOut({ scope: "local" });
      return errorState(T.login.noAccess, { email });
    }
    step = nextAuthStep(state, suite);
  } catch (readError) {
    console.error("[ina-africa] lecture du rôle après connexion impossible", readError);
    await supabase.auth.signOut({ scope: "local" });
    return errorState(T.common.unexpected, { email });
  }
  redirect(step ?? adminRedirectTarget(suite));
}

// ---------------------------------------------------------------------------
// Déconnexion
// ---------------------------------------------------------------------------

export async function signOutAction(): Promise<void> {
  if (hasPublicSupabaseEnv()) {
    const supabase = await createSessionClient();
    const { error } = await supabase.auth.signOut({ scope: "local" });
    if (error) logAuthError("déconnexion", error);
  }
  redirect(`${AUTH_PATHS.login}?deconnexion=1`);
}

// ---------------------------------------------------------------------------
// Double authentification : vérification à la connexion
// ---------------------------------------------------------------------------

export async function verifyTotpAction(_previous: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const suite = safeAdminPath(field(formData, "suite"));
  const parsed = totpCodeSchema.safeParse({ code: field(formData, "code") });
  if (!parsed.success) return errorState(T.common.fixFields, { fieldErrors: firstFieldErrors(parsed.error) });
  if (!hasPublicSupabaseEnv()) return errorState(T.common.unconfigured);

  const supabase = await createSessionClient();
  const state = await readAuthState(supabase);
  if (state.kind !== "signed_in") redirect(nextAuthStep(state, suite) ?? AUTH_PATHS.login);
  if (state.aal === "aal2") redirect(adminRedirectTarget(suite));
  if (!state.verifiedFactorId) redirect(nextAuthStep(state, suite) ?? adminRedirectTarget(suite));

  const result = await challengeAndVerify(supabase, state.verifiedFactorId, parsed.data.code);
  if (result) return result;
  redirect(adminRedirectTarget(suite));
}

type SessionClient = Awaited<ReturnType<typeof createSessionClient>>;

/** Challenge puis vérification d'un code TOTP. Renvoie un état d'erreur, ou null si le code est accepté. */
async function challengeAndVerify(supabase: SessionClient, factorId: string, code: string): Promise<AuthFormState | null> {
  const challenge = await supabase.auth.mfa.challenge({ factorId });
  if (challenge.error || !challenge.data) {
    if (challenge.error && isRateLimited(challenge.error)) return errorState(T.mfa.rateLimited);
    if (challenge.error) logAuthError("challenge TOTP", challenge.error);
    return errorState(T.common.unexpected);
  }
  const verify = await supabase.auth.mfa.verify({ factorId, challengeId: challenge.data.id, code });
  if (verify.error) {
    if (isRateLimited(verify.error)) return errorState(T.mfa.rateLimited);
    if (verify.error.code !== "mfa_verification_failed") logAuthError("vérification TOTP", verify.error);
    return errorState(T.mfa.invalidCode, { fieldErrors: { code: T.mfa.invalidCode } });
  }
  return null;
}

// ---------------------------------------------------------------------------
// Double authentification : activation
// ---------------------------------------------------------------------------

/** Ré-encode le QR code SVG renvoyé par Supabase pour un attribut src sûr. */
function qrCodeDataUrl(value: string): string | null {
  const prefix = "data:image/svg+xml;utf-8,";
  const svg = value.startsWith(prefix) ? value.slice(prefix.length) : value;
  if (!svg.trim().startsWith("<svg")) return null;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** Étape 1 : crée un facteur TOTP non vérifié et renvoie son QR code. */
export async function startTotpEnrollmentAction(_previous: EnrollState, formData: FormData): Promise<EnrollState> {
  const suite = safeAdminPath(field(formData, "suite"));
  if (!hasPublicSupabaseEnv()) return errorState(T.common.unconfigured);

  const supabase = await createSessionClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) redirect(withSuite(AUTH_PATHS.login, suite));

  const factors = userData.user.factors ?? [];
  if (factors.some((factor) => factor.factor_type === "totp" && factor.status === "verified")) {
    redirect(adminRedirectTarget(suite));
  }

  // Une activation précédente non terminée : on la remplace.
  for (const factor of factors) {
    if (factor.factor_type === "totp" && factor.status === "unverified") {
      const { error } = await supabase.auth.mfa.unenroll({ factorId: factor.id });
      if (error) logAuthError("suppression d'un facteur non vérifié", error);
    }
  }

  const stamp = new Date().toISOString().slice(0, 16).replace("T", " ");
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: "totp",
    friendlyName: `INA-AFRICA ${stamp}`,
    issuer: "INA-AFRICA",
  });
  if (error || !data) {
    if (error?.code === "mfa_totp_enroll_not_enabled") return errorState(T.mfa.notEnabled);
    if (error) logAuthError("activation TOTP", error);
    return errorState(T.common.unexpected);
  }
  const qrCode = qrCodeDataUrl(data.totp.qr_code);
  if (!qrCode) return errorState(T.common.unexpected);

  return { status: "success", factorId: data.id, qrCode, secret: data.totp.secret, respondedAt: Date.now() };
}

/** Étape 2 : vérifie un premier code ; la session passe en aal2. */
export async function confirmTotpEnrollmentAction(previous: EnrollState, formData: FormData): Promise<EnrollState> {
  const suite = safeAdminPath(field(formData, "suite"));
  const factorId = factorIdField.safeParse(field(formData, "factorId"));
  if (!factorId.success) return errorState(T.common.unexpected);

  // On garde le QR code affiché en cas d'erreur.
  const keep: Partial<EnrollState> = { factorId: factorId.data, qrCode: previous.qrCode, secret: previous.secret };

  const parsed = totpCodeSchema.safeParse({ code: field(formData, "code") });
  if (!parsed.success) return { ...errorState(T.common.fixFields, { fieldErrors: firstFieldErrors(parsed.error) }), ...keep };
  if (!hasPublicSupabaseEnv()) return errorState(T.common.unconfigured);

  const supabase = await createSessionClient();
  const result = await challengeAndVerify(supabase, factorId.data, parsed.data.code);
  if (result) return { ...result, ...keep };
  redirect(adminRedirectTarget(suite));
}

// ---------------------------------------------------------------------------
// Mot de passe oublié
// ---------------------------------------------------------------------------

export async function requestPasswordResetAction(_previous: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = field(formData, "email").trim().slice(0, 254);
  const parsed = passwordResetRequestSchema.safeParse({ email });
  if (!parsed.success) {
    return errorState(T.common.fixFields, { fieldErrors: firstFieldErrors(parsed.error), email });
  }
  if (!hasPublicSupabaseEnv()) return errorState(T.common.unconfigured, { email });

  const supabase = await createSessionClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: absoluteUrl("/auth/confirm"),
  });
  // Réponse identique qu'un compte existe ou non (aucune information ne fuit).
  if (error) logAuthError("demande de réinitialisation", error);
  return { status: "success", message: T.reset.sent, respondedAt: Date.now() };
}

// ---------------------------------------------------------------------------
// Lien reçu par email (réinitialisation, invitation)
// ---------------------------------------------------------------------------

/**
 * Valide le lien reçu par email : action déclenchée par un CLIC (et non à
 * l'ouverture de la page), car les filtres de messagerie ouvrent les liens et
 * consommeraient le jeton à usage unique.
 */
export async function confirmEmailLinkAction(_previous: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const tokenHash = field(formData, "token_hash").trim();
  const type = field(formData, "type");
  const code = field(formData, "code").trim();
  if (!hasPublicSupabaseEnv()) return errorState(T.common.unconfigured);

  const supabase = await createSessionClient();
  if (tokenHash) {
    // Modèle d'email recommandé : /auth/confirm?token_hash=…&type=recovery|invite
    if (!TOKEN_PATTERN.test(tokenHash) || !isEmailLinkType(type)) return errorState(T.link.invalid);
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (error) {
      if (error.code !== "otp_expired") logAuthError("lien reçu par email", error);
      return errorState(T.link.invalid);
    }
  } else if (code) {
    // Modèle d'email par défaut (flux PKCE) : /auth/confirm?code=… — même navigateur uniquement.
    if (!TOKEN_PATTERN.test(code)) return errorState(T.link.invalid);
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      logAuthError("lien reçu par email (code)", error);
      return errorState(T.link.invalid);
    }
  } else {
    return errorState(T.link.missing);
  }
  redirect(NEW_PASSWORD_PATH);
}

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{8,512}$/;

// ---------------------------------------------------------------------------
// Nouveau mot de passe
// ---------------------------------------------------------------------------

export async function updatePasswordAction(_previous: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = newPasswordSchema.safeParse({
    password: field(formData, "password"),
    confirmation: field(formData, "confirmation"),
  });
  if (!parsed.success) return errorState(T.common.fixFields, { fieldErrors: firstFieldErrors(parsed.error) });
  if (!hasPublicSupabaseEnv()) return errorState(T.common.unconfigured);

  const supabase = await createSessionClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return errorState(T.password.sessionMissing);

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    if (error.code === "insufficient_aal") redirect(withSuite(AUTH_PATHS.verify, NEW_PASSWORD_PATH));
    if (error.code === "same_password") return errorState(T.password.same, { fieldErrors: { password: T.password.same } });
    if (error.code === "weak_password") return errorState(T.password.weak, { fieldErrors: { password: T.password.weak } });
    if (isRateLimited(error)) return errorState(T.password.rateLimited);
    logAuthError("changement de mot de passe", error);
    return errorState(T.common.unexpected);
  }
  // La suite du parcours (vérification, activation, rôle) est faite par requireAdminPage.
  redirect("/admin?mot-de-passe=modifie");
}
