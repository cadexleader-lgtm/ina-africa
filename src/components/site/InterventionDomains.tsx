import { Check } from "lucide-react";

import { cn } from "@/lib/cn";
import type { ResolvedSection } from "@/lib/page-content/resolve";

/**
 * « Nos domaines d'intervention » : liste courte transmise par l'ONG
 * (20/11/2026), complémentaire des huit piliers présentés en cartes.
 * Textes : Pages du site → Domaines → « Nos domaines d'intervention ».
 */
export function InterventionDomains({
  s,
  id,
  className,
  headingLevel: Heading = "h3",
}: {
  s: ResolvedSection;
  id: string;
  className?: string;
  headingLevel?: "h2" | "h3";
}) {
  return (
    <section aria-labelledby={id} className={cn("rounded-panel border border-line bg-white p-6 shadow-card sm:p-8", className)}>
      <Heading id={id} className="text-h3">
        {s.line("title")}
      </Heading>
      <p className="mt-2 text-body text-muted">{s.text("intro")}</p>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {s.list("items").map((domain) => (
          <li key={domain} className="flex gap-3 rounded-card bg-ivory p-4">
            <span aria-hidden="true" className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-gold">
              <Check className="size-4 text-brand" strokeWidth={2.5} />
            </span>
            <span className="font-semibold text-brand">{domain}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
