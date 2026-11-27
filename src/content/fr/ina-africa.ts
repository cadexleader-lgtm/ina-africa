/**
 * CONTENU OFFICIEL DE INA-AFRICA — source unique des textes de présentation.
 *
 * Tout ce fichier vient des documents transmis par l'ONG :
 *  - « PRÉSENTATION DE L'ORGANISATION » (historique, expériences,
 *    réalisations pertinentes) ;
 *  - les statuts (vision, missions, objectifs, approche d'intervention :
 *    art. 8 à 11, déjà repris par la migration 20261106090100_official_texts) ;
 *  - la composition des instances (conseil d'administration, conseil de
 *    surveillance, adjoints), transmise le 06/11/2026.
 * Les textes sont reformulés pour la lecture, SANS rien ajouter : aucun
 * chiffre, lieu, date, partenaire ou résultat qui ne figure pas dans ces
 * documents.
 *
 * Utilisation : contenu PAR DÉFAUT du site. Ce que l'administration publie
 * dans la base (paramètres, domaines actifs, équipe) le remplace ; tant que
 * rien n'est publié, ou si la base ne répond pas, ce contenu s'affiche.
 */

import { CLOTHING_KITS_2026_PHOTOS, LAUNCH_2023_PHOTOS, SCHOOL_KITS_2025_PHOTOS, WOMEN_DAY_2026_PHOTOS } from "@/content/action-photos";

import type { TeamGroup } from "@/lib/team";

export const IDENTITY = {
  name: "INA-AFRICA",
  fullName: "Initiative pour un Nouvel Avenir en Afrique",
  kind: "Organisation non gouvernementale (ONG)",
  country: "Bénin",
  foundedYear: 2017,
  /** Communes citées dans les réalisations de l'ONG. */
  places: ["Abomey-Calavi", "Godomey"],
} as const;

// ---------------------------------------------------------------------------
// Accroches (accueil)
// ---------------------------------------------------------------------------

export const HERO = {
  kicker: "ONG béninoise, depuis 2017",
  title: "Un avenir meilleur commence par l'action.",
  text: "INA-AFRICA : agir au cœur des communautés pour libérer les potentiels et bâtir un avenir juste, inclusif et durable en Afrique, en particulier au Bénin.",
};

/** Présentation courte, réutilisable (accueil, pied de page, partage). */
export const SHORT_PRESENTATION =
  "Créée en 2017, INA-AFRICA est une organisation non gouvernementale qui agit au Bénin, là où les besoins humanitaires et sociaux l'exigent. Elle promeut des initiatives locales, durables et inclusives en faveur des femmes, des jeunes, des enfants et des personnes en situation de handicap.";

// ---------------------------------------------------------------------------
// Historique et expériences (document « Présentation de l'organisation »)
// ---------------------------------------------------------------------------

export const HISTORY = [
  "Face aux défis socio-économiques persistants que rencontrent les communautés africaines, notamment dans les domaines de l'éducation, de la santé, de l'autonomisation des femmes et de l'inclusion genre, l'ONG Initiative pour un Nouvel Avenir en Afrique (INA-AFRICA) a été créée en 2017. Elle agit au Bénin, là où les besoins humanitaires et sociaux l'exigent.",
  "La création de INA-AFRICA a été motivée par la volonté de promouvoir des initiatives locales, durables et inclusives, en mettant l'accent sur l'innovation sociale, le bien-être des jeunes et des adolescents qui constituent la relève de demain, et l'aide à la femme, à l'enfant et aux personnes en situation de handicap.",
];

/** Section « Pourquoi INA-AFRICA existe » (page À propos). Texte transmis par l'ONG le 19/11/2026. */
export const ABOUT_CONTEXT = {
  lead: "Répondre aux urgences sociales par l'innovation et l'inclusion.",
  paragraphs: [
    "La création de INA-AFRICA est née d'une conviction forte : le développement durable de l'Afrique passe par des initiatives locales, solidaires et inclusives. Nous plaçons au cœur de notre action l'innovation sociale, la protection de l'environnement et l'épanouissement des jeunes et des adolescents, véritable relève de demain, tout en apportant un soutien vital aux femmes, aux enfants et aux personnes en situation de handicap.",
    "Depuis ses débuts au Bénin, l'ONG démontre son impact concret sur le terrain à travers des programmes ciblés d'éducation, de formation et de santé reproductive. Jour après jour, nous transformons durablement le quotidien des enfants vulnérables, des orphelins, des femmes rurales, des veuves, des filles-mères et des personnes en situation de handicap.",
  ],
} as const;

