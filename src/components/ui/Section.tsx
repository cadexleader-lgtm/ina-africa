import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/cn";

export type SectionTone = "white" | "ivory" | "brand";

type SectionProps = ComponentPropsWithoutRef<"section"> & {
  /** Fond : blanc (défaut), ivoire, ou bleu foncé (texte blanc). */
  tone?: SectionTone;
  /** Espacement vertical : 64 → 112 px (défaut), compact 48 → 72 px, ou aucun. */
  spacing?: "default" | "compact" | "none";
  /** id du titre de la section (SectionHeading `id`) : relie la section à son titre. */
  labelledBy?: string;
};

const TONES: Record<SectionTone, string> = {
  white: "bg-white bg-motif-dots",
  ivory: "bg-ivory bg-motif-ivory",
  brand: "bg-brand bg-motif-brand on-dark",
};

const SPACING = {
  default: "py-section",
  compact: "py-section-sm",
  none: "",
} as const;

/** Section de page : fond et rythme vertical du design system. */
export function Section({ tone = "white", spacing = "default", labelledBy, className, ...props }: SectionProps) {
  return (
    <section
      aria-labelledby={labelledBy}
      className={cn(TONES[tone], SPACING[spacing], className)}
      {...props}
    />
  );
}
