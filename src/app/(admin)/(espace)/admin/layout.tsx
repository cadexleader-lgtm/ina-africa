import { Suspense } from "react";

import { AdminShell, AdminUserBadge } from "@/components/admin/AdminShell";
import { AdminNav } from "@/components/admin/contenus/AdminNav";
import { getAdminSession } from "@/server/auth/guard";

async function CurrentUser() {
  const session = await getAdminSession();
  return <AdminUserBadge user={session} />;
}

/** Menu selon le rôle (lu sur le serveur ; le navigateur ne choisit rien). */
async function RoleNav() {
  const session = await getAdminSession();
  if (!session) return null;
  return <AdminNav role={session.role} />;
}

/**
 * Espace connecté de l'administration. Le layout NE PROTÈGE PAS les pages :
 * chaque page appelle requireAdminPage(rôle minimum) (et chaque Server Action
 * authorize()). La session n'est lue que sous <Suspense> (Cache Components).
 */
export default function AdminSpaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminShell
      user={
        <Suspense fallback={null}>
          <CurrentUser />
        </Suspense>
      }
      nav={
        <div className="lg:w-60 lg:shrink-0">
          <Suspense fallback={null}>
            <RoleNav />
          </Suspense>
        </div>
      }
    >
      {children}
    </AdminShell>
  );
}
