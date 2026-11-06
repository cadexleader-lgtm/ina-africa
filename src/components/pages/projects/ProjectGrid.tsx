import { Reveal } from "@/components/ui/Reveal";
import { ProjectCard } from "@/components/site/ProjectCard";
import { cn } from "@/lib/cn";
import type { ProjectSummary } from "@/lib/types/content";

/** Grille de cartes projet (2 colonnes dès 640 px, 3 dès 1024 px). */
export function ProjectGrid({
  projects,
  headingLevel = "h3",
  className,
}: {
  projects: ProjectSummary[];
  headingLevel?: "h2" | "h3";
  className?: string;
}) {
  return (
    <ul className={cn("grid gap-6 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {projects.map((project, index) => (
        <li key={project.id} className="flex">
          <Reveal delay={(index % 3) * 70} className="flex w-full">
            <ProjectCard
              project={project}
              headingLevel={headingLevel}
              className="w-full"
              sizes="(min-width: 1280px) 384px, (min-width: 1024px) 31vw, (min-width: 640px) 47vw, 100vw"
            />
          </Reveal>
        </li>
      ))}
    </ul>
  );
}