export const EXPERIENCE = {
  title: "Aux côtés des communautés",
  intro:
    "Une approche participative, un impact durable sur le terrain.\nDepuis sa création, INA-AFRICA place la dignité humaine et l'inclusion au cœur de ses priorités. Nous accompagnons les enfants vulnérables et les orphelins vers un avenir meilleur par le soutien scolaire et matériel. Nous œuvrons également à la formation et à l'insertion professionnelle des jeunes, tout en autonomisant les femmes rurales, les veuves, les filles-mères et les personnes en situation de handicap. Engagée pour le développement rural et la sensibilisation aux droits et à la santé sexuels et reproductifs, notre organisation co-construit chaque projet avec les communautés locales pour garantir des changements profonds et pérennes.",
  impact:
    "L'ONG a démontré son impact au Bénin à travers des actions ciblées en faveur des femmes, des filles mères et des enfants vulnérables.",
  /** Ce que l'ONG fait concrètement (liste courte, tirée du document). */
  fields: [
    "Autonomisation des femmes rurales et des filles mères",
    "Formation des jeunes",
    "Sensibilisation aux droits et à la santé sexuels et reproductifs",
    "Soutien aux enfants vulnérables",
    "Développement rural",
  ],
};

export const WOMEN_PROGRAM = {
  title: "Autonomiser les femmes et les filles mères",
  // Texte transmis par l'ONG le 20/11/2026.
  lead: "Libérer le potentiel des femmes pour transformer les communautés.",
  text: "INA-AFRICA s'engage activement pour l'autonomisation durable des femmes, des veuves et des filles-mères, en priorité celles issues des milieux ruraux et marginalisés. À travers des programmes de formation pratique et d'accompagnement sur mesure, nous leur donnons les clés pour développer leurs compétences, restaurer leur estime de soi et bâtir leur pleine indépendance économique. Parce qu'une femme autonome est un pilier de développement pour toute sa famille et sa communauté.",
  trainings: [
    "Économie solidaire",
    "Hygiène corporelle",
    "Transformation de produits locaux",
    "Entrepreneuriat social",
    "Agro-alimentaire",
  ],
};

// ---------------------------------------------------------------------------
// Réalisations pertinentes (document « Présentation de l'organisation »)
// Pas de date ni de chiffre : le document n'en donne pas.
// ---------------------------------------------------------------------------

export type Achievement = {
  title: string;
  text: string;
  /** Date de l'action (AAAA-MM-JJ), quand l'ONG l'a donnée. */
  date?: string;
  audience?: string;
  place?: string;
  areaSlug?: string;
  /** Vraies photos de l'action transmises par l'ONG (la première sert de couverture). */
  photos?: { path: string; alt: string }[];
};

export const ACHIEVEMENTS: Achievement[] = [
  // Projets et réalisations datés (transmis par l'ONG le 06/11/2026), du plus récent au plus ancien.
  {
    date: "2026-03-21",
    title: "Distribution de kits vestimentaires à Tanmey",
    // Précisions tirées du bandeau des photos transmises par l'ONG (20/11/2026).
    text: "Distribution de kits vestimentaires (sous-vêtements) aux femmes vulnérables à Tanmey, dans l'arrondissement de Zinvié.",
    audience: "Femmes vulnérables",
    place: "Tanmey (arrondissement de Zinvié)",
    areaSlug: "autonomisation-economique-des-femmes",
    photos: CLOTHING_KITS_2026_PHOTOS,
  },
  {
    date: "2026-03-08",
    title: "Journée internationale de la femme",
    text: "INA-AFRICA a marqué la Journée internationale de la femme, le 8 mars 2026.",
    audience: "Les femmes",
    areaSlug: "autonomisation-economique-des-femmes",
    photos: WOMEN_DAY_2026_PHOTOS,
  },
  {
    date: "2025-09-26",
    title: "Distribution de kits scolaires dans trois écoles",
    text: "Distribution de kits scolaires au complexe scolaire Amour de Dieu à Abomey-Calavi, à l'EPP Tori Gare (quartier Sèmè-Aïfa) et à l'EPP de Zinvié.",
    audience: "Élèves de trois écoles",
    place: "Abomey-Calavi, Sèmè-Aïfa et Zinvié",
    areaSlug: "lutte-contre-le-travail-des-enfants",
    photos: SCHOOL_KITS_2025_PHOTOS,
  },
  {
    date: "2023-08-26",
    title: "Lancement officiel des activités de l'ONG",
    text: "Lancement officiel des activités de INA-AFRICA, suivi d'une distribution de vivres et d'enveloppes aux femmes vulnérables.",
    audience: "Femmes vulnérables",
    place: "Zinvié et Djidjè (Cotonou)",
    areaSlug: "autonomisation-economique-des-femmes",
    photos: LAUNCH_2023_PHOTOS,
  },
  // Réalisations du document de présentation (non datées).
  {
    title: "Expliquer la loi 2021-12 sur la santé sexuelle et reproductive",
    text: "Une séance d'échanges avec les chefs de quartier, les leaders d'opinion et les leaders religieux pour expliquer la loi 2021-12 sur la santé sexuelle et reproductive.",
    audience: "Chefs de quartier, leaders d'opinion et religieux",
    place: "Godomey",
    areaSlug: "formation",
  },
];

// ---------------------------------------------------------------------------
// Statuts : vision, missions, objectifs, approche (art. 8 à 11)
// ---------------------------------------------------------------------------

