import { formatAchievementDate } from "@/components/site/AchievementCard";
import { REAL_PHOTOS } from "@/content/action-photos";
import {
  ABOUT_CONTEXT,
  ABOUT_VISION,
  ACHIEVEMENTS,
  APPROACH,
  AUDIENCES,
  ENGAGEMENT_OPTIONS,
  EXPERIENCE,
  GOVERNANCE,
  HISTORY,
  JOIN_REASONS,
  MISSIONS,
  OBJECTIVES,
  ORGANISATION_INTRO,
  ORGANISATION_LEAD,
  VISION,
} from "@/content/fr/ina-africa";
import { FOUNDING_YEAR, PAGES } from "@/content/fr/pages";
import { PAGE_BACKDROPS } from "@/content/provisional-images";
import type { PageDef } from "@/lib/page-content/types";

/**
 * Page « À propos » (/a-propos), sections dans l'ordre du site.
 * Valeurs d'origine = textes actuels du site (transmis par l'ONG).
 * Ne jamais renommer une clé (`key`) : elle sert d'identifiant dans la base.
 */

const T = PAGES.about;

const TIMELINE = [
  { when: String(FOUNDING_YEAR), what: "Création de l'ONG INA-AFRICA" },
  ...ACHIEVEMENTS.filter((item) => item.date)
    .sort((a, b) => (a.date! < b.date! ? -1 : 1))
    .map((item) => ({ when: formatAchievementDate(item.date!), what: item.title })),
];

const LABEL = { key: "label", label: "Petit titre au-dessus", kind: "line", max: 60 } as const;
const TITLE = { key: "title", label: "Titre de la section", kind: "line", max: 120 } as const;

