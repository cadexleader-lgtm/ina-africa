import { Heart, HandHeart, UserPlus } from "lucide-react";

import { LinkButton } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { ResponsiveImage } from "@/components/ui/ResponsiveImage";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { HOME_PHOTOS } from "@/content/provisional-images";

/** Section 10 : appel à l'action, panneau bleu avec photo, trois actions. */
export function HomeCallToAction() {
  return (
    <Section spacing="compact" labelledBy="accueil-agir">
      <Container>
        <Reveal>
          <div className="on-dark grid overflow-hidden rounded-panel bg-brand lg:grid-cols-12">
            <div className="px-6 py-10 sm:px-10 md:py-14 lg:col-span-7 lg:px-14">
              <span aria-hidden="true" className="mb-6 block h-1 w-12 rounded-full bg-gold" />
              <h2 id="accueil-agir" className="text-h2">
                Construisons ensemble un nouvel avenir en Afrique
              </h2>
              <p className="mt-4 max-w-measure text-lead text-muted-inverse">
                Un don finance les actions de formation, de sensibilisation et d&apos;aide humanitaire. Comme membre ou
                bénévole, vous donnez de votre temps et de vos compétences aux communautés qu&apos;accompagne INA-AFRICA.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <LinkButton href="/faire-un-don" variant="donate" size="lg" iconLeft={<Heart aria-hidden="true" />}>
                  Faire un don
                </LinkButton>
                <LinkButton href="/nous-rejoindre/membre" variant="inverse" size="lg" iconLeft={<UserPlus aria-hidden="true" />}>
                  Devenir membre
                </LinkButton>
                <LinkButton href="/nous-rejoindre/benevole" variant="inverse" size="lg" iconLeft={<HandHeart aria-hidden="true" />}>
                  Devenir bénévole
                </LinkButton>
              </div>
            </div>
            <div className="relative min-h-[16rem] lg:col-span-5">
              <ResponsiveImage
                image={HOME_PHOTOS.callToAction}
                fill
                focus="50% 50%"
                sizes="(min-width: 1024px) 480px, 100vw"
                labelPosition="bottom-right"
              />
            </div>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
