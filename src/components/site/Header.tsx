import { Suspense } from "react";
import { Heart } from "lucide-react";

import { LinkButton } from "@/components/ui/Button";
import { DesktopNav } from "@/components/site/DesktopNav";
import { Logo } from "@/components/site/Logo";
import { MobileMenu, MobileMenuWithPath } from "@/components/site/MobileMenu";
import { EngageMenu } from "@/components/site/EngageMenu";
import { NavLinks } from "@/components/site/NavLinks";
import { DESKTOP_NAV, DONATE_LINK, MAIN_NAV, T } from "@/content/fr/site";

/**
 * En-tête collant et discret (72 px) : logo, navigation, bouton « Faire un don ».
 * Navigation complète et menu « Agir avec nous » dès 1024 px ; en dessous :
 * bouton de don compact + menu mobile.
 * Les composants qui lisent l'adresse (lien actif) sont sous <Suspense> : sur
 * une page dont l'adresse n'est connue qu'à la requête, le secours (même
 * navigation, sans lien actif) fait partie du rendu statique.
 */
export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white">
      <div className="mx-auto box-content flex h-header max-w-site items-center justify-between gap-4 px-gutter xl:gap-6">
        <Logo className="shrink-0" />

        <nav aria-label={T.a11y.mainNav} className="hidden items-center lg:flex">
          <Suspense fallback={<NavLinks items={DESKTOP_NAV} pathname={null} layout="bar" />}>
            <DesktopNav items={DESKTOP_NAV} />
          </Suspense>
          <EngageMenu />
        </nav>

        <div className="flex items-center gap-2 whitespace-nowrap">
          {/* Les classes d'affichage sont sur des enveloppes : jamais en conflit avec celles du bouton. */}
          <div className="hidden lg:block">
            <LinkButton href={DONATE_LINK.href} variant="donate" iconLeft={<Heart aria-hidden="true" />}>
              {DONATE_LINK.label}
            </LinkButton>
          </div>
          <div className="lg:hidden">
            <LinkButton href={DONATE_LINK.href} variant="donate" size="sm">
              {DONATE_LINK.label}
            </LinkButton>
          </div>
          <div className="lg:hidden">
            <Suspense fallback={<MobileMenu items={MAIN_NAV} donate={DONATE_LINK} />}>
              <MobileMenuWithPath items={MAIN_NAV} donate={DONATE_LINK} />
            </Suspense>
          </div>
        </div>
      </div>
    </header>
  );
}
