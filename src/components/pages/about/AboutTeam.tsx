import { Container } from "@/components/ui/Container";
import { ResponsiveImage } from "@/components/ui/ResponsiveImage";
import { Reveal } from "@/components/ui/Reveal";
import { Section, type SectionTone } from "@/components/ui/Section";
import { Eyebrow } from "@/components/ui/SectionHeading";
import { initials } from "@/components/pages/page-helpers";
import { PAGES } from "@/content/fr/pages";
import { cn } from "@/lib/cn";
import { TEAM_GROUPS } from "@/lib/team";
import type { TeamMember } from "@/lib/types/content";

const T = PAGES.about.team;

/**
 * Équipe publiée par l'administration, regroupée par instance de l'ONG
 * (conseil d'administration, conseil de surveillance, adjoints).
 * Section absente s'il n'y a personne ; une instance vide n'est pas affichée.
 * Sans photo, les initiales remplacent le portrait (aucune image inventée).
 */
export function AboutTeam({ members, tone }: { members: TeamMember[]; tone: SectionTone }) {
  if (members.length === 0) return null;
  const groups = TEAM_GROUPS.map((group) => ({
    ...group,
    members: members.filter((member) => member.group === group.value),
  })).filter((group) => group.members.length > 0);

  return (
    <Section id={T.id} tone={tone} labelledBy={`${T.id}-titre`}>
      <Container>
        <Reveal className="mb-12 max-w-reading">
          <Eyebrow className="mb-4">{T.label}</Eyebrow>
          <h2 id={`${T.id}-titre`} className="text-h2">
            {T.title}
          </h2>
          <p className="mt-4 text-lead text-muted">{T.intro}</p>
        </Reveal>

        <div className="space-y-14">
          {groups.map((group) => (
            <section key={group.value} aria-labelledby={`${T.id}-${group.value}`}>
              <h3 id={`${T.id}-${group.value}`} className="flex items-center gap-3 text-h3">
                <span aria-hidden="true" className="h-1 w-8 shrink-0 rounded-full bg-gold" />
                {group.label}
              </h3>
              <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {group.members.map((member, index) => (
                  <li key={member.id}>
                    <Reveal delay={(index % 3) * 70} className="h-full">
                      <article
                        className={cn(
                          "flex h-full gap-4 rounded-card border border-line p-5 sm:p-6",
                          tone === "ivory" ? "bg-white" : "bg-ivory",
                        )}
                      >
                        <div className="relative size-16 shrink-0 overflow-hidden rounded-full">
                          {member.photo ? (
                            <ResponsiveImage image={member.photo} fill focus="50% 25%" sizes="64px" />
                          ) : (
                            <span
                              aria-hidden="true"
                              className="flex size-full items-center justify-center bg-brand font-heading text-h4 text-white"
                            >
                              {initials(member.fullName)}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-h4 break-words">{member.fullName}</h4>
                          <p className="mt-1 text-small font-semibold text-link">{member.position}</p>
                          {member.bio && <p className="mt-3 text-small text-muted">{member.bio}</p>}
                        </div>
                      </article>
                    </Reveal>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </Container>
    </Section>
  );
}
