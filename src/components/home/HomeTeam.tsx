import { ArrowRight } from "lucide-react";

import { LinkButton } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { ResponsiveImage } from "@/components/ui/ResponsiveImage";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { initials } from "@/components/pages/page-helpers";
import type { TeamMember } from "@/lib/types/content";

/** Aperçu de l'équipe : les premiers membres du conseil d'administration, lien vers la page complète. */
export function HomeTeam({ members }: { members: TeamMember[] }) {
  // Les quatre responsables principaux : président(e), vice-président(e),
  // secrétaire et trésorier(ère) généraux (les adjoints figurent sur « À propos »).
  const board = members
    .filter((member) => member.group === "conseil_administration" && !/adjoint/i.test(member.position))
    .slice(0, 4);
  if (board.length === 0) return null;

  return (
    <Section labelledBy="accueil-equipe">
      <Container>
        <Reveal>
          <SectionHeading
            id="accueil-equipe"
            label="Les personnes"
            title="Une équipe engagée"
            intro={`${members.length} membres répartis entre le conseil d'administration, le conseil de surveillance et leurs adjoints font vivre INA-AFRICA.`}
            action={
              <LinkButton href="/a-propos#equipe" variant="link" iconRight={<ArrowRight aria-hidden="true" />}>
                Découvrir toute l&apos;équipe
              </LinkButton>
            }
          />
        </Reveal>
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {board.map((member, index) => (
            <li key={member.id} className="flex">
              <Reveal delay={index * 70} className="flex w-full">
                <div className="flex w-full flex-col items-center rounded-card border border-line bg-white p-6 text-center shadow-card">
                  <div className="relative size-24 overflow-hidden rounded-full ring-4 ring-gold/40">
                    {member.photo ? (
                      <ResponsiveImage image={member.photo} fill focus="50% 25%" sizes="96px" />
                    ) : (
                      <span aria-hidden="true" className="flex size-full items-center justify-center bg-brand font-heading text-h3 text-white">
                        {initials(member.fullName)}
                      </span>
                    )}
                  </div>
                  <h3 className="mt-5 text-h4">{member.fullName}</h3>
                  <p className="mt-1 text-small font-semibold text-link">{member.position}</p>
                  {member.bio && <p className="mt-3 line-clamp-4 text-small text-muted">{member.bio}</p>}
                </div>
              </Reveal>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
