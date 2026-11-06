import "server-only";

import { z } from "zod";

import { createSessionClient } from "@/server/supabase/server";

/**
 * Chiffres du tableau de bord : fonction SQL admin_dashboard_stats()
 * (migration …100700_admin_dashboard.sql), appelée avec la session de la
 * personne connectée. Contenus pour toute l'équipe ; dons, demandes et
 * newsletter pour les admins seulement (la fonction ne les renvoie pas aux éditeurs).
 */

const count = z.coerce.number().int().nonnegative().catch(0);

const statsSchema = z.object({
  articles: z.object({ published: count, in_review: count, draft: count }),
  projects_published: count,
  donations: z
    .object({
      online: z.object({ count, amount: count }),
      offline: z.object({ count, amount: count }),
      total_amount: count,
    })
    .optional(),
  campaigns_active: count.optional(),
  requests_unread: z.object({ contact: count, volunteer: count, membership: count, sponsorship: count }).optional(),
  newsletter_subscribed: count.optional(),
});

export type DashboardStats = z.infer<typeof statsSchema>;

/** null : chiffres indisponibles (erreur journalisée côté serveur). */
export async function readDashboardStats(): Promise<DashboardStats | null> {
  const supabase = await createSessionClient();
  const { data, error } = await supabase.rpc("admin_dashboard_stats");
  if (error) {
    console.error("[ina-africa] chiffres du tableau de bord indisponibles", { code: error.code, message: error.message });
    return null;
  }
  const parsed = statsSchema.safeParse(data);
  if (!parsed.success) {
    console.error("[ina-africa] chiffres du tableau de bord : format inattendu");
    return null;
  }
  return parsed.data;
}
