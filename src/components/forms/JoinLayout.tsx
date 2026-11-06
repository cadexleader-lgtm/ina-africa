import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, Handshake, HandHeart, Heart, ShieldCheck, Users, type LucideIcon } from "lucide-react";

import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { AsideCard, FormCard, PageIntro, StepList } from "@/components/forms/PageParts";
import { FORM_TEXT } from "@/content/fr/forms";

export type JoinPath = "volunteer" | "member" | "partner";

/** Les trois parcours « Nous rejoindre » (accueil des parcours et liens croisés). */
export const JOIN_PATHS: { key: JoinPath; href: string; icon: LucideIcon; title: string; text: string; action: string }[] = [
  { key: "volunteer", href: "/nous-rejoindre/benevole", icon: HandHeart, ...FORM_TEXT.join.volunteer },
  { key: "member", href: "/nous-rejoindre/membre", icon: Users, ...FORM_TEXT.join.member },
  { key: "partner", href: "/nous-rejoindre/partenaire", icon: Handshake, ...FORM_TEXT.join.partner },
];

const LINK = "inline-flex items-center gap-1.5 font-semibold text-link underline-offset-4 hover:text-link-strong hover:underline";

type JoinLayoutProps = {
  current: JoinPath;
  title: string;
  intro: ReactNode;
  formTitle: string;
  /** Information complémentaire sous le titre du formulaire. */
  formNote?: ReactNode;
  /** Sections de présentation affichées avant le formulaire (ex. adhésion). */
  before?: ReactNode;
  children: ReactNode;
};

/** Mise en page commune des formulaires « Nous rejoindre » : formulaire + encadrés (étapes, confidentialité, autres parcours). */
export function JoinLayout({ current, title, intro, formTitle, formNote, before, children }: JoinLayoutProps) {
  const J = FORM_TEXT.join;
  const others = JOIN_PATHS.filter((path) => path.key !== current);
  return (
    <>
      <PageIntro
        eyebrow={J.eyebrow}
        title={title}
        intro={intro}
        breadcrumbs={[{ label: J.breadcrumb, href: "/nous-rejoindre" }, { label: title }]}
      />
      {before}
      <Section labelledBy="rejoindre-formulaire">
        <Container>
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-7">
              <FormCard title={formTitle} titleId="rejoindre-formulaire" description={formNote}>
                {children}
              </FormCard>
            </div>
            <div className="flex flex-col gap-6 lg:col-span-5">
              <AsideCard title={before ? "Vos données" : J.stepsTitle}>
                {/* Avec une présentation avant le formulaire, la démarche y est déjà décrite. */}
                {!before && <StepList steps={J.steps} />}
                <p className={before ? "flex gap-2 text-small text-muted" : "mt-6 flex gap-2 border-t border-line pt-5 text-small text-muted"}>
                  <ShieldCheck aria-hidden="true" className="size-5 shrink-0 text-brand-2" />
                  <span>
                    {J.privacyNote}{" "}
                    <Link href="/politique-de-confidentialite" className="text-link underline underline-offset-4">
                      {FORM_TEXT.common.consentLink}
                    </Link>
                  </span>
                </p>
              </AsideCard>
              <AsideCard title={J.otherPathsTitle} tone="white">
                <ul className="flex flex-col gap-3">
                  {others.map((path) => (
                    <li key={path.key}>
                      <Link href={path.href} className={LINK}>
                        <path.icon aria-hidden="true" className="size-4" />
                        {path.title}
                      </Link>
                    </li>
                  ))}
                  <li>
                    <Link href="/faire-un-don" className={LINK}>
                      <Heart aria-hidden="true" className="size-4" />
                      {J.donateAction}
                    </Link>
                  </li>
                  <li>
                    <Link href="/contact" className={LINK}>
                      <ArrowRight aria-hidden="true" className="size-4" />
                      {J.contactAction}
                    </Link>
                  </li>
                </ul>
              </AsideCard>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
