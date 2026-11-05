import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/cn";

type EmptyStateProps = {
  /** Icône lucide (ex. FolderOpen) : un seul pictogramme, sobre. */
  icon?: LucideIcon;
  title: ReactNode;
  description?: ReactNode;
  /** Action éventuelle (LinkButton). */
  action?: ReactNode;
  /** Niveau du titre (h3 par défaut, dans une section qui a déjà son h2). */
  headingLevel?: "h2" | "h3";
  /** Fond : ivoire (défaut, sur section blanche) ou blanc (sur section ivoire). */
  surface?: "ivory" | "white";
  className?: string;
};

/** État vide élégant : jamais de contenu fictif, un message honnête. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  headingLevel: Heading = "h3",
  surface = "ivory",
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-card border border-line px-5 py-12 text-center sm:px-10 sm:py-14",
        surface === "ivory" ? "bg-ivory" : "bg-white",
        className,
      )}
    >
      {Icon && (
        <span
          aria-hidden="true"
          className={cn(
            "mb-5 flex size-14 items-center justify-center rounded-full",
            surface === "ivory" ? "bg-white" : "bg-ivory",
          )}
        >
          <Icon className="size-6 text-brand-2" strokeWidth={1.75} />
        </span>
      )}
      <Heading className="text-h4">{title}</Heading>
      {description && <p className="mt-2 max-w-measure text-muted">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
