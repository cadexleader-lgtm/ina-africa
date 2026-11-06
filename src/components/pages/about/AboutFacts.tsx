import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";

import { FOUNDING_YEAR, PAGES } from "@/content/fr/pages";
import { ORG } from "@/content/fr/site";

const T = PAGES.about;

/**
 * Fiche « En bref » de l'en-tête : uniquement des faits (nom officiel, année de
 * création, nombre de domaines publiés, siège s'il est renseigné).
 */
export function AboutFacts({ areaCount, address }: { areaCount: number; address: string | null }) {
  const rows: { term: string; value: ReactNode }[] = [
    { term: T.factName, value: ORG.fullName },
    { term: T.factFounded, value: String(FOUNDING_YEAR) },
  ];
  if (areaCount > 0) {
    rows.push({
      term: T.factAreas,
      value: (
        <Link
          href="/domaines"
          className="inline-flex items-center gap-1.5 font-semibold text-link underline-offset-4 hover:text-link-strong hover:underline"
        >
          {areaCount}
          <span className="sr-only"> {T.factAreas.toLowerCase()}</span>
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      ),
    });
  }
  if (address?.trim()) rows.push({ term: T.factAddress, value: address.trim() });

  return (
    <div className="rounded-card border border-line bg-white p-6 shadow-card sm:p-8">
      <p className="text-small font-semibold text-muted">{T.factsTitle}</p>
      <dl className="mt-4 divide-y divide-line">
        {rows.map((row) => (
          <div key={row.term} className="grid gap-1 py-3.5 first:pt-0 last:pb-0 sm:grid-cols-[9rem_1fr] sm:gap-4">
            <dt className="text-small font-semibold text-brand">{row.term}</dt>
            <dd className="text-body text-ink">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
