import type { ReactNode } from "react";
import Link from "next/link";
import { ExternalLink, LayoutDashboard, ShieldCheck } from "lucide-react";

import { Logo } from "@/components/site/Logo";
import { ROLE_LABELS, type AppRole } from "@/server/auth/roles";

import { AUTH_TEXT } from "./auth-texts";
import { SkipLink } from "./AuthLayout";
import { SignOutButton } from "./SignOutButton";

const T = AUTH_TEXT.shell;

const NAV_LINK =
  "inline-flex min-h-11 items-center gap-2 rounded-field px-3 text-nav font-semibold text-brand hover:bg-brand-50 [&_svg]:size-4.5";

/** Personne connectée affichée dans l'en-tête. */
export type ShellUser = { fullName: string; email: string; role: AppRole };

/** Nom, rôle et bouton de déconnexion (lit la session : placé sous <Suspense> par le layout). */
export function AdminUserBadge({ user }: { user: ShellUser | null }) {
  if (!user) return null;
  return (
    <div className="flex flex-wrap items-center gap-3 sm:gap-4">
      <p className="flex flex-col text-right leading-tight">
        <span className="sr-only">{T.signedInAs} </span>
        <span className="font-semibold text-brand">{user.fullName}</span>
        <span className="text-small text-muted">{ROLE_LABELS[user.role]}</span>
      </p>
      <SignOutButton />
    </div>
  );
}

/**
 * Coquille de l'espace d'administration : en-tête (logo, nom, rôle,
 * déconnexion), menu (`nav`, colonne sur grand écran, bouton « Menu » sur
 * téléphone) et zone de contenu. Le contenu de chaque page est placé DANS
 * <main id="contenu"> (ne pas remettre de <main>).
 */
export function AdminShell({ user, nav, children }: { user: ReactNode; nav?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-ivory">
      <SkipLink />
      <header className="border-b border-line bg-white">
        <div className="mx-auto box-content flex max-w-site flex-wrap items-center justify-between gap-4 px-gutter py-3">
          <div className="flex items-center gap-3">
            <Logo link={false} size="sm" />
            <span className="border-l border-line pl-3 font-heading text-h4 text-brand">{AUTH_TEXT.common.adminTitle}</span>
          </div>
          {user}
        </div>
      </header>
      <div className="mx-auto box-content flex w-full max-w-site flex-1 flex-col gap-6 px-gutter py-6 lg:flex-row lg:gap-10 lg:py-10">
        {nav ?? <DefaultNav />}
        <main id="contenu" tabIndex={-1} className="min-w-0 flex-1 focus:outline-none">
          {children}
        </main>
      </div>
    </div>
  );
}

/** Menu minimal (avant la lecture du rôle). */
function DefaultNav() {
  return (
    <nav aria-label={T.mainNav} className="lg:w-60 lg:shrink-0">
      <ul className="flex flex-wrap gap-1 lg:flex-col">
        <li>
          <Link href="/admin" className={NAV_LINK}>
            <LayoutDashboard aria-hidden="true" />
            {T.dashboard}
          </Link>
        </li>
        <li>
          <Link href="/admin/securite/double-authentification" className={NAV_LINK}>
            <ShieldCheck aria-hidden="true" />
            {T.security}
          </Link>
        </li>
        <li>
          <Link href="/" className={NAV_LINK}>
            <ExternalLink aria-hidden="true" />
            {T.viewSite}
          </Link>
        </li>
      </ul>
    </nav>
  );
}
