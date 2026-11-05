import "server-only";

import { z } from "zod";

import { formatEnvError } from "@/lib/public-env";

/**
 * Variables SECRÈTES, lues uniquement côté serveur. L'import de "server-only"
 * fait échouer la compilation si ce fichier est importé dans du code envoyé
 * au navigateur.
 *
 * Les services qui ne sont pas encore branchés (anti-robot, emails,
 * paiement) sont facultatifs : le code qui en a besoin vérifie leur présence
 * et refuse proprement de fonctionner sans eux.
 */
const optionalSecret = z
  .string()
  .trim()
  .min(1)
  .optional()
  .or(z.literal("").transform(() => undefined));

const serverEnvSchema = z.object({
  // Clé secrète Supabase (sb_secret_… ou ancienne clé service_role).
  // Contourne les règles RLS : n'est utilisée que par src/server/supabase/admin.ts.
  SUPABASE_SECRET_KEY: z.string().min(20),

  // Sel secret pour les empreintes d'adresse IP (anti-abus, jamais l'IP en clair).
  IP_HASH_SECRET: z.string().min(32),

  // Adresses qui reçoivent les formulaires (séparées par des virgules).
  NOTIFICATION_EMAILS: z
    .string()
    .optional()
    .transform((value) =>
      (value ?? "")
        .split(",")
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean),
    )
    .pipe(z.array(z.email())),

  // Services branchés plus tard
  TURNSTILE_SECRET_KEY: optionalSecret,
  RESEND_API_KEY: optionalSecret,
  KKIAPAY_PRIVATE_KEY: optionalSecret,
  KKIAPAY_SECRET: optionalSecret,
  CINETPAY_API_KEY: optionalSecret,
  CINETPAY_SITE_ID: optionalSecret,
  CINETPAY_SECRET_KEY: optionalSecret,
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cached: ServerEnv | undefined;

/** Valide les variables serveur au premier usage (pas à l'import, pour ne pas casser la compilation). */
export function getServerEnv(): ServerEnv {
  if (!cached) {
    const parsed = serverEnvSchema.safeParse(process.env);
    if (!parsed.success) {
      throw new Error(formatEnvError("serveur", parsed.error));
    }
    cached = parsed.data;
  }
  return cached;
}
