import type { Metadata } from "next";

import { AuthLayout } from "@/components/admin/AuthLayout";

export const metadata: Metadata = {
  title: { default: "Administration — INA-AFRICA", template: "%s — Administration INA-AFRICA" },
  robots: { index: false, follow: false },
  // Le lien reçu par email contient un jeton : jamais transmis aux sites liés.
  referrer: "same-origin",
};

/** Liens reçus par email (/auth/confirm) : même présentation que la connexion. */
export default function AuthRoutesLayout({ children }: { children: React.ReactNode }) {
  return <AuthLayout>{children}</AuthLayout>;
}
