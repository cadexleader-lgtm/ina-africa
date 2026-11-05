import "server-only";

import type { ActionArea, SiteSettings } from "@/lib/types/content";

/**
 * APERÇU DE DÉVELOPPEMENT — uniquement en `next dev` ET tant que Supabase
 * n'est pas configuré. Jamais en production (le build de production renvoie
 * les états vides).
 *
 * Contient EXCLUSIVEMENT les contenus de départ réels déjà écrits par les
 * migrations (aucun texte inventé) :
 *  - les textes officiels (`20261106090100_official_texts.sql`) ;
 *  - les 7 domaines confirmés (`20261105100800_initial_data.sql`), montrés
 *    ici comme s'ils étaient activés, pour juger la mise en page.
 * Aucun projet, article, partenaire ni membre d'équipe : leurs états vides
 * doivent être visibles.
 */
export function isDevPreview(): boolean {
  return (
    process.env.NODE_ENV === "development" &&
    !(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
  );
}

export const DEV_PREVIEW_SETTINGS: Partial<SiteSettings> = {
  vision:
    "Œuvrer à l'inclusion et à la participation active des femmes, des jeunes et des personnes en situation de handicap dans les initiatives de développement durable.",
  mission: [
    "Relever le niveau de vie des femmes et assurer l'inclusion sociale des personnes vulnérables.",
    "Promouvoir la représentativité des femmes dans toutes les sphères de prise de décisions à l'échelle nationale et internationale et susciter leur participation à la mise en œuvre des Objectifs de Développement Durable (ODD), en particulier l'ODD 5 : « Parvenir à l'égalité des sexes et autonomiser toutes les femmes et les filles ».",
    "Offrir aux couches défavorables du continent africain les meilleures conditions de vie socioéconomique et environnementale plus durables.",
  ].join("\n"),
  objectives: [
    "Contribuer à l'autonomisation économique des femmes, à leur bien-être social et à l'insertion socio-professionnelle des jeunes en favorisant leur accès au travail décent à travers la mise en œuvre d'un programme ambitieux dénommé « Programme Jeune Professionnel » (PJP).",
    "Œuvrer à la réduction des inégalités entre les sexes et promouvoir l'approche genre dans tous les pays en voie de développement.",
    "Promouvoir la culture béninoise et africaine par la mise en œuvre des projets structurant de valorisation du patrimoine culturel national et africain.",
    "Participer à l'effort national de lutte contre le réchauffement climatique et assurer une bonne gestion participative et durable des écosystèmes.",
    "Contribuer à une bonne santé des populations en leur fournissant les informations essentielles pour leur bien, tout en œuvrant de façon générale à l'atteinte des objectifs du développement durable.",
  ].join("\n"),
  approach: [
    "Les sessions de formation et de sensibilisation.",
    "Les actions d'aide humanitaire.",
    "Le développement de partenariats.",
    "Les campagnes de collecte de fonds.",
    "La mobilisation du bénévolat.",
  ].join("\n"),
  aboutHistory: [
    "Face aux défis socio-économiques persistants que rencontrent les communautés africaines, notamment dans les domaines de l'éducation, de la santé, de l'autonomisation des femmes et de l'inclusion genre, l'ONG Initiative pour un Nouvel Avenir en Afrique (INA-AFRICA) a été créée en 2017. Elle agit au Bénin, là où les besoins humanitaires et sociaux l'exigent.",
    "La création d'INA-AFRICA a été motivée par la volonté de promouvoir des initiatives locales, durables et inclusives, en mettant l'accent sur l'innovation sociale, le bien-être des jeunes et des adolescents qui constituent la relève de demain, et l'aide à la femme, à l'enfant et aux personnes en situation de handicap.",
  ].join("\n\n"),
  heroKicker: "ONG béninoise, depuis 2017",
  heroTitle: "Un avenir meilleur commence par l'action.",
  heroText: "INA-AFRICA, une organisation engagée pour l'autonomisation des communautés en Afrique.",
  impactTitle: "Aux côtés des communautés",
  impactText:
    "Depuis sa création, INA-AFRICA œuvre à l'autonomisation des femmes rurales et des filles mères, à la formation des jeunes, à la sensibilisation aux droits et à la santé sexuels et reproductifs, au soutien des enfants vulnérables et au développement rural, avec une approche participative et centrée sur l'impact à long terme.",
};

const AREAS: [string, string][] = [
  ["education", "Éducation"],
  ["sante-sexuelle-et-reproductive", "Santé et droits en santé sexuelle et reproductive"],
  ["autonomisation-des-femmes", "Autonomisation des femmes"],
  ["jeunesse-et-adolescents", "Jeunesse et adolescents"],
  ["inclusion-et-egalite-de-genre", "Inclusion et égalité de genre"],
  ["developpement-local-durable", "Développement local durable et inclusif"],
  ["innovation-sociale", "Innovation sociale"],
];

export const DEV_PREVIEW_AREAS: ActionArea[] = AREAS.map(([slug, title], index) => ({
  id: `dev-${slug}`,
  slug,
  title,
  summary: null,
  description: null,
  image: null,
  displayOrder: index + 1,
}));
