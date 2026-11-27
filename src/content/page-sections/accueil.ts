import { ACHIEVEMENTS, AUDIENCES, EXPERIENCE, HERO, HERO_SLIDES, MISSION_TITLES, OBJECTIVE_THEMES, ORGANISATION_INTRO, ORGANISATION_LEAD, VISION_EXPLAINED, VISION_LEAD, WOMEN_PROGRAM } from "@/content/fr/ina-africa";
import { T } from "@/content/fr/site";
import { HOME_PHOTOS } from "@/content/provisional-images";
import type { PageDef } from "@/lib/page-content/types";
import { slugify } from "@/lib/validation/admin/common";

import { cards, image, label, lead, line, list, text, title } from "./fields";

/**
 * Page d'accueil (/), sections dans l'ordre du site.
 * Ne jamais renommer une clé (`key`) : elle sert d'identifiant dans la base.
 */

/** Identifiant stable d'une action documentée (rattache ses textes modifiés). */
export const achievementKey = (achievementTitle: string) => slugify(achievementTitle).slice(0, 80);


/** Phrases affichées sur les grandes photos du haut (une par photo, même ordre). */
const HERO_CAPTIONS = [
  "Chaque enfant mérite de grandir, d'apprendre et de rêver.",
  "Une femme qui gagne sa vie fait vivre toute une famille.",
  "Un métier entre les mains, c'est un avenir qui s'ouvre.",
  "Garder les filles à l'école, c'est changer une génération.",
  "Soutenir les femmes, c'est faire avancer toute une communauté.",
  "Protéger la terre, c'est protéger ceux qui en vivent."
];

