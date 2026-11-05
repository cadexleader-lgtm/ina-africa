import type { ComponentPropsWithoutRef, ElementType } from "react";

import { cn } from "@/lib/cn";

type ContainerProps<T extends ElementType> = {
  /** `site` = 1200 px (défaut), `reading` = 680 px (articles, textes longs). */
  size?: "site" | "reading";
  as?: T;
} & Omit<ComponentPropsWithoutRef<T>, "as">;

/**
 * Conteneur centré avec marges latérales fluides (20 → 40 px).
 * La largeur maximale s'applique au CONTENU (box-content) : 1200 px utiles.
 */
export function Container<T extends ElementType = "div">({ size = "site", as, className, ...props }: ContainerProps<T>) {
  const Tag: ElementType = as ?? "div";
  return (
    <Tag
      className={cn(
        "mx-auto box-content px-gutter",
        size === "site" ? "max-w-site" : "max-w-reading",
        className,
      )}
      {...props}
    />
  );
}
