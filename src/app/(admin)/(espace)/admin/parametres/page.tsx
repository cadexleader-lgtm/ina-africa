import type { Metadata } from "next";
import Link from "next/link";

import { ContactSettings, DonationSettings, LegalSettings } from "@/components/admin/contenus/forms/SettingsForms";
import { AdminPageHeader } from "@/components/admin/contenus/ui";
import { Alert } from "@/components/ui/Alert";
import { formatDate } from "@/lib/format";
import { requireAdminPage } from "@/server/auth/guard";
import { getAdminSiteSettings } from "@/server/data/admin/settings";

export const instant = false;

export const metadata: Metadata = { title: "Paramètres du site" };

const SECTIONS = [
  { id: "coordonnees", label: "Coordonnées et réseaux" },
  { id: "dons", label: "Dons" },
  { id: "legal", label: "Pages légales" },
];

export default async function SettingsPage() {
  await requireAdminPage("admin");
  const settings = await getAdminSiteSettings();
  const updated = formatDate(settings.updatedAt);

  return (
    <div className="flex flex-col gap-8">
      <AdminPageHeader
        title="Paramètres du site"
        description={
          updated
            ? `Dernière modification le ${updated}${settings.updatedByName ? ` par ${settings.updatedByName}` : ""}. Chaque section s'enregistre séparément.`
            : "Chaque section s'enregistre séparément."
        }
      />
      <nav aria-label="Sections des paramètres" className="rounded-card border border-line bg-white p-4">
        <ul className="flex flex-wrap gap-x-5 gap-y-2">
          {SECTIONS.map((section) => (
            <li key={section.id}>
              <a href={`#${section.id}`} className="font-semibold text-link underline-offset-4 hover:text-link-strong hover:underline">
                {section.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <Alert tone="info" role="none">
        <p>
          Les textes et photos des pages (accueil, à propos, domaines, projets…) se modifient maintenant dans{" "}
          <Link href="/admin/pages" className="font-semibold text-link underline underline-offset-4">
            Pages du site
          </Link>
          , section par section.
        </p>
      </Alert>
      <ContactSettings settings={settings} />
      <DonationSettings settings={settings} />
      <LegalSettings settings={settings} />
    </div>
  );
}
