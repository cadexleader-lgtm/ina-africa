"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { Heart, Menu, X } from "lucide-react";

import { LinkButton } from "@/components/ui/Button";
import { useModalDialog } from "@/components/ui/Modal";
import { Logo } from "@/components/site/Logo";
import { NavLinks } from "@/components/site/NavLinks";
import { ENGAGE_NAV, T, type NavItem } from "@/content/fr/site";

type MobileMenuProps = {
  items: NavItem[];
  donate: NavItem;
  /** Adresse courante (lien actif) ; null dans le rendu de secours. */
  pathname?: string | null;
};

/** Largeur à partir de laquelle la navigation complète est dans l'en-tête (Tailwind `xl`). */
const DESKTOP_QUERY = "(min-width: 80rem)";

/**
 * Menu des écrans < 1280 px : bouton (aria-expanded) qui ouvre un panneau
 * modal (<dialog> natif : focus gardé dans le panneau, Échap ferme, retour du
 * focus sur le bouton). Se ferme au clic sur un lien ou si l'écran s'élargit.
 * Sans JavaScript, la navigation reste disponible dans le pied de page.
 */
export function MobileMenu({ items, donate, pathname = null }: MobileMenuProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const titleId = useId();
  const close = () => setOpen(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const handlers = useModalDialog(dialogRef, open, close);

  useEffect(() => {
    if (!open) return;
    const query = window.matchMedia(DESKTOP_QUERY);
    const onChange = (event: MediaQueryListEvent) => {
      if (event.matches) setOpen(false);
    };
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
        className="inline-flex size-11 items-center justify-center rounded-full text-brand transition-colors duration-(--duration-fast) hover:bg-brand-50"
      >
        <Menu aria-hidden="true" className="size-6" />
        <span className="sr-only">{T.a11y.openMenu}</span>
      </button>

      <dialog
        id={panelId}
        ref={dialogRef}
        aria-labelledby={titleId}
        {...handlers}
        className="m-0 ml-auto h-dvh max-h-none w-full max-w-none bg-transparent sm:max-w-sm p-0 open:motion-safe:animate-[sheet-in_var(--duration-base)_var(--ease-out)]"
      >
        <div className="flex h-full flex-col bg-white shadow-overlay">
          <div className="flex h-header shrink-0 items-center justify-between border-b border-line px-gutter">
            <h2 id={titleId} className="sr-only">
              {T.a11y.menuTitle}
            </h2>
            <Logo size="sm" link={false} />
            <button
              type="button"
              onClick={close}
              className="-mr-2 inline-flex size-11 items-center justify-center rounded-full text-brand transition-colors duration-(--duration-fast) hover:bg-brand-50"
            >
              <X aria-hidden="true" className="size-6" />
              <span className="sr-only">{T.a11y.closeMenu}</span>
            </button>
          </div>
          <nav aria-label={T.a11y.mainNav} className="min-h-0 flex-1 overflow-y-auto px-gutter py-2">
            <NavLinks items={items} pathname={pathname} layout="panel" onNavigate={close} />
            <p className="mt-6 mb-2 text-small font-semibold text-muted">Agir avec nous</p>
            <ul className="grid gap-2 pb-4">
              {ENGAGE_NAV.filter((item) => item.href !== donate.href).map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={close}
                    className="block rounded-card border border-line px-4 py-3 transition-colors duration-(--duration-fast) hover:bg-ivory"
                  >
                    <span className="block font-semibold text-brand">{item.label}</span>
                    <span className="block text-small text-muted">{item.description}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="shrink-0 border-t border-line bg-ivory px-gutter py-5">
            <LinkButton href={donate.href} variant="donate" size="lg" fullWidth onClick={close} iconLeft={<Heart aria-hidden="true" />}>
              {donate.label}
            </LinkButton>
          </div>
        </div>
      </dialog>
    </>
  );
}

/** Menu mobile avec le lien actif (lit l'adresse : à placer sous <Suspense>, secours = <MobileMenu />). */
export function MobileMenuWithPath(props: Omit<MobileMenuProps, "pathname">) {
  const pathname = usePathname();
  return <MobileMenu {...props} pathname={pathname} />;
}
