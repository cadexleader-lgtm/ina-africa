import type { ReactNode } from "react";
import Link from "next/link";

import { Logo } from "@/components/site/Logo";
import { T } from "@/content/fr/site";

import { AUTH_TEXT } from "./auth-texts";

const SKIP_LINK =
  "fixed top-3 left-3 z-50 -translate-y-[calc(100%+1rem)] rounded-full bg-brand px-5 py-3 font-semibold text-white focus:translate-y-0";

/** Lien d'évitement commun aux pages de l'administration. */
export function SkipLink() {
  return (
    <a href="#contenu" className={SKIP_LINK}>
      {T.a11y.skipToContent}
    </a>
  );
}

/**
 * Mise en page des pages d'ACCÈS (connexion, double authentification, mot de
 * passe) : sobre, centrée, logo officiel, lien de retour au site.
 */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-ivory">
      <SkipLink />
      <header className="px-gutter pt-8 pb-4">
        <div className="mx-auto flex max-w-[30rem] items-center justify-between gap-4">
          <Logo link={false} size="sm" />
          <Link href="/" className="rounded-field text-small font-semibold text-link underline-offset-4 hover:text-link-strong hover:underline">
            {AUTH_TEXT.common.backToSite}
          </Link>
        </div>
      </header>
      <main id="contenu" tabIndex={-1} className="flex flex-1 justify-center px-gutter pt-4 pb-16 focus:outline-none">
        <div className="w-full max-w-[30rem]">{children}</div>
      </main>
    </div>
  );
}

type AuthCardProps = {
  title: ReactNode;
  intro?: ReactNode;
  children?: ReactNode;
  /** Liens sous le panneau (mot de passe oublié, retour…). */
  footer?: ReactNode;
};

/** Panneau blanc d'une page d'accès : titre (h1), introduction, contenu. */
export function AuthCard({ title, intro, children, footer }: AuthCardProps) {
  return (
    <>
      <section aria-labelledby="page-titre" className="rounded-panel border border-line bg-white p-6 shadow-card sm:p-8">
        <p className="mb-2 text-small font-semibold tracking-wide text-muted uppercase">{AUTH_TEXT.common.adminTitle}</p>
        <h1 id="page-titre" className="text-h3">
          {title}
        </h1>
        <span aria-hidden="true" className="mt-4 block h-1 w-12 rounded-full bg-gold" />
        {intro && <div className="mt-4 text-body text-ink">{intro}</div>}
        {children && <div className="mt-6 flex flex-col gap-5">{children}</div>}
      </section>
      {footer && <div className="mt-6 flex flex-col items-center gap-3 text-center text-small">{footer}</div>}
    </>
  );
}

/** Lien discret sous un panneau d'accès. */
export function AuthLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="rounded-field font-semibold text-link underline-offset-4 hover:text-link-strong hover:underline">
      {children}
    </Link>
  );
}
