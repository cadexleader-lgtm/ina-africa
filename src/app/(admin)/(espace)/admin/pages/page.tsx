import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";

import { MigrationMissing } from "@/components/admin/pages/MigrationMissing";
import { AdminPageHeader } from "@/components/admin/contenus/ui";
import { EDITABLE_PAGES } from "@/content/page-sections";
import { requireAdminPage } from "@/server/auth/guard";
import { countCustomizedSections } from "@/server/data/admin/page-sections";

export const instant = false;

export const metadata: Metadata = { title: "Pages du site" };

export default async function SitePagesPage() {
  await requireAdminPage("admin");
  const counts = await countCustomizedSections().catch(() => null);

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Pages du site"
        description="Chaque page du site, découpée en sections dans l'ordre où elles apparaissent. Ouvrez une page pour modifier ses textes et ses photos."
      />
      {counts === null && <MigrationMissing />}
      <ul className="grid gap-4 md:grid-cols-2">
        {EDITABLE_PAGES.map((page) => {
          const changed = counts?.[page.key] ?? 0;
          return (
            <li key={page.key} className="flex flex-col gap-3 rounded-card border border-line bg-white p-5 shadow-card">
              <div>
                <h2 className="text-h3">
                  <Link href={`/admin/pages/${page.key}`} className="hover:text-link-strong hover:underline hover:underline-offset-4">
                    {page.label}
                  </Link>
                </h2>
                <p className="mt-1 text-small text-muted">{page.description}</p>
              </div>
              <p className="text-small text-ink">
                {page.sections.length} sections
                {changed > 0 ? ` · ${changed} modifiée${changed > 1 ? "s" : ""}` : " · textes d'origine"}
              </p>
              <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-2">
                <Link
                  href={`/admin/pages/${page.key}`}
                  className="inline-flex items-center gap-1.5 font-semibold text-link underline-offset-4 hover:text-link-strong hover:underline"
                >
                  Modifier la page
                  <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
                <a
                  href={page.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-small font-semibold text-link underline-offset-4 hover:text-link-strong hover:underline"
                >
                  Voir sur le site
                  <ExternalLink aria-hidden="true" className="size-4" />
                  <span className="sr-only">(s&apos;ouvre dans un nouvel onglet)</span>
                </a>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="text-small text-muted">
        Les autres pages (accueil, domaines, projets, dons, contact…) arrivent une par une. En attendant, leurs contenus restent dans les
        menus habituels (Réglages du site, Projets, Domaines, Équipe…).
      </p>
    </div>
  );
}
