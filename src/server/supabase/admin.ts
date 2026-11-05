import "server-only";

import { createClient } from "@supabase/supabase-js";

import { getPublicEnv } from "@/lib/public-env";
import { getServerEnv } from "@/server/env";

/**
 * Client Supabase PRIVILÉGIÉ (clé secrète) : CONTOURNE les règles RLS.
 *
 * Réservé à trois usages, toujours après validation (Zod) et contrôles :
 *  1. enregistrer les formulaires publics et les dons en ligne
 *     (après anti-robot et limite d'envois) ;
 *  2. confirmer un paiement APRÈS vérification auprès du prestataire ;
 *  3. gérer les comptes de l'administration (création, invitation).
 *
 * Ne jamais l'utiliser pour une action de l'administration qui peut passer
 * par createSessionClient() : là, ce sont les règles RLS qui protègent.
 */
export function createPrivilegedClient() {
  const publicEnv = getPublicEnv();
  const serverEnv = getServerEnv();
  return createClient(publicEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
