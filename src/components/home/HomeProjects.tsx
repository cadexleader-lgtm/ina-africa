import { ArrowRight, FolderOpen } from "lucide-react";

import { LinkButton } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ProjectCard } from "@/components/site/ProjectCard";
import { T } from "@/content/fr/site";
import type { ProjectSummary } from "@/lib/types/content";

/**
 * Projets publiés : 1 mis en avant + 2 compacts. Aucun projet → état vide
 * honnête (jamais de projet fictif).
 */
export function HomeProjects({ projects }: { projects: ProjectSummary[] }) {
  const [featured, ...others] = projects;

  return (
    <Section labelledBy="accueil-projets">
      <Container>
        <Reveal>
          <SectionHeading
            id="accueil-projets"
            label={T.home.projects.label}
            title={T.home.projects.title}
            action={
              projects.length > 0 && (
                <LinkButton href="/projets" variant="link" iconRight={<ArrowRight aria-hidden="true" />}>
                  {T.home.projects.all}
                </LinkButton>
              )
            }
          />
        </Reveal>

        {!featured && (
          <Reveal>
            <EmptyState
              icon={FolderOpen}
              title={T.home.projects.emptyTitle}
              description={T.home.projects.emptyText}
              action={
                <LinkButton href="/domaines" variant="secondary" iconRight={<ArrowRight aria-hidden="true" />}>
                  {T.home.projects.emptyAction}
                </LinkButton>
              }
            />
          </Reveal>
        )}

        {featured && others.length === 0 && (
          <Reveal className="max-w-4xl">
            <ProjectCard project={featured} variant="compact" />
          </Reveal>
        )}

        {featured && others.length > 0 && (
          <div className="grid gap-6 lg:grid-cols-12">
            <Reveal className="flex lg:col-span-7">
              <ProjectCard project={featured} className="w-full" />
            </Reveal>
            <div className="flex flex-col gap-6 lg:col-span-5">
              {others.map((project, index) => (
                <Reveal key={project.id} delay={(index + 1) * 80} className="flex flex-1">
                  <ProjectCard project={project} variant="compact" className="w-full" />
                </Reveal>
              ))}
            </div>
          </div>
        )}
      </Container>
    </Section>
  );
}
