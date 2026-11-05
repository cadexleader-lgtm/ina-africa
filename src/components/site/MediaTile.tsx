import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/cn";

/**
 * Tuile sobre qui remplace une photo absente : fond teinté et UNE icône.
 * Décorative (aria-hidden) : le titre de la carte porte le sens.
 */
const CIRCLE = { sm: "size-11", md: "size-16", responsive: "size-11 sm:size-16" } as const;
const ICON = { sm: "size-5", md: "size-7", responsive: "size-5 sm:size-7" } as const;

export function MediaTile({
  icon: Icon,
  className,
  size = "md",
}: {
  icon: LucideIcon;
  className?: string;
  /** `responsive` : petite sur téléphone, normale dès 640 px. */
  size?: "sm" | "md" | "responsive";
}) {
  return (
    <div aria-hidden="true" className={cn("flex items-center justify-center bg-brand-50", className)}>
      <span className={cn("flex items-center justify-center rounded-full bg-white", CIRCLE[size])}>
        <Icon className={cn("text-brand-2", ICON[size])} strokeWidth={1.75} />
      </span>
    </div>
  );
}
