import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

type SectionHeadingProps = {
  /** Petit libellé au-dessus du titre (« Nos projets »), précédé d'un trait doré. */
  label?: string;
  title: ReactNode;
  /** Courte introduction (une ou deux phrases). */
  intro?: ReactNode;
  /** Niveau du titre (h2 par défaut ; h1 pour l'en-tête d'une page). */
  as?: "h1" | "h2" | "h3";
  /** id du titre, à passer à <Section labelledBy>. */
  id?: string;
  align?: "start" | "center";
  /** Lien ou bouton aligné à droite du titre (« Voir tout »), sous le titre sur téléphone. */
  action?: ReactNode;
  /** Sur fond sombre (Section tone="brand"). */
  inverse?: boolean;
  /** Sans marge sous l'en-tête (par défaut : 40 → 48 px avant le contenu). */
  flush?: boolean;
  className?: string;
};

const TITLE_SIZE = { h1: "text-h1", h2: "text-h2", h3: "text-h3" } as const;

/** Libellé de section seul (trait doré + texte bleu foncé, lisible). */
export function Eyebrow({ children, inverse = false, className }: { children: ReactNode; inverse?: boolean; className?: string }) {
  return (
    <p
      className={cn(
        "flex items-center gap-3 text-small font-semibold tracking-wide",
        inverse ? "text-white" : "text-brand",
        className,
      )}
    >
      <span aria-hidden="true" className="h-0.5 w-6 shrink-0 rounded-full bg-gold" />
      {children}
    </p>
  );
}

/** En-tête de section : libellé + titre + introduction (+ action éventuelle). */
export function SectionHeading({
  label,
  title,
  intro,
  as: Tag = "h2",
  id,
  align = "start",
  action,
  inverse = false,
  flush = false,
  className,
}: SectionHeadingProps) {
  const centered = align === "center";
  return (
    <div
      className={cn(
        "flex flex-col gap-6",
        !flush && "mb-10 md:mb-12",
        !centered && Boolean(action) && "md:flex-row md:items-end md:justify-between",
        centered && "items-center text-center",
        className,
      )}
    >
      <div className={cn("max-w-reading", centered && "mx-auto")}>
        {label && (
          <Eyebrow inverse={inverse} className={cn("mb-4", centered && "justify-center")}>
            {label}
          </Eyebrow>
        )}
        <Tag id={id} className={TITLE_SIZE[Tag]}>
          {title}
        </Tag>
        {intro && (
          <div className={cn("mt-4 text-lead", inverse ? "text-muted-inverse" : "text-muted")}>{intro}</div>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