export const VISION =
  "Œuvrer à l'inclusion et à la participation active des femmes, des jeunes et des personnes en situation de handicap dans les initiatives de développement durable.";

export const MISSIONS = [
  "Relever le niveau de vie des femmes et assurer l'inclusion sociale des personnes vulnérables.",
  "Promouvoir la représentativité des femmes dans toutes les sphères de prise de décisions à l'échelle nationale et internationale et susciter leur participation à la mise en œuvre des Objectifs de Développement Durable (ODD), en particulier l'ODD 5 : « Parvenir à l'égalité des sexes et autonomiser toutes les femmes et les filles ».",
  "Offrir aux couches défavorables du continent africain les meilleures conditions de vie socioéconomique et environnementale plus durables.",
];

export const OBJECTIVES = [
  "Contribuer à l'autonomisation économique des femmes, à leur bien-être social et à l'insertion socio-professionnelle des jeunes en favorisant leur accès au travail décent à travers la mise en œuvre d'un programme ambitieux dénommé « Programme Jeune Professionnel » (PJP).",
  "Œuvrer à la réduction des inégalités entre les sexes et promouvoir l'approche genre dans tous les pays en voie de développement.",
  "Promouvoir la culture béninoise et africaine par la mise en œuvre des projets structurant de valorisation du patrimoine culturel national et africain.",
  "Participer à l'effort national de lutte contre le réchauffement climatique et assurer une bonne gestion participative et durable des écosystèmes.",
  "Contribuer à une bonne santé des populations en leur fournissant les informations essentielles pour leur bien, tout en œuvrant de façon générale à l'atteinte des objectifs du développement durable.",
];

export const APPROACH = [
  "Les sessions de formation et de sensibilisation.",
  "Les actions d'aide humanitaire.",
  "Le développement de partenariats.",
  "Les campagnes de collecte de fonds.",
  "La mobilisation du bénévolat.",
];

/** Publics auxquels l'ONG s'adresse (vision, historique, expériences). */
export const AUDIENCES = [
  {
    title: "Les femmes et les filles mères",
    text: "En particulier celles issues de milieux ruraux et marginalisés.",
  },
  {
    title: "Les jeunes et les adolescents",
    text: "La relève de demain, à former et à accompagner vers un travail décent.",
  },
  {
    title: "Les enfants vulnérables",
    text: "Soutenus pour grandir et apprendre dans de meilleures conditions.",
  },
  {
    title: "Les personnes en situation de handicap",
    text: "Pour leur inclusion et leur participation active au développement.",
  },
];

// ---------------------------------------------------------------------------
// Les 8 piliers / domaines d'action (liste confirmée par l'ONG le 20/11/2026). Les textes reprennent
// l'historique, les expériences, les statuts et les réalisations ci-dessus.
// ---------------------------------------------------------------------------

export type OfficialArea = {
  slug: string;
  title: string;
  summary: string;
  /**
   * La problématique : reformulée à partir de l'historique, des statuts et
   * des réalisations. À FAIRE VALIDER par l'ONG (modifiable ici).
   * Absente si l'ONG ne l'a pas encore transmise (rien d'inventé).
   */
  problem?: string;
  /** Les publics concernés (tirés des documents). */
  audiences: string[];
  description: string;
  /** Ce que l'ONG fait ou vise dans ce domaine (tiré des documents). */
  actions: string[];
};

