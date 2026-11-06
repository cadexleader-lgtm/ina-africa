"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import {
  BookOpen,
  ChevronDown,
  ExternalLink,
  FileText,
  FolderKanban,
  HandCoins,
  HandHeart,
  Handshake,
  Images,
  Inbox,
  LayoutDashboard,
  Mail,
  Settings,
  ShieldCheck,
  Tags,
  Target,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/cn";
import type { AppRole } from "@/server/auth/roles";

import { adminNavFor, isActiveNavHref, type AdminNavIcon } from "./nav-items";

const ICONS: Record<AdminNavIcon, LucideIcon> = {
  dashboard: LayoutDashboard,
  articles: FileText,
  categories: Tags,
  projects: FolderKanban,
  areas: Target,
  gallery: Images,
  partners: Handshake,
  team: Users,
  campaigns: HandHeart,
  donations: HandCoins,
  requests: Inbox,
  newsletter: Mail,
  media: BookOpen,
  settings: Settings,
  accounts: UserCog,
};

const LINK =
  "flex min-h-11 items-center gap-3 rounded-field px-3 py-2 text-nav font-semibold text-brand " +
  "transition-colors duration-(--duration-fast) hover:bg-brand-50 [&_svg]:size-4.5 [&_svg]:shrink-0";
const ACTIVE = "bg-brand text-white hover:bg-brand-strong";

function NavList({ role, pathname, onNavigate }: { role: AppRole; pathname: string | null; onNavigate?: () => void }) {
  const groups = adminNavFor(role);
  return (
    <div className="flex flex-col gap-5">
      {groups.map((group, index) => (
        <div key={group.label ?? index} className="flex flex-col gap-1">
          {group.label && (
            <p className="px-3 text-small font-semibold text-muted" aria-hidden="true">
              {group.label}
            </p>
          )}
          <ul className="flex flex-col gap-0.5" aria-label={group.label ?? undefined}>
            {group.items.map((item) => {
              const Icon = ICONS[item.icon];
              const active = isActiveNavHref(item.href, pathname);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(LINK, active && ACTIVE)}
                    onClick={onNavigate}
                  >
                    <Icon aria-hidden="true" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      <ul className="flex flex-col gap-0.5 border-t border-line pt-4">
        <li>
          <Link
            href="/admin/securite/double-authentification"
            className={cn(LINK, "font-medium")}
            aria-current={isActiveNavHref("/admin/securite", pathname) ? "page" : undefined}
            onClick={onNavigate}
          >
            <ShieldCheck aria-hidden="true" />
            Double authentification
          </Link>
        </li>
        <li>
          <Link href="/" className={cn(LINK, "font-medium")} onClick={onNavigate}>
            <ExternalLink aria-hidden="true" />
            Voir le site
          </Link>
        </li>
      </ul>
    </div>
  );
}

/**
 * Menu de l'espace d'administration (selon le rôle, lu sur le serveur).
 *  - grand écran : colonne toujours visible ;
 *  - téléphone : bouton « Menu » (élément <details> natif : clavier, lecteurs
 *    d'écran et fonctionnement sans JavaScript), refermé après un clic.
 */
export function AdminNav({ role }: { role: AppRole }) {
  const pathname = usePathname();
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const close = () => {
    if (detailsRef.current) detailsRef.current.open = false;
  };

  return (
    <nav aria-label="Menu de l'administration">
      <details ref={detailsRef} className="group rounded-card border border-line bg-white lg:hidden">
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 rounded-card px-4 font-semibold text-brand [&::-webkit-details-marker]:hidden">
          Menu de l&apos;administration
          <ChevronDown aria-hidden="true" className="size-5 transition-transform duration-(--duration-fast) group-open:rotate-180" />
        </summary>
        <div className="border-t border-line p-3">
          <NavList role={role} pathname={pathname} onNavigate={close} />
        </div>
      </details>
      <div className="hidden lg:block">
        <NavList role={role} pathname={pathname} />
      </div>
    </nav>
  );
}
