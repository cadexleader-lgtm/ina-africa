import {
  Compass,
  GraduationCap,
  HandCoins,
  HeartPulse,
  Leaf,
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
  "environnement-et-resilience-climatique": Leaf,
  "developpement-local-durable": Sprout,
  "innovation-sociale": Lightbulb,
  // Les 7 domaines d'intervention (27/11/2026).
  formation: GraduationCap,
  intermediation: Scale,
  "autonomisation-economique-des-femmes": HandCoins,
  "insertion-socio-professionnelle": UsersRound,
  "lutte-contre-le-travail-des-enfants": HeartPulse,
  "sauvegarde-de-l-environnement": Leaf,
  "lutte-contre-le-rechauffement-climatique": Sprout,
};

export function areaIcon(slug: string | null | undefined): LucideIcon {
  return (slug && AREA_ICONS[slug]) || Compass;
}
