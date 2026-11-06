import type { Metadata } from "next";

import { AuthCard } from "@/components/admin/AuthLayout";
import { AUTH_TEXT } from "@/components/admin/auth-texts";
import { LinkButton } from "@/components/ui/Button";

const T = AUTH_TEXT.forbidden;

export const metadata: Metadata = { title: T.metaTitle };

/** Page affichée par requireAdminPage() quand le rôle ne suffit pas. */
export default function ForbiddenPage() {
  return (
    <AuthCard title={T.title} intro={T.text}>
      <LinkButton href="/admin" fullWidth>
        {T.back}
      </LinkButton>
    </AuthCard>
  );
}
