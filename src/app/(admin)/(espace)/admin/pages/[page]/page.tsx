import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { MigrationMissing } from "@/components/admin/pages/MigrationMissing";
import { PageSectionEditor } from "@/components/admin/pages/PageSectionEditor";
import { AdminPageHeader } from "@/components/admin/contenus/ui";
import { findPage } from "@/content/page-sections";
import { formatDate } from "@/lib/format";
import { requireAdminPage } from "@/server/auth/guard";
import { getAdminPageSections, type AdminStoredSection } from "@/server/data/admin/page-sections";

export const instant = false;

export async function generateMetadata({ params }: PageProps<"/admin/pages/[page]">): Promise<Metadata> {
  const page = findPage((await params).page);
  return { title: page ? `Page « ${page.label} »` : "Page introuvable" };
}

export default async function EditSitePage({ params }: PageProps<"/admin/pages/[page]">) {
  await requireAdminPage("admin");
  const page = findPage((await params).page);
  if (!page) notFound();

  let stored: Record<string, AdminStoredSection> | null = null;
  try {
    stored = await getAdminPageSections(page.key);
  } catch {
    stored = null;
  }

  return (
    <div className="flex flex-col gap-8">
      <AdminPageHeader
        back={{ href: "/admin/pages", label: "Pages du site" }}
        title={`Page « ${page.label} »`}
        description={
          <>
            Les sections sont dans le même ordre que sur le site. Chaque section s&apos;enregistre séparément ; un champ vidé reprend le
            texte d&apos;origine.{" "}
            <a href={page.path} target="_blank" rel="noopener noreferrer" className="font-semibold text-link underline underline-offset-4">
              Ouvrir la page sur le site
            </a>
          </>
        }
      />
      {stored === null && <MigrationMissing />}

      <nav aria-label="Sections de la page" className="rounded-card border border-line bg-white p-4">
        <ol className="grid gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
          {page.sections.map((section, index) => (
            <li key={section.key}>
              <a
                href={`#section-${section.key}`}
                className="inline-flex gap-2 font-semibold text-link underline-offset-4 hover:text-link-strong hover:underline"
              >
                <span className="tabular-nums text-muted">{index + 1}.</span>
                {section.title}
                {stored?.[section.key] ? <span className="sr-only"> (modifiée)</span> : null}
              </a>
              {stored?.[section.key] ? (
                <span aria-hidden="true" className="ml-2 rounded-full bg-gold-50 px-2 py-0.5 text-small font-semibold text-brand">
                  modifiée
                </span>
              ) : null}
            </li>
          ))}
        </ol>
      </nav>

      {stored !== null &&
        page.sections.map((section, index) => {
          const saved = stored[section.key];
          if (section.sharedWith) {
            const target = `/admin/pages/${section.sharedWith.page}#section-${section.sharedWith.section}`;
            return (
              <section key={section.key} id={`section-${section.key}`} className="scroll-mt-6 rounded-card border border-line bg-white p-5">
                <h2 className="text-h3">
                  {index + 1}. {section.title}
                </h2>
                <p className="mt-2 text-muted">
                  Cette section est partagée avec une autre page.{" "}
                  <Link href={target} className="font-semibold text-link underline underline-offset-4">
                    La modifier ici
                  </Link>
                </p>
              </section>
            );
          }
          return (
            <PageSectionEditor
              key={section.key}
              pageKey={page.key}
              pagePath={page.path}
              number={index + 1}
              section={section}
              stored={saved?.content ?? null}
              updated={saved ? `${formatDate(saved.updatedAt)}${saved.updatedByName ? ` par ${saved.updatedByName}` : ""}` : null}
            />
          );
        })}
    </div>
  );
}
