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
import { listAdminActionAreas, listAdminPartners, listAdminTeamMembers } from "@/server/data/admin/content";

type RecordLink = { id: string; label: string; detail: string | null; hidden: boolean };
const RECORDS = {
  areas: { title: "Les domaines affichés ici", base: "/admin/domaines", add: "Ajouter un domaine" },
  team: { title: "Les membres affichés ici", base: "/admin/equipe", add: "Ajouter un membre" },
  partners: { title: "Les partenaires affichés ici", base: "/admin/partenaires", add: "Ajouter un partenaire" },
} as const;

export const instant = false;

export async function generateMetadata({ params }: PageProps<"/admin/pages/[page]">): Promise<Metadata> {
  const page = findPage((await params).page);
  return { title: page ? `Page « ${page.label} »` : "Page introuvable" };
}

export default async function EditSitePage({ params }: PageProps<"/admin/pages/[page]">) {
  await requireAdminPage("admin");
  const page = findPage((await params).page);
  if (!page) notFound();

  const kinds = new Set(page.sections.map((section) => section.records).filter(Boolean));
  const [areas, team, partners] = await Promise.all([
    kinds.has("areas") ? listAdminActionAreas().catch(() => []) : [],
    kinds.has("team") ? listAdminTeamMembers().catch(() => []) : [],
    kinds.has("partners") ? listAdminPartners().catch(() => []) : [],
  ]);
  const records: Record<keyof typeof RECORDS, RecordLink[]> = {
    areas: areas.map((item) => ({ id: item.id, label: item.title, detail: item.summary, hidden: !item.isActive })),
    team: team.map((item) => ({ id: item.id, label: item.fullName, detail: item.position, hidden: !item.isActive })),
    partners: partners.map((item) => ({ id: item.id, label: item.name, detail: null, hidden: !item.isActive })),
  };

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
          const kind = section.records;
          const list = kind ? (
            <div className="rounded-card border border-line bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-h4">{RECORDS[kind].title}</h3>
                <Link href={`${RECORDS[kind].base}/nouveau`} className="text-small font-semibold text-link underline underline-offset-4">
                  + {RECORDS[kind].add}
                </Link>
              </div>
              <ul className="mt-3 divide-y divide-line">
                {records[kind].map((item) => (
                  <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <span className="min-w-0">
                      <span className="block font-semibold text-ink">
                        {item.label}
                        {item.hidden && <span className="ml-2 text-small font-normal text-muted">(masqué sur le site)</span>}
                      </span>
                      {item.detail && <span className="line-clamp-1 text-small text-muted">{item.detail}</span>}
                    </span>
                    <Link
                      href={`${RECORDS[kind].base}/${item.id}`}
                      className="shrink-0 rounded-full border border-brand px-4 py-1.5 text-small font-semibold text-brand hover:bg-brand-50"
                    >
                      Modifier
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null;
          return (
            <div key={section.key} className="flex flex-col gap-4">
              <PageSectionEditor
                pageKey={page.key}
                pagePath={page.path}
                number={index + 1}
                section={section}
                stored={saved?.content ?? null}
                updated={saved ? `${formatDate(saved.updatedAt)}${saved.updatedByName ? ` par ${saved.updatedByName}` : ""}` : null}
              />
              {list}
            </div>
          );
        })}
    </div>
  );
}
