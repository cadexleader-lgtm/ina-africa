/**
 * CONTENU OFFICIEL D'INA-AFRICA — source unique des textes de présentation.
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
  text: "INA-AFRICA, une organisation engagée pour l'autonomisation des communautés en Afrique : femmes, jeunes, enfants vulnérables et personnes en situation de handicap.",
};

/** Présentation courte, réutilisable (accueil, pied de page, partage). */
export const SHORT_PRESENTATION =
  "Créée en 2017, INA-AFRICA est une organisation non gouvernementale qui agit au Bénin, là où les besoins humanitaires et sociaux l'exigent. Elle promeut des initiatives locales, durables et inclusives en faveur des femmes, des jeunes, des enfants et des personnes en situation de handicap.";

// ---------------------------------------------------------------------------
// Historique et expériences (document « Présentation de l'organisation »)
// ---------------------------------------------------------------------------

export const HISTORY = [
  "Face aux défis socio-économiques persistants que rencontrent les communautés africaines, notamment dans les domaines de l'éducation, de la santé, de l'autonomisation des femmes et de l'inclusion genre, l'ONG Initiative pour un Nouvel Avenir en Afrique (INA-AFRICA) a été créée en 2017. Elle agit au Bénin, là où les besoins humanitaires et sociaux l'exigent.",
  "La création d'INA-AFRICA a été motivée par la volonté de promouvoir des initiatives locales, durables et inclusives, en mettant l'accent sur l'innovation sociale, le bien-être des jeunes et des adolescents qui constituent la relève de demain, et l'aide à la femme, à l'enfant et aux personnes en situation de handicap.",
];

export const EXPERIENCE = {
  title: "Aux côtés des communautés",
  intro:
    "Depuis sa création, INA-AFRICA œuvre à l'autonomisation des femmes rurales, à la formation des jeunes, à la sensibilisation aux droits et à la santé sexuels et reproductifs, au soutien des enfants vulnérables et au développement rural, avec une approche participative et centrée sur l'impact à long terme.",
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
  text: "INA-AFRICA œuvre activement pour l'autonomisation des femmes et des filles mères, en particulier celles issues de milieux ruraux et marginalisés. Ces programmes visent à renforcer leurs compétences, leur estime de soi et leur indépendance économique.",
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
  audience: string;
  place: string;
  areaSlug: string;
};

