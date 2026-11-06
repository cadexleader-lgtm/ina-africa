import { Container } from "@/components/ui/Container";
import { ResponsiveImage } from "@/components/ui/ResponsiveImage";
import { Reveal } from "@/components/ui/Reveal";
import { Section, type SectionTone } from "@/components/ui/Section";
import { Eyebrow } from "@/components/ui/SectionHeading";
import { initials } from "@/components/pages/page-helpers";
import { PAGES } from "@/content/fr/pages";
import { cn } from "@/lib/cn";
import type { TeamMember } from "@/lib/types/content";

const T = PAGES.about.team;

/** Équipe publiée par l'administration. Section absente s'il n'y a personne. */
export function AboutTeam({ members, tone }: { members: TeamMember[]; tone: SectionTone }) {
  if (members.length === 0) return null;
  return (
    <Section id={T.id} tone={tone} labelledBy={`${T.id}-titre`}>
      <Container>
        <Reveal className="mb-12 max-w-reading">
          <Eyebrow className="mb-4">{T.label}</Eyebrow>
          <h2 id={`${T.id}-titre`} className="text-h2">
            {T.title}
          </h2>
        </Reveal>
        <ul className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {members.map((member, index) => (
            <li key={member.id}>
              <Reveal delay={(index % 4) * 70}>
                <div className="relative aspect-[4/5] overflow-hidden rounded-card">
                  {member.photo ? (
                    <ResponsiveImage
                      image={member.photo}
                      fill
                      focus="50% 25%"
                      sizes="(min-width: 1280px) 285px, (min-width: 640px) 45vw, 100vw"
                    />
                  ) : (
                    <div
                      aria-hidden="true"
                      className={cn("absolute inset-0 flex items-center justify-center", tone === "ivory" ? "bg-white" : "bg-brand-50")}
                    >
                      <span className="flex size-24 items-center justify-center rounded-full bg-brand font-heading text-h3 text-white">
                        {initials(member.fullName)}
                      </span>
                    </div>
                  )}
                </div>
                <h3 className="mt-5 text-h4">{member.fullName}</h3>
                <p className="mt-1 text-small font-semibold text-link">{member.position}</p>
                {member.bio && <p className="mt-3 text-small text-muted">{member.bio}</p>}
              </Reveal>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
