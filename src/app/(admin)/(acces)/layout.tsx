import { AuthLayout } from "@/components/admin/AuthLayout";

/** Pages d'accès à l'administration (connexion, double authentification, mot de passe). */
export default function AccessLayout({ children }: { children: React.ReactNode }) {
  return <AuthLayout>{children}</AuthLayout>;
}