export const ACHIEVEMENTS: Achievement[] = [
  {
    title: "Sensibilisation des artisans aux droits et à la santé sexuels et reproductifs",
    text: "Des activités de sensibilisation sur les droits et la santé sexuels et reproductifs, organisées à l'endroit des artisans.",
    audience: "Artisans",
    place: "Commune d'Abomey-Calavi",
    areaSlug: "sante-sexuelle-et-reproductive",
  },
  {
    title: "Causerie sur les infections sexuellement transmissibles au CEG Godomey",
    text: "À l'occasion de la Saint-Valentin, une causerie sur les maladies sexuellement transmissibles avec les élèves du collège.",
    audience: "Élèves du CEG Godomey",
    place: "Godomey",
    areaSlug: "jeunesse-et-adolescents",
  },
  {
    title: "Expliquer la loi 2021-12 sur la santé sexuelle et reproductive",
    text: "Une séance d'échanges avec les chefs de quartier, les leaders d'opinion et les leaders religieux pour expliquer la loi 2021-12 sur la santé sexuelle et reproductive.",
    audience: "Chefs de quartier, leaders d'opinion et religieux",
    place: "Godomey",
    areaSlug: "sante-sexuelle-et-reproductive",
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
// Les 7 domaines d'action (liste confirmée par l'ONG). Les textes reprennent
// l'historique, les expériences, les statuts et les réalisations ci-dessus.
// ---------------------------------------------------------------------------

export type OfficialArea = {
  slug: string;
  title: string;
  summary: string;
  /**
   * La problématique : reformulée à partir de l'historique, des statuts et
   * des réalisations. À FAIRE VALIDER par l'ONG (modifiable ici).
   */
  problem: string;
  /** Les publics concernés (tirés des documents). */
  audiences: string[];
  description: string;
  /** Ce que l'ONG fait ou vise dans ce domaine (tiré des documents). */
  actions: string[];
};

export const AREAS: OfficialArea[] = [
  {
    slug: "education",
    title: "Éducation",
    summary: "Former les jeunes et soutenir les enfants vulnérables, pour préparer la relève de demain.",
    problem:
      "L'éducation fait partie des défis socio-économiques persistants qui ont conduit à la création d'INA-AFRICA. Former les jeunes et soutenir les enfants vulnérables, c'est préparer la relève de demain.",
    audiences: ["Les jeunes et les adolescents", "Les enfants vulnérables"],
    description:
      "L'éducation est l'un des défis qui ont conduit à la création d'INA-AFRICA. L'ONG s'engage pour la formation des jeunes et le soutien aux enfants vulnérables, avec une approche participative et centrée sur l'impact à long terme.",
    actions: ["Formation des jeunes", "Soutien aux enfants vulnérables", "Sessions de formation et de sensibilisation"],
  },
  {
    slug: "sante-sexuelle-et-reproductive",
    title: "Santé et droits en santé sexuelle et reproductive",
    summary: "Informer et sensibiliser sur les droits et la santé sexuels et reproductifs.",
    problem:
      "La santé fait partie des défis persistants identifiés par l'ONG. Une information fiable sur les droits et la santé sexuels et reproductifs, sur les infections sexuellement transmissibles et sur la loi 2021-12, est essentielle pour que chacun puisse protéger sa santé.",
    audiences: ["Les artisans", "Les élèves et les jeunes", "Les chefs de quartier, leaders d'opinion et religieux"],
    description:
      "INA-AFRICA contribue à une bonne santé des populations en leur fournissant les informations essentielles pour leur bien. L'ONG mène des actions de sensibilisation sur les droits et la santé sexuels et reproductifs auprès d'artisans, d'élèves et de leaders communautaires.",
    actions: [
      "Sensibilisation des artisans de la commune d'Abomey-Calavi",
      "Causerie sur les maladies sexuellement transmissibles avec les élèves du CEG Godomey",
      "Explication de la loi 2021-12 sur la santé sexuelle et reproductive aux chefs de quartier, leaders d'opinion et religieux de Godomey",
    ],
  },
  {
    slug: "autonomisation-des-femmes",
    title: "Autonomisation des femmes",
    summary: "Renforcer les compétences, l'estime de soi et l'indépendance économique des femmes et des filles mères.",
    problem:
      "Les femmes et les filles mères, en particulier celles issues de milieux ruraux et marginalisés, ont besoin de compétences et de ressources pour gagner en indépendance économique et en estime de soi.",
    audiences: ["Les femmes rurales", "Les filles mères", "Les femmes issues de milieux marginalisés"],
    description:
      "INA-AFRICA œuvre activement pour l'autonomisation des femmes et des filles mères, en particulier celles issues de milieux ruraux et marginalisés. Ses programmes visent à relever leur niveau de vie et à renforcer leurs compétences, leur estime de soi et leur indépendance économique.",
    actions: [
      "Formations en économie solidaire",
      "Formations en hygiène corporelle",
      "Transformation de produits locaux",
      "Entrepreneuriat social et agro-alimentaire",
    ],
  },
  {
    slug: "jeunesse-et-adolescents",
    title: "Jeunesse et adolescents",
    summary: "Accompagner les jeunes, la relève de demain, vers le bien-être et le travail décent.",
    problem:
      "Les jeunes et les adolescents constituent la relève de demain. Leur formation, leur santé et leur accès à un travail décent conditionnent l'avenir des communautés.",
    audiences: ["Les jeunes en recherche d'insertion professionnelle", "Les adolescents et les élèves"],
    description:
      "Les jeunes et les adolescents constituent la relève de demain. INA-AFRICA veille à leur bien-être et favorise leur insertion socio-professionnelle et leur accès au travail décent, notamment à travers son « Programme Jeune Professionnel » (PJP).",
    actions: [
      "Formation des jeunes",
      "Programme Jeune Professionnel (PJP) pour l'insertion socio-professionnelle",
      "Sensibilisation des élèves à la santé sexuelle et reproductive",
    ],
  },
  {
    slug: "inclusion-et-egalite-de-genre",
    title: "Inclusion et égalité de genre",
    summary: "Réduire les inégalités entre les sexes et inclure les personnes vulnérables.",
    problem:
      "Les inégalités entre les sexes et la mise à l'écart des personnes vulnérables freinent le développement durable. L'ODD 5 fixe l'objectif de parvenir à l'égalité des sexes et d'autonomiser toutes les femmes et les filles.",
    audiences: ["Les femmes et les filles", "Les personnes en situation de handicap", "Les personnes vulnérables"],
    description:
      "INA-AFRICA œuvre à l'inclusion et à la participation active des femmes, des jeunes et des personnes en situation de handicap. Elle promeut la représentativité des femmes dans toutes les sphères de décision et l'atteinte de l'ODD 5 : « Parvenir à l'égalité des sexes et autonomiser toutes les femmes et les filles ».",
    actions: [
      "Réduction des inégalités entre les sexes et promotion de l'approche genre",
      "Représentativité des femmes dans les sphères de décision",
      "Aide aux personnes en situation de handicap",
    ],
  },
  {
    slug: "developpement-local-durable",
    title: "Développement local durable et inclusif",
    summary: "Des initiatives locales et durables pour de meilleures conditions de vie.",
    problem:
      "Les couches défavorisées ont besoin de meilleures conditions de vie, à la fois socio-économiques et environnementales. Le réchauffement climatique et la gestion des écosystèmes sont aussi des enjeux pour les communautés.",
    audiences: ["Les communautés rurales", "Les populations défavorisées"],
    description:
      "INA-AFRICA promeut des initiatives locales, durables et inclusives pour offrir aux couches défavorisées de meilleures conditions de vie socio-économiques et environnementales. L'ONG agit pour le développement rural, la lutte contre le réchauffement climatique et la valorisation du patrimoine culturel béninois et africain.",
    actions: [
      "Développement rural",
      "Gestion participative et durable des écosystèmes",
      "Lutte contre le réchauffement climatique",
      "Valorisation du patrimoine culturel béninois et africain",
    ],
  },
  {
    slug: "innovation-sociale",
    title: "Innovation sociale",
    summary: "Inventer avec les communautés des réponses locales à leurs besoins.",
    problem:
      "Les défis des communautés appellent des réponses adaptées à chaque territoire. INA-AFRICA a été créée pour promouvoir des initiatives locales, durables et inclusives, construites avec les personnes concernées.",
    audiences: ["Les communautés locales", "Les bénévoles et partenaires engagés à leurs côtés"],
    description:
      "L'innovation sociale est au cœur du projet d'INA-AFRICA depuis sa création. L'ONG s'appuie sur une approche participative, le développement de partenariats et la mobilisation du bénévolat pour construire, avec les communautés, des réponses durables à leurs besoins.",
    actions: [
      "Approche participative centrée sur l'impact à long terme",
      "Développement de partenariats",
      "Mobilisation du bénévolat",
      "Campagnes de collecte de fonds",
    ],
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
    bio: "Assure le secrétariat de l'Assemblée générale et du Conseil d'administration : conçoit les actes administratifs, rédige les procès-verbaux, comptes rendus, rapports de séance et convocations. Traite, affecte et classe les courriers, met en œuvre le plan de communication de l'ONG, constitue et archive sa mémoire.",
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
    fullName: "OLYMPIO Maxylle Emmanuella",
    position: "Chargée des affaires féminines adjointe",
    bio: "Assiste la chargée des affaires féminines dans ses actions et missions.",
    group: "adjoints",
  },
  {
    fullName: "WINIWANOU Beninda Silvana",
    position: "Chargée des affaires culturelles adjointe",
    bio: "Assiste la chargée des affaires culturelles dans ses actions et missions.",
    group: "adjoints",
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

/** Présentation de l'organisation (accueil, section 2). */
export const ORGANISATION_INTRO = [
  "INA-AFRICA, Initiative pour un Nouvel Avenir en Afrique, est une organisation non gouvernementale née au Bénin en 2017. Elle agit là où les besoins humanitaires et sociaux l'exigent, avec une conviction : les communautés africaines peuvent construire elles-mêmes un avenir plus juste et plus durable, à condition que chacun y trouve sa place.",
  "L'ONG est née face aux défis socio-économiques persistants que rencontrent les communautés, notamment dans l'éducation, la santé, l'autonomisation des femmes et l'inclusion genre. Elle promeut des initiatives locales, durables et inclusives, avec une approche participative et centrée sur l'impact à long terme.",
];

/** Ce que la vision cherche à changer (reformulation de la vision et des missions). */
export const VISION_EXPLAINED =
  "INA-AFRICA veut que les femmes, les jeunes et les personnes en situation de handicap ne restent pas en marge du développement, mais en deviennent des acteurs : en améliorant leurs conditions de vie, en renforçant la place des femmes dans les décisions et en bâtissant, pour les populations défavorisées, des conditions de vie plus durables.";

/** Titres courts des trois missions (statuts, art. 9), dans l'ordre de MISSIONS. */
export const MISSION_TITLES = [
  "Améliorer les conditions de vie",
  "Faire progresser l'égalité",
  "Bâtir un avenir durable",
];

/**
 * Objectifs (statuts, art. 10) présentés en six thèmes : le premier objectif
 * statutaire couvre à la fois les femmes et les jeunes, d'où deux cartes.
 */
export const OBJECTIVE_THEMES = [
  {
    key: "femmes",
    title: "L'autonomisation économique des femmes",
    text: "Contribuer à l'autonomisation économique des femmes et à leur bien-être social, pour qu'elles gagnent en indépendance.",
  },
  {
    key: "jeunes",
    title: "L'insertion professionnelle des jeunes",
    text: "Favoriser l'accès des jeunes à un travail décent, notamment à travers le « Programme Jeune Professionnel » (PJP).",
  },
  {
    key: "genre",
    title: "L'égalité entre les femmes et les hommes",
    text: "Réduire les inégalités entre les sexes et promouvoir l'approche genre dans les pays en voie de développement.",
  },
  {
    key: "culture",
    title: "Le patrimoine culturel béninois et africain",
    text: "Promouvoir la culture béninoise et africaine par des projets structurants de valorisation du patrimoine culturel.",
  },
  {
    key: "climat",
    title: "La gestion durable des écosystèmes",
    text: "Participer à la lutte contre le réchauffement climatique et à une gestion participative et durable des écosystèmes.",
  },
  {
    key: "sante",
    title: "La santé et le bien-être des populations",
    text: "Fournir aux populations les informations essentielles pour leur santé et contribuer à l'atteinte des objectifs de développement durable.",
  },
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
    text: "Soutenir les initiatives d'INA-AFRICA et construire des collaborations durables au service des communautés.",
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
    key: "finances",
    title: "Une gestion financière transparente",
    text: "La trésorière générale est responsable de la gestion des fonds et du patrimoine de l'organisation. Elle tient une comptabilité régulière, transparente et sincère.",
  },
] as const;
