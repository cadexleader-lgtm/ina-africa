import { z } from "zod";

import { siteOrigin } from "@/lib/site-url";

/**
 * Variables publiques (préfixe NEXT_PUBLIC_) : incluses dans le code envoyé
 * au navigateur. N'y mettre AUCUN secret.
 *
 * Elles sont lues une à une (`process.env.NEXT_PUBLIC_…`) pour que Next.js
 * puisse les intégrer au moment de la compilation.
 */
const publicEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(20),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;

let cached: PublicEnv | undefined;

/** Valide les variables publiques au premier usage (pas à l'import). */
export function getPublicEnv(): PublicEnv {
  if (!cached) {
    const parsed = publicEnvSchema.safeParse({
      // Jamais manquante : repli sur l'adresse Vercel puis localhost (src/lib/site-url.ts).
      NEXT_PUBLIC_SITE_URL: siteOrigin(),
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    });
    if (!parsed.success) {
      throw new Error(formatEnvError("publiques", parsed.error));
    }
    cached = parsed.data;
  }
  return cached;
}

/**
 * Vrai si Supabase est configuré. Tant que le projet n'existe pas, le site
 * se construit quand même et affiche ses états vides (jamais de faux contenu).
 */
export function hasPublicSupabaseEnv(): boolean {
  return publicEnvSchema
    .pick({ NEXT_PUBLIC_SUPABASE_URL: true, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: true })
    .safeParse({
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    }).success;
}

/**
 * Clé PUBLIQUE de Cloudflare Turnstile (anti-robot), facultative. Le
 * contrôle n'est appliqué que si cette clé ET la clé secrète
 * (TURNSTILE_SECRET_KEY, serveur) sont configurées.
 */
export function getTurnstileSiteKey(): string | null {
  const value = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
  return value && /^[A-Za-z0-9_-]{8,100}$/.test(value) ? value : null;
}

export function formatEnvError(kind: string, error: z.ZodError): string {
  const missing = error.issues.map((issue) => issue.path.join(".")).join(", ");
  return `Variables d'environnement ${kind} manquantes ou invalides : ${missing}. Voir .env.example.`;
}