export const AREAS: OfficialArea[] = [
  // Les 7 domaines d'intervention transmis par l'ONG (27/11/2026).
  // Textes rédigés à partir des documents de l'ONG : À FAIRE VALIDER par l'ONG.
  {
    slug: "formation",
    title: "Formation",
    summary:
      "Des formations pratiques pour les femmes, les jeunes et les personnes en situation de handicap : métiers, entrepreneuriat, gestion et savoir-faire utiles au quotidien.",
    problem:
      "Beaucoup de femmes, de jeunes et de personnes en situation de handicap n'ont pas accès à une formation adaptée à leur réalité. Sans savoir-faire reconnu, il est difficile de trouver un travail décent ou de créer sa propre activité.",
    audiences: [
      "Les femmes rurales, les veuves et les filles-mères",
      "Les jeunes et les adolescents",
      "Les personnes en situation de handicap",
    ],
    description:
      "La formation est au cœur de l'action de INA-AFRICA. L'ONG organise des sessions de formation et de sensibilisation adaptées aux besoins des communautés : économie solidaire, hygiène corporelle, transformation de produits locaux, entrepreneuriat social et agro-alimentaire.\n\nCes sessions donnent aux participants des compétences concrètes, utiles tout de suite dans leur vie quotidienne et dans leurs activités, pour avancer vers l'autonomie.",
    actions: [
      "Sessions de formation et de sensibilisation",
      "Économie solidaire",
      "Transformation de produits locaux",
      "Entrepreneuriat social",
      "Agro-alimentaire",
    ],
  },
  {
    slug: "intermediation",
    title: "Action d'intermédiation",
    summary:
      "INA-AFRICA fait le lien entre les communautés, les institutions et les partenaires pour faciliter l'accès aux services, aux opportunités et aux ressources.",
    problem:
      "Les personnes vulnérables connaissent souvent mal les services, les aides et les opportunités qui existent, ou ne savent pas comment y accéder.",
    audiences: ["Les communautés locales", "Les femmes et les jeunes", "Les partenaires et les institutions"],
    description:
      "INA-AFRICA joue un rôle de pont entre les communautés qu'elle accompagne, les autorités locales, les écoles, les institutions et les partenaires. L'ONG relaie les besoins du terrain, oriente les bénéficiaires vers les bons interlocuteurs et rapproche les acteurs autour de projets communs.\n\nCette intermédiation permet de mobiliser les ressources là où elles sont le plus utiles et de construire des partenariats durables au service des plus vulnérables.",
    actions: [
      "Mise en relation avec les institutions et les partenaires",
      "Orientation des bénéficiaires",
      "Développement de partenariats",
    ],
  },
  {
    slug: "autonomisation-economique-des-femmes",
    title: "Appui à l'autonomisation économique des femmes",
    summary:
      "Accompagner les femmes, les veuves et les filles-mères vers l'indépendance financière : activités génératrices de revenus, transformation de produits locaux, entrepreneuriat social.",
    problem:
      "Les femmes rurales, les veuves et les filles-mères restent trop souvent en marge du progrès économique, sans revenus stables ni accès aux moyens de développer une activité.",
    audiences: ["Les femmes rurales", "Les veuves", "Les filles-mères"],
    description:
      "INA-AFRICA s'engage pour l'autonomisation durable des femmes, des veuves et des filles-mères, en priorité celles issues des milieux ruraux et marginalisés. L'ONG les forme et les accompagne pour transformer les savoir-faire locaux en activités génératrices de revenus.\n\nEn renforçant leur indépendance financière, INA-AFRICA renforce aussi leur place dans les prises de décision, au sein de leur famille et de leur communauté.",
    actions: [
      "Activités génératrices de revenus",
      "Transformation de produits locaux",
      "Entrepreneuriat social",
      "Économie solidaire",
      "Gestion financière",
    ],
  },
  {
    slug: "insertion-socio-professionnelle",
    title: "Apprentissage et insertion socio-professionnelle des femmes, des jeunes et des personnes en situation de handicap",
    summary:
      "Accompagner les femmes, les jeunes et les personnes en situation de handicap vers un métier, un emploi décent ou la création de leur propre activité.",
    problem:
      "Le manque de qualification et d'accompagnement éloigne de nombreux jeunes, femmes et personnes en situation de handicap de l'emploi et de l'entrepreneuriat.",
    audiences: ["Les jeunes et les adolescents", "Les femmes et les filles-mères", "Les personnes en situation de handicap"],
    description:
      "INA-AFRICA fait de l'avenir des jeunes une priorité. À travers son « Programme Jeune Professionnel » (PJP), l'ONG accompagne les jeunes, y compris les plus vulnérables, les filles-mères et les jeunes en situation de handicap, dans l'acquisition de compétences recherchées, le mentorat et l'accès à des opportunités concrètes d'emploi ou de création d'entreprise.\n\nL'objectif : que chacun puisse apprendre un métier, s'insérer dans la vie active et devenir acteur du développement de sa communauté.",
    actions: ["Programme Jeune Professionnel (PJP)", "Apprentissage d'un métier", "Mentorat", "Accès à l'emploi et à l'entrepreneuriat"],
  },
  {
    slug: "lutte-contre-le-travail-des-enfants",
    title: "Lutte contre le travail des enfants dans les mines et carrières, les BTP et les activités marchandes",
    summary:
      "Protéger les enfants contre le travail dans les mines et carrières, les BTP et les activités marchandes, et les accompagner vers l'école.",
    problem:
      "Trop d'enfants travaillent dans les mines et carrières, sur les chantiers ou dans les activités marchandes, au lieu d'aller à l'école. Ce travail met en danger leur santé et leur avenir.",
    audiences: ["Les enfants vulnérables", "Les orphelins", "Les familles en difficulté"],
    description:
      "INA-AFRICA agit pour que chaque enfant puisse grandir, apprendre et aller à l'école. L'ONG sensibilise les familles et les communautés aux dangers du travail des enfants et soutient la scolarisation des enfants vulnérables et des orphelins, par exemple avec la distribution de kits scolaires.\n\nGarder les enfants à l'école, c'est les protéger aujourd'hui et leur ouvrir un avenir meilleur demain.",
    actions: ["Sensibilisation des familles et des communautés", "Soutien à la scolarisation", "Distribution de kits scolaires"],
  },
  {
    slug: "sauvegarde-de-l-environnement",
    title: "Sauvegarde de l'environnement",
    summary: "Sensibiliser et agir avec les communautés pour protéger l'environnement et préserver les ressources naturelles.",
    problem:
      "La dégradation de l'environnement touche d'abord les communautés les plus vulnérables, qui dépendent directement des ressources naturelles pour vivre.",
    audiences: ["Les communautés locales", "Les jeunes", "Les femmes rurales"],
    description:
      "La protection de l'environnement fait partie des engagements de INA-AFRICA. L'ONG sensibilise les communautés à la préservation de leur cadre de vie et des ressources naturelles, et encourage des pratiques plus respectueuses de l'environnement au quotidien.\n\nProtéger l'environnement, c'est protéger la santé, les revenus et l'avenir des communautés.",
    actions: [
      "Sensibilisation à la protection de l'environnement",
      "Préservation des ressources naturelles",
      "Pratiques respectueuses de l'environnement",
    ],
  },
  {
    slug: "lutte-contre-le-rechauffement-climatique",
    title: "Lutte contre le réchauffement climatique",
    summary: "Mobiliser les communautés face au réchauffement climatique par la sensibilisation et des pratiques plus durables.",
    problem:
      "Les effets du réchauffement climatique (sécheresses, inondations, baisse des récoltes) fragilisent les communautés rurales et les familles les plus pauvres.",
    audiences: ["Les communautés rurales", "Les jeunes", "Les femmes"],
    description:
      "INA-AFRICA contribue à la lutte contre le réchauffement climatique en sensibilisant les communautés à ses causes et à ses effets, et en encourageant des pratiques plus durables.\n\nL'ONG veut aider les communautés à mieux résister aux changements du climat et à devenir actrices de solutions pour leur avenir.",
    actions: ["Sensibilisation au changement climatique", "Pratiques durables", "Résilience des communautés"],
  },
];

