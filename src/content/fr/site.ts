/**
 * Textes d'INTERFACE du site public (en-tête, pied de page, accueil, composants
 * communs). Propriétaire : agent A (design system). Les autres agents ont
 * leurs propres fichiers dans src/content/fr/.
 *
 * Règle : uniquement des libellés neutres (« Faire un don », « Lire la suite »…).
 * Les textes de l'ONG (mission, vision, historique…) viennent de
 * getSiteSettings() et ne sont JAMAIS écrits ici.
 */

export const ORG = {
  name: "INA-AFRICA",
  fullName: "Initiative pour un Nouvel Avenir en Afrique",
} as const;

export type NavItem = { href: string; label: string };

/** Navigation principale (en-tête et menu mobile), dans l'ordre du cahier des charges. */
export const MAIN_NAV: NavItem[] = [
  { href: "/", label: "Accueil" },
  { href: "/a-propos", label: "À propos" },
  { href: "/domaines", label: "Nos domaines d'action" },
  { href: "/projets", label: "Nos projets" },
  { href: "/actualites", label: "Actualités" },
  { href: "/contact", label: "Contact" },
];

export const DONATE_LINK: NavItem = { href: "/faire-un-don", label: "Faire un don" };

/** Navigation de l'en-tête sur ordinateur (le logo mène à l'accueil). */
export const DESKTOP_NAV: NavItem[] = [
  { href: "/a-propos", label: "À propos" },
  { href: "/domaines", label: "Domaines d'action" },
  { href: "/projets", label: "Projets" },
  { href: "/actualites", label: "Actualités" },
  { href: "/contact", label: "Contact" },
];

/** Menu « Agir avec nous » de l'en-tête et du menu mobile. */
export const ENGAGE_NAV: (NavItem & { description: string })[] = [
  { href: "/nous-rejoindre/membre", label: "Devenir membre", description: "Participer à la vie de l'organisation" },
  { href: "/nous-rejoindre/benevole", label: "Devenir bénévole", description: "Donner de son temps et de ses compétences" },
  { href: "/nous-rejoindre/partenaire", label: "Devenir partenaire", description: "Soutenir et construire des collaborations" },
  { href: "/faire-un-don", label: "Faire un don", description: "Financer les actions sur le terrain" },
];

/** Liens « Nous rejoindre » (appel à l'action, pied de page). */
export const JOIN_NAV: NavItem[] = [
  { href: "/nous-rejoindre/benevole", label: "Devenir bénévole" },
  { href: "/nous-rejoindre/membre", label: "Devenir membre" },
  { href: "/nous-rejoindre/partenaire", label: "Devenir partenaire" },
  { href: "/faire-un-don", label: "Faire un don" },
];

/** Navigation secondaire du pied de page. */
export const FOOTER_NAV: NavItem[] = [
  { href: "/a-propos", label: "À propos" },
  { href: "/domaines", label: "Nos domaines d'action" },
  { href: "/projets", label: "Nos projets" },
  { href: "/actualites", label: "Actualités" },
  { href: "/galerie", label: "Galerie" },
  { href: "/contact", label: "Contact" },
];

export const LEGAL_NAV: NavItem[] = [
  { href: "/mentions-legales", label: "Mentions légales" },
  { href: "/politique-de-confidentialite", label: "Politique de confidentialité" },
  { href: "/credits-photos", label: "Crédits photos" },
];

/** Noms affichés des réseaux sociaux (clé de site_settings.social_links → libellé). */
export const SOCIAL_LABELS: Record<string, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  youtube: "YouTube",
  x: "X",
  twitter: "X",
  tiktok: "TikTok",
  whatsapp: "WhatsApp",
};

export const T = {
  a11y: {
    skipToContent: "Aller au contenu",
    mainNav: "Navigation principale",
    footerNav: "Navigation du pied de page",
    legalNav: "Informations légales",
    openMenu: "Ouvrir le menu",
    closeMenu: "Fermer le menu",
    menuTitle: "Menu",
    home: "Accueil INA-AFRICA",
    newTab: "(s'ouvre dans un nouvel onglet)",
    breadcrumbs: "Fil d'Ariane",
    pagination: "Pagination",
    loading: "Chargement en cours…",
    close: "Fermer",
    playVideo: "Lire la vidéo",
  },
  devPreview: "Aperçu de développement : Supabase non configuré, contenus de départ uniquement.",
  topBar: {
    label: "Coordonnées et réseaux sociaux",
    email: "Email",
    phone: "Téléphone",
  },
  footer: {
    navTitle: "Navigation",
    joinTitle: "Nous rejoindre",
    areasTitle: "Domaines d'intervention",
    contactTitle: "Coordonnées",
    socialTitle: "Suivez-nous",
    whatsapp: "WhatsApp",
    rights: "Tous droits réservés.",
  },
  actions: {
    readMore: "Lire la suite",
    discover: "Découvrir",
    discoverProject: "Découvrir le projet",
    discoverArea: "Découvrir ce domaine",
    learnMore: "En savoir plus",
    previous: "Précédent",
    next: "Suivant",
    page: "Page",
    retry: "Réessayer",
  },
  provisionalNote: "Photo d'illustration",
  project: {
    status: {
      planned: "À venir",
      ongoing: "En cours",
      completed: "Terminé",
      archived: "Archivé",
    },
  },
  home: {
    metaTitle: "INA-AFRICA — Initiative pour un Nouvel Avenir en Afrique",
    hero: {
      primary: "Découvrir notre organisation",
      secondary: "Rejoindre INA-AFRICA",
    },
    about: {
      label: "À propos",
      title: "Qui sommes-nous\u00a0?",
      visionTitle: "Notre vision",
      more: "En savoir plus sur INA-AFRICA",
    },
    areas: {
      label: "Ce que nous faisons",
      title: "Nos domaines d'intervention",
      all: "Tous nos domaines d'action",
    },
    projects: {
      label: "Nos projets",
      title: "Nos projets et actions",
      all: "Voir tous nos projets",
      emptyTitle: "Aucun projet publié pour le moment",
      emptyText: "Les projets d'INA-AFRICA seront présentés ici dès leur publication.",
      emptyAction: "Découvrir nos domaines d'action",
    },
    impact: {
      label: "Notre impact humain",
      action: "Découvrir nos projets",
    },
    news: {
      label: "Actualités",
      title: "Dernières actualités",
      all: "Toutes les actualités",
      emptyTitle: "Aucune actualité publiée pour le moment",
      emptyText: "Les nouvelles de l'ONG paraîtront ici.",
    },
    cta: {
      title: "Agir avec INA-AFRICA",
      text: "Faites un don, devenez bénévole ou partenaire de l'ONG.",
      donate: "Faire un don",
      volunteer: "Devenir bénévole",
      partner: "Devenir partenaire",
    },
    partners: {
      label: "Partenaires et sponsors",
      title: "Ils accompagnent INA-AFRICA",
    },
  },
} as const;
