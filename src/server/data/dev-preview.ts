import "server-only";

/**
 * Vrai en `next dev` tant que Supabase n'est pas configuré : un bandeau
 * discret le signale. Le contenu affiché est alors le contenu officiel de
 * l'ONG (src/content/fr/ina-africa.ts), comme en production quand la base
 * ne répond pas.
 */
export function isDevPreview(): boolean {
  return (
    process.env.NODE_ENV === "development" &&
    !(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
  );
}