// ---------------------------------------------------------------------------
// Instances de l'ONG (composition transmise le 06/11/2026)
// Mêmes données que la migration 20261106110000_team_groups.
// ---------------------------------------------------------------------------

export type OfficialTeamMember = {
  fullName: string;
  position: string;
  bio: string;
  group: TeamGroup;
};

export const TEAM: OfficialTeamMember[] = [
  {
    fullName: "DJOSSOU Wilfried",
    position: "Président",
    bio: "Premier responsable de l'ONG. Préside l'Assemblée générale et le Conseil d'administration, dirige l'ONG et répond devant toutes les institutions de l'État.",
    group: "conseil_administration",
  },
  {
    fullName: "DJOSSOU Milka Ruth Fifamè",
    position: "Vice-présidente",
    bio: "Assiste le président dans l'exercice de ses fonctions et le supplée en cas d'empêchement.",
    group: "conseil_administration",
  },
  {
    fullName: "TOFFA Clotilde Kinvemi",
    position: "Secrétaire générale",
    bio: "Assure le secrétariat de l'Assemblée générale et du conseil d'administration (convocations, procès-verbaux, rapports). Gère le courrier, archive la mémoire de l'ONG et met en œuvre son plan de communication.",
    group: "conseil_administration",
  },
  {
    fullName: "DJOSSOU Odilon Serge",
    position: "Secrétaire général adjoint",
    bio: "Assiste la secrétaire générale dans ses actions.",
    group: "conseil_administration",
  },
  {
    fullName: "KOUASSI Mewemahuwon Chantal",
    position: "Trésorière générale",
    bio: "Responsable de la gestion des fonds et du patrimoine de l'organisation. Tient une comptabilité régulière, transparente et sincère.",
    group: "conseil_administration",
  },
  {
    fullName: "NICOUE Ginette Sylvana",
    position: "Trésorière générale adjointe",
    bio: "Assiste la trésorière générale dans ses actions et missions, et la remplace en cas d'empêchement.",
    group: "conseil_administration",
  },
  {
    fullName: "AKAKPOVI Bertille Lucresse Amélévi",
    position: "Chargée des affaires féminines",
    bio: "Conçoit, coordonne et met en œuvre des projets et activités au profit des femmes.",
    group: "conseil_administration",
  },
  {
    fullName: "KOUASSI Coffi Boris",
    position: "Chargé des affaires juvéniles",
    bio: "Conçoit, coordonne et met en œuvre des projets et activités au profit de la jeunesse.",
    group: "conseil_administration",
  },
  {
    fullName: "ABIOLA Christelle Gloria",
    position: "Chargée des affaires culturelles",
    bio: "Conçoit, met en œuvre et coordonne des projets et activités en faveur de la culture.",
    group: "conseil_administration",
  },
  {
    fullName: "CHETAN Biwegnon Raoul",
    position: "Président du conseil de surveillance",
    bio: "Dirige et préside les réunions du conseil de surveillance, coordonne les activités de contrôle et de suivi, veille au respect des statuts et à la bonne gouvernance de l'ONG.",
    group: "conseil_surveillance",
  },
  {
    fullName: "ALINDIN Donan Jaelle",
    position: "Secrétaire du conseil de surveillance",
    bio: "Garante de la bonne organisation administrative et de la traçabilité des travaux du conseil de surveillance.",
    group: "conseil_surveillance",
  },
  {
    fullName: "BESSAN Guy",
    position: "Membre du conseil de surveillance",
    bio: "Veille à la transparence et à la bonne gouvernance de l'ONG, sans intervenir dans sa gestion quotidienne.",
    group: "conseil_surveillance",
  },
  {
    fullName: "HOUNDO Koffi Zacharie",
    // Intitulé à confirmer par l'ONG (seule la mission a été transmise).
    position: "Information et porte-parole",
    bio: "Pilote la stratégie d'information de l'ONG, conçoit les contenus d'impact et incarne officiellement sa voix auprès des médias, des institutions et du public.",
    group: "conseil_communication",
  },
  {
    fullName: "OLYMPIO Maxylle Emmanuella",
    position: "Chargée des affaires féminines adjointe",
    bio: "Assiste la chargée des affaires féminines dans ses actions et missions.",
    group: "adjoints",
  },
  {
    fullName: "SENOU Fréjus",
    position: "Chargé des affaires juvéniles adjoint",
    bio: "Assiste le chargé des affaires juvéniles dans ses actions et missions.",
    group: "adjoints",
  },
  {
    fullName: "WINIWANOU Beninda Silvana",
    position: "Chargée des affaires culturelles adjointe",
    bio: "Assiste la chargée des affaires culturelles dans ses actions et missions.",
    group: "adjoints",
  },
  {
    fullName: "QUENUM Eric Brunnel",
    position: "Conseiller technique et stratégique",
    bio: "Apporte à l'ONG un appui technique et stratégique.",
    group: "conseillers",
  },
];

