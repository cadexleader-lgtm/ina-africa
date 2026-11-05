import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getPublicEnv } from "@/lib/public-env";

/**
 * Client Supabase de l'ADMINISTRATION : agit avec la session (cookies) de la
 * personne connectée. Les règles RLS de la base s'appliquent donc à chaque
 * requête : c'est la barrière finale, même si une vérification de rôle était
 * oubliée dans le code.
 *
 * À appeler dans une Server Action, un Route Handler ou un composant serveur
 * placé sous une limite <Suspense> (Cache Components : la lecture des cookies
 * se fait au moment de la requête).
 */
export async function createSessionClient() {
  const env = getPublicEnv();
  const cookieStore = await cookies();

  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Appelé depuis un composant serveur : l'écriture de cookies y est
          // impossible. Le rafraîchissement de session est fait par le proxy
          // (Phase 2), cet échec est donc sans conséquence.
        }
      },
    },
  });
}
