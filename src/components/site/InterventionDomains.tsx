import { Check } from "lucide-react";

import { INTERVENTION_DOMAINS } from "@/content/fr/ina-africa";
import { cn } from "@/lib/cn";

/**
 * « Nos domaines d'intervention » : liste courte transmise par l'ONG
 * (20/11/2026), complémentaire des huit piliers présentés en cartes.
 */
export function InterventionDomains({
  id,
  className,
  headingLevel: Heading = "h3",
}: {
  id: string;
  className?: string;
  headingLevel?: "h2" | "h3";
}) {
  return (
    <section aria-labelledby={id} className={cn("rounded-panel border border-line bg-white p-6 shadow-card sm:p-8", className)}>
      <Heading id={id} className="text-h3">
        Nos domaines d&apos;intervention
      </Heading>
      <p className="mt-2 text-body text-muted">Les champs d&apos;action concrets de INA-AFRICA sur le terrain.</p>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {INTERVENTION_DOMAINS.map((domain) => (
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