/** Repères factuels (aucun chiffre inventé : tout se compte dans ce fichier). */
export const KEY_FACTS = [
  { value: String(IDENTITY.foundedYear), label: "Année de création" },
  { value: String(AREAS.length), label: "Domaines d'action" },
  { value: String(TEAM.length), label: "Membres dans ses instances" },
  { value: IDENTITY.country, label: "Pays d'intervention" },
];

/**
 * Pourquoi rejoindre ou soutenir INA-AFRICA. Chaque raison s'appuie sur les
 * documents : fonctions des instances (trésorerie, conseil de surveillance),
 * approche participative (expériences), moyens d'action (statuts).
 */
export const JOIN_REASONS = [
  {
    title: "Une gestion transparente",
    text: "La trésorerie tient une comptabilité régulière, transparente et sincère, et un conseil de surveillance veille à la bonne gouvernance de l'ONG.",
  },
  {
    title: "Une action de proximité",
    text: "Une approche participative, au plus près des communautés du Bénin, centrée sur l'impact à long terme.",
  },
  {
    title: "Plusieurs façons d'agir",
    text: "Faire un don, devenir bénévole, adhérer à l'ONG ou devenir partenaire : chacun peut contribuer à sa mesure.",
  },
];

// ---------------------------------------------------------------------------
// Textes éditoriaux de l'accueil et de « À propos ». Reformulations des
// documents ci-dessus (historique, statuts, expériences) : rien d'ajouté.
// ---------------------------------------------------------------------------

/** Présentation de l'organisation (accueil, section 2 ; page À propos). Texte transmis par l'ONG le 19/11/2026. */
export const ORGANISATION_LEAD = "Bâtir ensemble un nouvel avenir, juste, digne et inclusif.";

export const ORGANISATION_INTRO = [
  "Fondée au Bénin en 2017, INA-AFRICA (Initiative pour un Nouvel Avenir en Afrique) est une organisation non gouvernementale engagée au cœur des réalités humanitaires et sociales. Nous agissons avec une conviction profonde : les communautés africaines détiennent en elles la force de bâtir leur propre prospérité, à condition qu'aucun de leurs membres ne soit laissé pour compte.",
  "Face aux défis socio-économiques persistants, l'ONG déploie des réponses concrètes dans des domaines vitaux tels que l'éducation, la santé sexuelle et reproductive, l'autonomisation des femmes, la jeunesse, la protection de l'environnement et l'inclusion. À travers une approche participative centrée sur l'impact à long terme, nous co-construisons des initiatives locales durables au service des enfants, des orphelins, des jeunes, des femmes rurales, des veuves, des filles-mères et des personnes en situation de handicap.",
];

/** Explication de la vision sur la page À propos. Texte transmis par l'ONG le 19/11/2026. */
export const ABOUT_VISION = {
  lead: "De spectateurs à acteurs du développement durable.",
  text: "INA-AFRICA refuse que les enfants, les orphelins, les jeunes, les personnes en situation de handicap ainsi que les femmes rurales, les veuves et les filles-mères restent en marge du progrès. Nous agissons concrètement sur le terrain pour leur offrir un avenir et en faire de véritables moteurs du changement. En protégeant les plus jeunes, en améliorant le quotidien des plus vulnérables et en renforçant la place des femmes dans les prises de décision, nous bâtissons ensemble un monde plus juste, digne et durable.",
} as const;

/** Accroche de la vision (section « Notre vision » de l'accueil). Texte transmis par l'ONG le 19/11/2026. */
export const VISION_LEAD = "Une place pour chacun, un avenir bâti par tous.";