export const ABOUT_PAGE: PageDef = {
  key: "a-propos",
  label: "À propos",
  path: "/a-propos",
  description: "Présentation de l'ONG : histoire, raison d'être, vision, missions, objectifs, approche, gouvernance, équipe.",
  sections: [
    {
      key: "en-tete",
      title: "Haut de la page",
      description: "Titre de la page, texte de présentation et photo de fond.",
      anchor: null,
      fields: [
        { ...LABEL, default: T.label },
        { key: "title", label: "Titre de la page", kind: "line", max: 120, default: T.title },
        { key: "lead", label: "Phrase d'accroche (en gras)", kind: "line", max: 200, default: ORGANISATION_LEAD },
        { key: "intro", label: "Présentation", kind: "text", max: 3000, rows: 8, default: ORGANISATION_INTRO.join("\n\n") },
        {
          key: "image",
          label: "Photo de fond",
          hint: "Une vraie photo de l'ONG, au format paysage.",
          kind: "image",
          default: PAGE_BACKDROPS.about,
        },
      ],
      elsewhere: [
        { label: "Adresse du siège (encadré « En bref ») : Paramètres → Coordonnées et réseaux", href: "/admin/parametres#coordonnees" },
      ],
    },
    {
      key: "historique",
      title: "Notre histoire",
      anchor: T.history.id,
      fields: [
        { ...LABEL, default: T.history.label },
        { ...TITLE, default: T.history.title },
        { key: "year", label: "Année de création", kind: "line", max: 20, default: String(FOUNDING_YEAR) },
        { key: "yearLabel", label: "Légende de l'année", kind: "line", max: 60, default: T.history.yearLabel },
        { key: "text", label: "Texte", kind: "text", max: 5000, rows: 8, default: HISTORY[0] },
        { key: "image", label: "Photo", kind: "image", default: REAL_PHOTOS.kitsGroup },
        { key: "timelineTitle", label: "Titre des repères", kind: "line", max: 120, default: "Quelques repères" },
        {
          key: "timeline",
          label: "Repères",
          itemLabel: "Repère",
          kind: "items",
          maxItems: 20,
          fields: [
            { key: "when", label: "Date", kind: "line", max: 40 },
            { key: "what", label: "Événement", kind: "line", max: 200 },
          ],
          default: TIMELINE,
        },
      ],
    },
    {
      key: "raison-d-etre",
      title: "Pourquoi INA-AFRICA existe",
      anchor: "raison-d-etre",
      fields: [
        { ...LABEL, default: "Contexte et raison d'être" },
        { ...TITLE, default: "Pourquoi INA-AFRICA existe" },
        { key: "lead", label: "Phrase d'accroche (en gras)", kind: "line", max: 200, default: ABOUT_CONTEXT.lead },
        { key: "text", label: "Texte", kind: "text", max: 5000, rows: 10, default: ABOUT_CONTEXT.paragraphs.join("\n\n") },
        { key: "audiencesTitle", label: "Titre des publics", kind: "line", max: 120, default: "Les publics accompagnés" },
        {
          key: "audiences",
          label: "Publics accompagnés",
          itemLabel: "Public",
          kind: "items",
          maxItems: 12,
          fields: [
            { key: "title", label: "Public", kind: "line", max: 120 },
            { key: "text", label: "Précision", kind: "text", max: 300 },
          ],
          default: AUDIENCES.map(({ title, text }) => ({ title, text })),
        },
        {
          key: "panelTitle",
          label: "Titre de l'encadré bleu",
          kind: "line",
          max: 120,
          default: "Depuis sa création, INA-AFRICA œuvre pour…",
        },
        {
          key: "panelItems",
          label: "Points de l'encadré bleu",
          itemLabel: "Point",
          kind: "list",
          max: 200,
          maxItems: 12,
          default: EXPERIENCE.fields,
        },
        {
          key: "panelNote",
          label: "Note sous l'encadré",
          kind: "line",
          max: 200,
          default: "Avec une approche participative et centrée sur l'impact à long terme.",
        },
      ],
    },
    {
      key: "vision",
      title: "Notre vision",
      anchor: T.vision.id,
      fields: [
        { ...LABEL, default: T.vision.label },
        { ...TITLE, default: T.vision.title },
        { key: "statement", label: "Vision (grande phrase)", kind: "text", max: 1000, rows: 4, default: VISION },
        { key: "explanationLead", label: "Accroche de l'explication (en gras)", kind: "line", max: 200, default: ABOUT_VISION.lead },
        { key: "explanation", label: "Explication", kind: "text", max: 3000, rows: 6, default: ABOUT_VISION.text },
      ],
    },
    {
      key: "missions",
      title: "Nos missions",
      anchor: T.missions.id,
      fields: [
        { ...LABEL, default: T.missions.label },
        { ...TITLE, default: T.missions.title },
        { key: "items", label: "Missions", itemLabel: "Mission", kind: "list", max: 500, maxItems: 8, default: MISSIONS },
      ],
      alsoOn: ["Accueil (section « Notre vision »)"],
    },
    {
      key: "objectifs",
      title: "Nos objectifs",
      anchor: T.objectives.id,
      fields: [
        { ...LABEL, default: T.objectives.label },
        { ...TITLE, default: T.objectives.title },
        { key: "items", label: "Objectifs", itemLabel: "Objectif", kind: "list", max: 500, maxItems: 12, default: OBJECTIVES },
      ],
    },
    {
      key: "valeurs",
      title: "Nos valeurs",
      description: "Section affichée seulement si au moins une valeur est saisie.",
      anchor: T.values.id,
      fields: [
        { ...LABEL, default: T.values.label },
        { ...TITLE, default: T.values.title },
        {
          key: "items",
          label: "Valeurs",
          itemLabel: "Valeur",
          kind: "items",
          maxItems: 9,
          fields: [
            { key: "term", label: "Valeur", kind: "line", max: 80 },
            { key: "description", label: "Explication (facultative)", kind: "text", max: 300 },
          ],
          default: [],
        },
      ],
    },
    {
      key: "approche",
      title: "Notre approche d'intervention",
      anchor: T.approach.id,
      fields: [
        { ...LABEL, default: T.approach.label },
        { ...TITLE, default: T.approach.title },
        { key: "intro", label: "Introduction", kind: "text", max: 600, rows: 3, default: T.approach.intro },
        { key: "items", label: "Moyens d'action", itemLabel: "Moyen d'action", kind: "list", max: 200, maxItems: 10, default: APPROACH },
      ],
    },
    {
      key: "gouvernance",
      title: "Gouvernance",
      anchor: "gouvernance",
      fields: [
        { ...LABEL, default: "Gouvernance" },
        { ...TITLE, default: "Une organisation structurée" },
        {
          key: "intro",
          label: "Introduction",
          kind: "text",
          max: 1500,
          rows: 5,
          default:
            "INA-AFRICA s'appuie sur des instances dirigeantes aux rôles clairement définis, garantissant une vision stratégique solide et un contrôle financier indépendant. Cette transparence institutionnelle assure la bonne gestion de chaque ressource mobilisée pour les enfants, les orphelins, les jeunes, les personnes en situation de handicap et les femmes vulnérables sur le terrain.",
        },
        {
          key: "items",
          label: "Instances",
          itemLabel: "Instance",
          kind: "items",
          maxItems: 8,
          fields: [
            { key: "title", label: "Nom de l'instance", kind: "line", max: 120 },
            { key: "text", label: "Rôle", kind: "text", max: 600 },
          ],
          default: GOVERNANCE.map(({ title, text }) => ({ title, text })),
        },
      ],
    },
    {
      key: "equipe",
      title: "L'équipe",
      description: "Titre et introduction de la section. Les membres (noms, postes, photos) se gèrent dans Équipe.",
      anchor: T.team.id,
      fields: [
        { ...LABEL, default: T.team.label },
        { ...TITLE, default: T.team.title },
        { key: "intro", label: "Introduction", kind: "text", max: 600, rows: 3, default: T.team.intro },
      ],
      records: "team",
    },
    {
      key: "rejoindre",
      title: "Pourquoi rejoindre INA-AFRICA ?",
      anchor: "rejoindre",
      fields: [
        { ...LABEL, default: "Nous rejoindre" },
        { ...TITLE, default: "Pourquoi rejoindre INA-AFRICA ?" },
        { key: "lead", label: "Phrase d'accroche (en gras)", kind: "line", max: 200, default: "Votre engagement, leur nouvel avenir." },
        {
          key: "text",
          label: "Texte",
          kind: "text",
          max: 1500,
          rows: 4,
          default:
            "Chacun a le pouvoir d'agir à sa mesure pour transformer durablement la vie des communautés. Que ce soit par un don, du bénévolat ou un partenariat, choisissez la forme d'engagement qui vous ressemble pour soutenir les enfants, les orphelins, les jeunes, les personnes en situation de handicap et les femmes vulnérables sur le terrain.",
        },
        {
          key: "options",
          label: "Les 3 façons de s'engager",
          hint: "Chaque carte mène à son formulaire (membre, bénévole, partenaire) : seuls les textes changent.",
          itemLabel: "Carte",
          kind: "items",
          fixed: true,
          maxItems: ENGAGEMENT_OPTIONS.length,
          fields: [
            { key: "title", label: "Titre", kind: "line", max: 80 },
            { key: "text", label: "Texte", kind: "text", max: 300 },
            { key: "action", label: "Texte du lien", kind: "line", max: 60 },
          ],
          default: ENGAGEMENT_OPTIONS.map(({ title, text, action }) => ({ title, text, action })),
        },
        {
          key: "reasons",
          label: "Bandeau des raisons",
          itemLabel: "Raison",
          kind: "items",
          maxItems: 6,
          fields: [
            { key: "title", label: "Titre", kind: "line", max: 80 },
            { key: "text", label: "Texte", kind: "text", max: 300 },
          ],
          default: JOIN_REASONS.map(({ title, text }) => ({ title, text })),
        },
      ],
      alsoOn: ["Accueil"],
    },
  ],
};
