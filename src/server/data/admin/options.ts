import "server-only";

import { check } from "@/server/admin/action";
import { adminReader } from "@/server/data/admin/reader";

/*
 * Listes de choix des formulaires de l'administration (ajout de l'interface,
 * agent D) : la liste des projets de src/server/data/admin/content.ts est
 * paginée (20 par page) ; un menu déroulant « Projet lié » a besoin de tous
 * les titres. Lecture seule, session de la personne (RLS).
 */

const MAX_OPTIONS = 500;

/** Tous les projets (publiés ou non) : identifiant et titre, par titre. */
export async function listAdminProjectOptions(): Promise<{ id: string; title: string }[]> {
  const { db } = await adminReader("editor");
  const rows = check(await db.from("projects").select("id, title").order("title").limit(MAX_OPTIONS)) as
    | { id: string; title: string }[]
    | null;
  return rows ?? [];
}
