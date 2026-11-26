import { Alert } from "@/components/ui/Alert";

/** La table page_sections n'est pas encore créée sur la base (migration à appliquer). */
export function MigrationMissing() {
  return (
    <Alert tone="warning" role="status">
      <p className="font-semibold">Les modifications de pages ne sont pas encore activées sur la base.</p>
      <p className="mt-1">
        Il faut d&apos;abord appliquer la migration <code>20261126100000_page_sections.sql</code> dans Supabase (SQL Editor). Le site
        affiche en attendant ses textes d&apos;origine.
      </p>
    </Alert>
  );
}
