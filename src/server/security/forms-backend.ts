import "server-only";

import { hasPublicSupabaseEnv } from "@/lib/public-env";
import { getServerEnv, type ServerEnv } from "@/server/env";
import { createPrivilegedClient } from "@/server/supabase/admin";

/**
 * Configuration nécessaire pour ENREGISTRER un formulaire public : projet
 * Supabase (adresse publique + clé secrète) et sel des empreintes
 * (IP_HASH_SECRET, qui signe aussi les horodatages).
 *
 * null = pas encore configuré : l'action répond honnêtement que le
 * formulaire n'est pas encore disponible, sans rien prétendre enregistrer.
 */
export type FormsBackend = {
  db: ReturnType<typeof createPrivilegedClient>;
  env: ServerEnv;
};

let warned = false;

/** Variables serveur, ou null si elles sont incomplètes (journalise les NOMS manquants, jamais les valeurs). */
export function readServerEnv(): ServerEnv | null {
  try {
    return getServerEnv();
  } catch (error) {
    if (!warned) {
      warned = true;
      console.warn("[ina-africa] formulaires publics inactifs :", error instanceof Error ? error.message : "configuration incomplète");
    }
    return null;
  }
}

export function getFormsBackend(): FormsBackend | null {
  if (!hasPublicSupabaseEnv()) return null;
  const env = readServerEnv();
  if (!env) return null;
  return { db: createPrivilegedClient(), env };
}

/**
 * Raison pour laquelle les formulaires sont inactifs (noms de variables
 * uniquement, jamais de valeur), ou null s'ils sont prêts. Sert au journal.
 */
export function formsConfigProblem(): string | null {
  if (!hasPublicSupabaseEnv()) return "variables publiques Supabase absentes à l'exécution";
  try {
    getServerEnv();
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : "configuration serveur incomplète";
  }
}

/** Secret de signature des horodatages, seulement si les formulaires peuvent être enregistrés. */
export function getFormSecret(): string | null {
  if (!hasPublicSupabaseEnv()) return null;
  return readServerEnv()?.IP_HASH_SECRET ?? null;
}
