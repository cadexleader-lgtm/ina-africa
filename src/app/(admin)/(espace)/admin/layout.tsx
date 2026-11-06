import { Suspense } from "react";

import { AdminShell, AdminUserBadge } from "@/components/admin/AdminShell";
import { getAdminSession } from "@/server/auth/guard";

async function CurrentUser() {
  const session = await getAdminSession();
  return <AdminUserBadge user={session} />;
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
    >
      {children}
    </AdminShell>
  );
}
