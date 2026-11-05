import {
  Compass,
  GraduationCap,
  HandCoins,
  HeartPulse,
  Lightbulb,
  Scale,
  Sprout,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

/**
 * UNE icône par domaine (adresse du domaine), utilisée seulement quand le
 * domaine n'a pas de photo. Domaine inconnu → boussole (neutre).
 */
const AREA_ICONS: Record<string, LucideIcon> = {
  education: GraduationCap,
  "sante-sexuelle-et-reproductive": HeartPulse,
  "autonomisation-des-femmes": HandCoins,
  "jeunesse-et-adolescents": UsersRound,
  "inclusion-et-egalite-de-genre": Scale,
  "developpement-local-durable": Sprout,
  "innovation-sociale": Lightbulb,
};

export function areaIcon(slug: string | null | undefined): LucideIcon {
  return (slug && AREA_ICONS[slug]) || Compass;
}
