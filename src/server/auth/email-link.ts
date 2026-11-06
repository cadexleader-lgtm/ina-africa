/** Liens reçus par email acceptés par /auth/confirm : réinitialisation du mot de passe et invitation. */
export const EMAIL_LINK_TYPES = ["recovery", "invite"] as const;

export type EmailLinkType = (typeof EMAIL_LINK_TYPES)[number];

export function isEmailLinkType(value: unknown): value is EmailLinkType {
  return typeof value === "string" && (EMAIL_LINK_TYPES as readonly string[]).includes(value);
}