/** Ce que la vision cherche à changer. Texte transmis par l'ONG le 19/11/2026. */
export const VISION_EXPLAINED =
  "INA-AFRICA œuvre pour l'inclusion et la participation active des femmes (notamment les femmes rurales, les veuves et les filles-mères), des jeunes et des personnes en situation de handicap au cœur des initiatives de développement durable. Convaincus qu'ils ne doivent plus rester en marge du progrès, nous agissons pour en faire de véritables acteurs du changement. En améliorant leurs conditions de vie, en renforçant la voix des femmes dans les prises de décision et en levant les barrières sociales, nous bâtissons avec et pour les populations vulnérables un avenir plus juste, digne et durable.";

/** Titres courts des trois missions (statuts, art. 9), dans l'ordre de MISSIONS. */
export const MISSION_TITLES = ["Améliorer les conditions de vie", "Faire progresser l'égalité", "Bâtir un avenir durable"];

/**
 * Les cinq objectifs des statuts (art. 10), dans les termes transmis par
 * l'ONG le 20/11/2026.
 */
export const OBJECTIVE_THEMES = [
  {
    key: "femmes-jeunes",
    title: "L'autonomisation des femmes et l'insertion des jeunes",
    text: "Contribuer à l'autonomisation économique des femmes et à leur bien-être social et à l'insertion socio-professionnelle des jeunes en favorisant leur accès au travail décent à travers la mise en œuvre d'un programme ambitieux dénommé « Programme Jeune Professionnel » (PJP).",
  },
  {
    key: "genre",
    title: "L'égalité entre les femmes et les hommes",
    text: "Œuvrer à la réduction des inégalités entre les sexes et promouvoir l'approche genre dans tous les pays en voie de développement.",
  },
  {
    key: "culture",
    title: "Le patrimoine culturel béninois et africain",
    text: "Promouvoir la culture béninoise et africaine par la mise en œuvre de projets structurants de valorisation du patrimoine culturel national et africain.",
  },
  {
    key: "climat",
    title: "Le climat et les écosystèmes",
    text: "Participer à l'effort national de lutte contre le réchauffement climatique et assurer une bonne gestion participative et durable des écosystèmes.",
  },
  {
    key: "sante",
    title: "La santé et le bien-être des populations",
    text: "Contribuer à une bonne santé des populations en leur fournissant les informations essentielles pour leur bien tout en œuvrant de façon générale à l'atteinte des objectifs du développement durable.",
  },
] as const;

/** Domaines d'intervention (liste transmise par l'ONG le 20/11/2026). */
export const INTERVENTION_DOMAINS = [
  "Formation",
  "Action d'intermédiation",
  "Appui à l'autonomisation économique des femmes",
  "Apprentissage et insertion socio-professionnelle des femmes, des jeunes et des personnes en situation de handicap",
  "Lutte contre le travail des enfants dans les mines et carrières, les BTP et les activités marchandes",
  "Sauvegarde de l'environnement",
  "Lutte contre le réchauffement climatique",
] as const;

/** Les trois façons de s'engager (accueil, À propos, Nous rejoindre). */
export const ENGAGEMENT_OPTIONS = [
  {
    key: "membre",
    title: "Devenir membre",
    text: "Participer à la vie de l'organisation et à ses initiatives, aux côtés de ses instances.",
    href: "/nous-rejoindre/membre",
    action: "Demander à adhérer",
  },
  {
    key: "benevole",
    title: "Devenir bénévole",
    text: "Apporter votre temps et vos compétences aux actions de formation, de sensibilisation et d'aide humanitaire.",
    href: "/nous-rejoindre/benevole",
    action: "Proposer mon aide",
  },
  {
    key: "partenaire",
    title: "Devenir partenaire",
    text: "Soutenir les initiatives de INA-AFRICA et construire des collaborations durables au service des communautés.",
    href: "/nous-rejoindre/partenaire",
    action: "Proposer un partenariat",
  },
] as const;

/**
 * Gouvernance : rôle des instances, déduit UNIQUEMENT des fonctions de leurs
 * membres transmises par l'ONG (aucune règle statutaire supposée).
 */
export const GOVERNANCE = [
  {
    key: "assemblee",
    title: "L'Assemblée générale",
    text: "Elle est présidée par le président de l'ONG. Le secrétariat général en assure le secrétariat : convocations, procès-verbaux et comptes rendus de séance.",
  },
  {
    key: "administration",
    title: "Le conseil d'administration",
    text: "Il dirige l'ONG et conduit ses actions. Il réunit la présidence, le secrétariat général, la trésorerie générale et les chargés des affaires féminines, juvéniles et culturelles.",
  },
  {
    key: "surveillance",
    title: "Le conseil de surveillance",
    text: "Il coordonne les activités de contrôle et de suivi, veille au respect des statuts et à la bonne gouvernance, sans intervenir dans la gestion quotidienne de l'ONG.",
  },
  {
    // Remplace « Une gestion financière transparente » (demande de l'ONG, 20/11/2026).
    key: "communication",
    title: "Le conseil de communication",
    text: "Il veille à faire connaître l'ONG, à valoriser ses actions et à renforcer son image, sa notoriété et sa crédibilité auprès du public et des partenaires.",
  },
] as const;

