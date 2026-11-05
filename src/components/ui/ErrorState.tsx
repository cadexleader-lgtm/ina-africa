import type { ReactNode } from "react";
import { TriangleAlert } from "lucide-react";

import { cn } from "@/lib/cn";

type ErrorStateProps = {
  title?: ReactNode;
  description?: ReactNode;
  /** Action : bouton « Réessayer » (error.tsx, composant client) ou lien de retour. */
  action?: ReactNode;
  headingLevel?: "h1" | "h2" | "h3";
  className?: string;
};

/**
 * État d'erreur : message humain, jamais de détail technique.
 * Dans un error.tsx (composant client), passer <Button onClick={reset}>Réessayer</Button> en `action`.
 */
export function ErrorState({
  title = "Ce contenu ne peut pas être affiché pour le moment",
  description = "Veuillez réessayer dans quelques instants.",
  action,
  headingLevel: Heading = "h2",
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center rounded-card border border-line bg-white px-6 py-12 text-center sm:px-10",
        className,
      )}
    >
      <span aria-hidden="true" className="mb-5 flex size-14 items-center justify-center rounded-full bg-gold-50">
        <TriangleAlert className="size-6 text-brand" strokeWidth={1.75} />
      </span>
      <Heading className="text-h4">{title}</Heading>
      {description && <p className="mt-2 max-w-measure text-muted">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
