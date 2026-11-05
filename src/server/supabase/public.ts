import "server-only";

import { createClient } from "@supabase/supabase-js";

import { getPublicEnv } from "@/lib/public-env";

/**
 * Client Supabase des PAGES PUBLIQUES : visiteur anonyme, sans session ni
 * cookies. Ne voit que ce que les règles RLS montrent aux visiteurs
 * (contenus publiés ou actifs). Utilisable dans les fonctions mises en cache.
 */
export function createPublicClient() {
  const env = getPublicEnv();
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
