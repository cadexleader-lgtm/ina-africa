import Link from "next/link";
import { ArrowRight, FolderOpen, MapPin } from "lucide-react";

import { ResponsiveImage } from "@/components/ui/ResponsiveImage";
import { CARD, CARD_IMAGE, CARD_LINK, CARD_MORE } from "@/components/site/card-styles";
import { MediaTile } from "@/components/site/MediaTile";
import { T } from "@/content/fr/site";
import { cn } from "@/lib/cn";
import type { ProjectSummary } from "@/lib/types/content";

type ProjectCardProps = {
  project: ProjectSummary;
  /** `large` : projet mis en avant (photo au-dessus) ; `compact` : photo à gauche dès 640 px. */
  variant?: "large" | "compact";
  headingLevel?: "h2" | "h3";
  sizes?: string;
  /** Photo prioritaire (seulement si la carte est visible dès l'arrivée sur la page). */
  priority?: boolean;
  className?: string;
};

/**
 * Carte d'un projet publié → /projets/[slug]. Jamais de photo provisoire ici :
 * sans photo du projet, une tuile sobre s'affiche.
 */
export function ProjectCard({ project, variant = "large", headingLevel: Heading = "h3", sizes, priority, className }: ProjectCardProps) {
  const large = variant === "large";
  const status = project.status !== "archived" ? T.project.status[project.status] : null;

  return (
    <article className={cn(CARD, "flex-col", !large && "sm:flex-row", className)}>
      <div className={cn("relative shrink-0 overflow-hidden", large ? "aspect-[16/10]" : "aspect-[16/10] sm:aspect-auto sm:min-h-44 sm:w-2/5")}>
        {project.cover ? (
          <ResponsiveImage
            image={project.cover}
            fill
            priority={priority}
            sizes={sizes ?? (large ? "(min-width: 1024px) 680px, 100vw" : "(min-width: 1024px) 200px, (min-width: 640px) 40vw, 100vw")}
            imgClassName={CARD_IMAGE}
          />
        ) : (
          <MediaTile icon={FolderOpen} size={large ? "md" : "sm"} className="absolute inset-0" />
        )}
      </div>

      <div className={cn("flex flex-1 flex-col", large ? "p-6 md:p-8" : "p-5 sm:p-6")}>
        {(project.area || status) && (
          <p className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-small">
            {project.area && <span className="font-semibold text-brand">{project.area.title}</span>}
            {project.area && status && <span aria-hidden="true" className="size-1 rounded-full bg-line-strong" />}
            {status && <span className="text-muted">{status}</span>}
          </p>
        )}
        <Heading className={large ? "text-h3" : "text-h4"}>
          <Link href={`/projets/${project.slug}`} className={CARD_LINK}>
            {project.title}
          </Link>
        </Heading>
        {project.summary && (
          <p className={cn("mt-3 text-muted", large ? "line-clamp-3" : "line-clamp-2 text-small")}>{project.summary}</p>
        )}
        {project.location && (
          <p className="mt-3 flex items-center gap-1.5 text-small text-muted">
            <MapPin aria-hidden="true" className="size-4 shrink-0" />
            {project.location}
          </p>
        )}
        <span aria-hidden="true" className={CARD_MORE}>
          {T.actions.discoverProject}
          <ArrowRight className="size-4 transition-transform duration-(--duration-fast) group-hover:translate-x-0.5" />
        </span>
      </div>
    </article>
  );
}