/** Façons de participer pour un membre : les moyens d'action des statuts (art. 11), formulés pour le lecteur. */
export const MEMBER_PARTICIPATION = [
  "Participer aux sessions de formation et de sensibilisation",
  "Contribuer aux actions d'aide humanitaire",
  "Aider à développer des partenariats",
  "Soutenir les campagnes de collecte de fonds",
  "Mobiliser d'autres bénévoles autour des actions",
];

/**
 * Diapositives du hero de l'accueil (après la première, qui reprend les
 * paramètres du site). Textes tirés des documents ci-dessus ; la photo de
 * chaque diapositive est choisie dans src/content/provisional-images.ts.
 */
export const HERO_SLIDES = [
  {
    key: "femmes",
    kicker: "Autonomisation des femmes",
    title: "Autonomiser les femmes et les filles mères",
    // Texte transmis par l'ONG le 19/11/2026.
    lead: "Transformer les savoir-faire locaux en leviers d'indépendance durable.",
    text: "Économie solidaire, valorisation et transformation de produits locaux, entrepreneuriat social et gestion financière : INA-AFRICA déploie des formations pratiques adaptées aux réalités du terrain. Nous donnons aux femmes rurales, aux veuves, aux filles-mères, aux jeunes et aux personnes en situation de handicap les outils concrets pour développer leurs compétences, créer des activités génératrices de revenus et bâtir leur pleine autonomie économique.",
  },
  {
    key: "jeunes",
    kicker: "Jeunesse",
    title: "Former la relève de demain",
    // Texte transmis par l'ONG le 19/11/2026.
    lead: "Propulser la jeunesse vers l'emploi et l'entrepreneuriat durable.",
    text: "INA-AFRICA fait de l'avenir des jeunes une priorité absolue en favorisant leur formation pratique et leur insertion socio-professionnelle. À travers son initiative phare, le « Programme Jeune Professionnel » (PJP), l'ONG accompagne les jeunes, y compris les plus vulnérables, les filles-mères et les jeunes en situation de handicap, dans l'acquisition de compétences recherchées, le mentorat et l'accès à des opportunités concrètes d'emploi ou de création d'entreprise.",
  },
  {
    key: "sante",
    kicker: "Santé",
    title: "Informer pour mieux protéger",
    text: "Des actions de sensibilisation aux droits et à la santé sexuels et reproductifs auprès d'artisans, d'élèves et de leaders communautaires, à Abomey-Calavi et Godomey.",
  },
  {
    key: "inclusion",
    kicker: "Inclusion",
    title: "Une place pour chacun",
    // Texte transmis par l'ONG le 19/11/2026.
    lead: "Une place pour chacun, un avenir bâti par tous.",
    text: "INA-AFRICA œuvre activement pour l'inclusion et la pleine participation des femmes (notamment les femmes rurales, les veuves et les filles-mères), des jeunes et des personnes en situation de handicap au cœur des initiatives de développement durable. Convaincus qu'aucun progrès n'est véritable s'il laisse des citoyens de côté, nous levons les barrières sociales et économiques pour valoriser leurs talents, amplifier leur voix et leur permettre d'être des acteurs à part entière du changement au sein de leurs communautés.",
  },
] as const;

// ---------------------------------------------------------------------------
// Coordonnées publiques, dons directs, partenaires (transmis le 06/11/2026)
// ---------------------------------------------------------------------------

export const CONTACTS = {
  email: "onginaafrica@gmail.com",
  phone: "+229 01 94 34 04 55",
  /** Format international sans espace (lien wa.me). */
  whatsapp: "+2290194340455",
  /** Siège (transmis le 07/11/2026). */
  address: "Agla Petit-Château\nCotonou, Bénin",
  social: {
    facebook: "https://www.facebook.com/ong.ina.africa.2025",
    tiktok: "https://www.tiktok.com/@ina_africa",
  } as Record<string, string>,
};

/** Dons directs par Mobile Money, montant minimum et montants proposés (FCFA). */
export const DIRECT_DONATIONS = {
  minAmount: 100,
  suggestedAmounts: [2000, 5000, 10000],
  instructions: [
    { method: "mobile_money" as const, label: "Moov Money", number: "01 94 34 04 55" },
    { method: "mobile_money" as const, label: "MTN Mobile Money", number: "01 90 00 32 74" },
  ],
};

/** Partenaires et sponsors (noms transmis par l'ONG ; logos et liens à venir). */
export const PARTNERS = [
  "EREVAN",
  "DOS COMPANY",
  "RACINES SYNERGIE",
  "L'ENVOL DE L'AIGLE CORPORATE",
  "SIGNATURE DIVINE",
  "LE VRAI BONHEUR",
  "CHG INTER SARL",
];