export const HOME_PAGE: PageDef = {
  key: "accueil",
  label: "Accueil",
  path: "/",
  description: "Page d'accueil : diaporama du haut, présentation, vision, domaines, objectifs, actions, projets, équipe, actualités, appel à agir.",
  sections: [
    {
      key: "haut",
      title: "Haut de la page (première image)",
      description: "Première image du diaporama, avec les deux boutons.",
      anchor: null,
      fields: [
        line("kicker", "Petit titre au-dessus", HERO.kicker, 80),
        title(HERO.title, "Grand titre"),
        text("text", "Texte", HERO.text, 400, 3),
        line("primary", "Bouton 1 (vers À propos)", T.home.hero.primary, 40),
        line("secondary", "Bouton 2 (vers Nous rejoindre)", T.home.hero.secondary, 40),
      ],
    },
    {
      key: "photos",
      title: "Grandes photos du haut (défilement)",
      description: "Les photos qui défilent en grand à droite du texte, dans l'ordre. Photos en haute définition, au format paysage.",
      anchor: null,
      fields: [
        ...HOME_PHOTOS.heroGallery.flatMap((photo, index) => [
          image(`photo-${index + 1}`, `Photo ${index + 1}`, photo),
          line(`caption-${index + 1}`, `Phrase sur la photo ${index + 1}`, HERO_CAPTIONS[index] ?? "", 120),
        ]),
        line("action", "Bouton sur les photos (vers Faire un don)", "Je soutiens cette cause", 40),
        line("actionNote", "Petite phrase au-dessus du bouton", "Votre don peut tout changer.", 80),
      ],
    },
    {
      key: "diaporama",
      title: "Diaporama (images suivantes)",
      description: "Les images qui défilent après la première, dans l'ordre.",
      anchor: null,
      fields: [
        {
          key: "slides",
          label: "Images du diaporama",
          itemLabel: "Image",
          kind: "items",
          fixed: true,
          keys: HERO_SLIDES.map((slide) => slide.key),
          maxItems: HERO_SLIDES.length,
          fields: [
            { key: "kicker", label: "Petit titre", kind: "line", max: 80 },
            { key: "title", label: "Grand titre", kind: "line", max: 160 },
            { key: "lead", label: "Phrase d'accroche (facultative)", kind: "line", max: 300 },
            { key: "text", label: "Texte", kind: "text", max: 1000 },
          ],
          default: HERO_SLIDES.map((slide) => ({ kicker: slide.kicker, title: slide.title, lead: "lead" in slide ? slide.lead : "", text: slide.text })),
        },
      ],
    },
    {
      key: "presentation",
      title: "Qui sommes-nous ?",
      anchor: "accueil-presentation",
      fields: [
        label(T.home.about.label),
        title(T.home.about.title),
        lead(ORGANISATION_LEAD),
        text("text", "Présentation", ORGANISATION_INTRO.join("\n\n"), 3000, 8),
        line("audiencesTitle", "Titre des publics", "Les publics que nous accompagnons", 160),
        cards("audiences", "Publics accompagnés", "Public", AUDIENCES, { textMax: 300 }),
        line("more", "Texte du bouton", T.home.about.more, 60),
      ],
    },
    {
      key: "vision",
      title: "Notre vision",
      anchor: "accueil-vision",
      fields: [
        label("Notre vision"),
        title("Ce que nous voulons changer"),
        text("quote", "Citation (grande phrase)", VISION_LEAD, 400, 2),
        text("text", "Texte", VISION_EXPLAINED, 2000, 5),
        line("missionsTitle", "Titre des missions", "Nos missions", 120),
        list("missionTitles", "Titres courts des missions (dans l'ordre des missions)", "Titre de la mission", MISSION_TITLES, 120, 8),
      ],
      elsewhere: [{ label: "Texte des missions : Pages du site → À propos → Nos missions", href: "/admin/pages/a-propos#section-missions" }],
    },
    {
      key: "piliers",
      title: "Nos domaines d'intervention",
      anchor: "accueil-domaines",
      fields: [
        label(T.home.areas.label),
        title(T.home.areas.title),
        lead("Des actions ciblées pour un impact global et durable."),
        text(
          "text",
          "Texte",
          "Chaque projet mené sur le terrain par INA-AFRICA s'inscrit dans l'un de ses sept domaines d'intervention. Cette approche intégrée nous permet d'apporter des réponses concrètes, inclusives et pérennes aux besoins des communautés les plus vulnérables.",
        ),
        line("all", "Texte de la carte « tous les domaines »", T.home.areas.all, 80),
        line("allIntro", "Carte « tous les domaines » : phrase", "Pour chaque domaine, découvrez :", 120),
        list("allItems", "Carte « tous les domaines » : points", "Point", ["La problématique", "Notre engagement", "Nos interventions", "Les publics concernés"], 80, 6),
      ],
      records: "areas",
    },
    {
      key: "objectifs",
      title: "Nos objectifs",
      anchor: "accueil-objectifs",
      fields: [
        label("Nos objectifs"),
        title("Ce que nous nous engageons à faire"),
        lead("Une vision statutaire claire, un engagement concret sur le terrain."),
        text(
          "text",
          "Texte",
          "Les objectifs inscrits dans les statuts de INA-AFRICA constituent le socle de notre gouvernance et guident chacune de nos décisions. Bien plus que de simples textes fondateurs, ils représentent une boussole éthique qui oriente nos interventions en faveur des enfants, des orphelins, des jeunes, des femmes vulnérables, des veuves, des filles-mères et des personnes en situation de handicap. C'est cette fidélité à notre mission originelle qui garantit la cohérence, la transparence et l'impact durable de nos actions au service des communautés.",
        ),
        cards("items", "Objectifs", "Objectif", OBJECTIVE_THEMES, { maxItems: 9, textMax: 600 }),
      ],
    },
    {
      key: "actions",
      title: "Nos actions sur le terrain",
      description: "Texte d'introduction, actions documentées (avec leurs photos), programme pour les femmes.",
      anchor: "realisations",
      alsoOn: ["Projets (actions classées par domaine)"],
      fields: [
        label("Nos actions sur le terrain"),
        title(EXPERIENCE.title),
        text("text", "Texte (la première ligne s'affiche en gras)", EXPERIENCE.intro, 3000, 6),
        {
          key: "achievements",
          label: "Actions documentées",
          hint: "Les dates et les photos de chaque action restent celles transmises par l'ONG : seuls les textes changent ici.",
          itemLabel: "Action",
          kind: "items",
          fixed: true,
          keys: ACHIEVEMENTS.map((achievement) => achievementKey(achievement.title)),
          maxItems: ACHIEVEMENTS.length,
          fields: [
            { key: "title", label: "Titre", kind: "line", max: 200 },
            { key: "text", label: "Texte", kind: "text", max: 1500 },
            { key: "place", label: "Lieu", kind: "line", max: 120 },
            { key: "audience", label: "Public", kind: "line", max: 200 },
          ],
          default: ACHIEVEMENTS.map((achievement) => ({
            title: achievement.title,
            text: achievement.text,
            place: achievement.place ?? "",
            audience: achievement.audience ?? "",
          })),
        },
        image("image", "Photo du programme pour les femmes (facultative)", null),
        line("womenTitle", "Programme pour les femmes : titre", WOMEN_PROGRAM.title, 160),
        line("womenLead", "Programme pour les femmes : phrase en gras", WOMEN_PROGRAM.lead, 300),
        text("womenText", "Programme pour les femmes : texte", WOMEN_PROGRAM.text, 2000, 5),
        text("womenNote", "Programme pour les femmes : note", EXPERIENCE.impact, 600, 2),
        line("trainingsTitle", "Titre des formations", "Les formations proposées", 120),
        list("trainings", "Formations proposées", "Formation", WOMEN_PROGRAM.trainings, 120, 12),
      ],
    },
    {
      key: "projets",
      title: "Nos projets et actions",
      anchor: "accueil-projets",
      fields: [label(T.home.projects.label), title(T.home.projects.title), line("all", "Texte du lien « tous les projets »", T.home.projects.all, 80)],
      elsewhere: [{ label: "Les projets eux-mêmes : Projets", href: "/admin/projets" }],
    },
    {
      key: "equipe",
      title: "Une équipe engagée",
      anchor: "accueil-equipe",
      fields: [
        label("Les personnes"),
        title("Une équipe engagée"),
        line(
          "intro",
          "Introduction",
          "{nombre} membres, répartis entre le conseil d'administration, le conseil de surveillance, les adjoints et les conseillers, font vivre INA-AFRICA.",
          400,
          "{nombre} est remplacé automatiquement par le nombre de membres.",
        ),
        line("all", "Texte du lien vers toute l'équipe", "Découvrir toute l'équipe", 80),
      ],
      records: "team",
    },
    {
      key: "rejoindre",
      title: "Pourquoi rejoindre INA-AFRICA ?",
      anchor: "rejoindre",
      fields: [],
      sharedWith: { page: "a-propos", section: "rejoindre" },
    },
    {
      key: "actualites",
      title: "Dernières actualités",
      anchor: "accueil-actualites",
      fields: [
        label(T.home.news.label),
        title(T.home.news.title),
        line("all", "Texte du lien « toutes les actualités »", T.home.news.all, 80),
        line("emptyTitle", "Sans article publié : titre", "Suivez les actualités de INA-AFRICA", 160),
        text(
          "emptyText",
          "Sans article publié : texte",
          "Les nouvelles de l'ONG, ses actions et ses appels aux dons paraîtront ici. Inscrivez-vous à la lettre d'information pour les recevoir dès leur publication.",
          600,
          3,
        ),
      ],
      elsewhere: [{ label: "Les articles : Articles", href: "/admin/articles" }],
    },
    {
      key: "partenaires",
      title: "Partenaires et sponsors",
      anchor: "accueil-partenaires",
      fields: [label(T.home.partners.label), title(T.home.partners.title)],
      records: "partners",
    },
    {
      key: "agir",
      title: "Construisons ensemble (appel à agir)",
      anchor: "accueil-agir",
      fields: [
        title("Construisons ensemble un nouvel avenir en Afrique"),
        text(
          "text",
          "Texte",
          "Chacun a un rôle à jouer pour transformer des vies sur le terrain. Par un don, vous financez nos actions concrètes d'éducation, de formation, de sensibilisation et d'aide humanitaire auprès des plus vulnérables. En tant que membre ou bénévole, vous mettez votre temps, votre énergie et vos compétences au service des communautés que INA-AFRICA accompagne vers l'autonomie.",
          1500,
          5,
        ),
        line("donate", "Bouton 1 (vers Faire un don)", "Faire un don", 40),
        line("member", "Bouton 2 (vers Devenir membre)", "Devenir membre", 40),
        line("volunteer", "Bouton 3 (vers Devenir bénévole)", "Devenir bénévole", 40),
        image("image", "Photo", HOME_PHOTOS.callToAction),
      ],
    },
  ],
};
