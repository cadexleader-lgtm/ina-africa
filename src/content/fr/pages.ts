/**
 * Textes d'INTERFACE des pages institutionnelles et de projets : À propos,
 * Domaines d'action, Projets, Galerie. Propriétaire : agent B1.
 *
 * Règle : uniquement des libellés neutres. Les textes de l'ONG (historique,
 * vision, missions, objectifs, valeurs, moyens d'action, descriptions des
 * domaines et des projets) viennent de l'administration (src/server/data/)
 * et ne sont JAMAIS écrits ici. Aucun chiffre, résultat ni témoignage.
 */

/**
 * Seul fait daté vérifié (docs/frontend-plan.md §2.1, statuts et document de
 * présentation de l'ONG) : INA-AFRICA a été créée en 2017.
 */
export const FOUNDING_YEAR = 2017;

export const PAGES = {
  common: {
    home: "Accueil",
    onThisPage: "Sur cette page",
    illustration: "Photo d'illustration",
    donate: "Faire un don",
  },

  callToAction: {
    areasTitle: "Nos domaines d'action",
    areasText: "Découvrez les domaines dans lesquels INA-AFRICA intervient.",
    areasLink: "Voir les domaines d'action",
    projectsTitle: "Nos projets",
    projectsText: "Découvrez les projets et actions d'INA-AFRICA.",
    projectsLink: "Voir les projets",
    donateTitle: "Soutenir INA-AFRICA",
    donateText: "Votre don permet à l'ONG de poursuivre ses actions.",
    donateLink: "Faire un don",
    joinLink: "Devenir bénévole",
  },

  about: {
    metaTitle: "À propos",
    metaDescription: "Présentation de l'ONG INA-AFRICA (Initiative pour un Nouvel Avenir en Afrique) : historique, vision, missions, objectifs et approche d'intervention.",
    label: "À propos",
    title: "Qui sommes-nous ?",
    intro: "INA-AFRICA, Initiative pour un Nouvel Avenir en Afrique, est une organisation non gouvernementale béninoise.",
    factsTitle: "En bref",
    factName: "Nom complet",
    factFounded: "Création",
    factAreas: "Domaines d'action",
    factAddress: "Siège",
    history: { id: "historique", nav: "Historique", label: "Historique", title: "Notre histoire", yearLabel: "Année de création" },
    vision: { id: "vision", nav: "Vision", label: "Notre vision", title: "Notre vision" },
    missions: { id: "missions", nav: "Missions", label: "Ce qui nous anime", title: "Nos missions" },
    objectives: { id: "objectifs", nav: "Objectifs", label: "Ce que nous visons", title: "Nos objectifs" },
    values: { id: "valeurs", nav: "Valeurs", label: "Ce qui nous guide", title: "Nos valeurs" },
    approach: {
      id: "approche",
      nav: "Approche",
      label: "Comment nous agissons",
      title: "Notre approche d'intervention",
      intro: "Pour atteindre ses objectifs, INA-AFRICA s'appuie sur les moyens d'action suivants.",
    },
    team: {
      id: "equipe",
      nav: "Équipe",
      label: "Les personnes",
      title: "L'équipe",
      intro: "Les membres des instances dirigeantes et de contrôle d'INA-AFRICA.",
      portrait: "Portrait de",
    },
    emptyTitle: "La présentation détaillée arrive bientôt",
    emptyText: "L'historique, la vision et les missions d'INA-AFRICA seront présentés ici dès leur publication.",
  },

  areas: {
    metaTitle: "Nos domaines d'action",
    metaDescription: "Les domaines dans lesquels l'ONG INA-AFRICA intervient au Bénin.",
    label: "Ce que nous faisons",
    title: "Nos domaines d'action",
    intro: "Découvrez les domaines dans lesquels INA-AFRICA intervient et les projets qui s'y rattachent.",
    listLabel: "Liste des domaines d'action",
    allProjects: "Voir tous nos projets",
    emptyTitle: "Les domaines d'action seront bientôt présentés",
    emptyText: "Cette page présentera les domaines d'intervention d'INA-AFRICA dès leur publication.",
    count: (n: number) => (n > 1 ? `${n} domaines d'action` : `${n} domaine d'action`),
  },

  area: {
    label: "Domaine d'action",
    descriptionTitle: "Présentation",
    noDescriptionTitle: "Présentation à venir",
    noDescriptionText: "La présentation détaillée de ce domaine sera publiée prochainement.",
    actionsLabel: "Sur le terrain",
    actionsTitle: "Actions associées",
    actionsEmptyTitle: "Aucune action publiée pour ce domaine pour le moment",
    actionsEmptyText: "Les projets d'INA-AFRICA liés à ce domaine seront présentés ici dès leur publication.",
    actionsEmptyLink: "Voir tous nos projets",
    actionsAll: "Tous les projets de ce domaine",
    othersTitle: "Autres domaines d'action",
    back: "Tous les domaines d'action",
    metaDescription: (title: string) => `${title} : domaine d'action de l'ONG INA-AFRICA au Bénin.`,
    notFoundTitle: "Ce domaine d'action est introuvable",
    notFoundText: "Il n'existe pas, ou n'est pas encore publié.",
  },

  projects: {
    metaTitle: "Nos projets",
    metaDescription: "Les projets et actions de l'ONG INA-AFRICA, par domaine d'action et par état d'avancement.",
    label: "Nos projets",
    title: "Nos projets et actions",
    intro: "Parcourez les projets d'INA-AFRICA par domaine d'action et par état d'avancement.",
    filtersLabel: "Filtrer les projets",
    areaFilter: "Domaine d'action",
    statusFilter: "État d'avancement",
    all: "Tous",
    allAreas: "Tous les domaines",
    allStatuses: "Tous les états",
    apply: "Appliquer",
    clear: "Effacer les filtres",
    activeFilters: "Filtres actifs",
    removeFilter: "Retirer le filtre",
    count: (n: number) => (n === 0 ? "Aucun projet" : n > 1 ? `${n} projets` : "1 projet"),
    emptyTitle: "Aucun projet publié pour le moment",
    emptyText: "Les projets d'INA-AFRICA seront présentés ici dès leur publication.",
    emptyLink: "Découvrir nos domaines d'action",
    noResultTitle: "Aucun projet ne correspond à ces filtres",
    noResultText: "Essayez un autre domaine ou un autre état d'avancement.",
    pageMissingTitle: "Cette page de résultats n'existe pas",
    pageMissingText: "La liste contient moins de pages.",
    pageMissingLink: "Revenir à la première page",
    pagination: "Pages des projets",
  },

  project: {
    /** Libellés des états (paramètre d'adresse ?statut=). */
    status: { planned: "À venir", ongoing: "En cours", completed: "Terminé" },
    factsTitle: "Le projet en bref",
    area: "Domaine",
    status_: "État",
    location: "Lieu",
    period: "Période",
    contentTitle: "Présentation du projet",
    share: "Partager ce projet",
    noContent: "La présentation détaillée de ce projet sera publiée prochainement.",
    galleryLabel: "En images",
    galleryTitle: "Photos et vidéos du projet",
    othersTitle: "Autres projets du domaine",
    back: "Tous les projets",
    notFoundTitle: "Ce projet est introuvable",
    notFoundText: "Il n'existe pas, ou n'est pas encore publié.",
  },

  gallery: {
    metaTitle: "Galerie",
    metaDescription: "Photos et vidéos publiées par l'ONG INA-AFRICA.",
    label: "Galerie",
    title: "Galerie photos et vidéos",
    intro: "Les photos et vidéos publiées par INA-AFRICA.",
    count: (n: number) => (n > 1 ? `${n} photos et vidéos` : `${n} photo ou vidéo`),
    emptyTitle: "Aucune photo ni vidéo publiée pour le moment",
    emptyText: "Les photos et vidéos d'INA-AFRICA seront présentées ici dès leur publication.",
    emptyLink: "Découvrir nos projets",
    pageMissingTitle: "Cette page de la galerie n'existe pas",
    pageMissingText: "La galerie contient moins de pages.",
    pageMissingLink: "Revenir à la première page",
    pagination: "Pages de la galerie",
  },

  viewer: {
    dialogLabel: "Visionneuse",
    openPhoto: "Agrandir la photo",
    openVideo: "Lire la vidéo",
    video: "Vidéo",
    previous: "Élément précédent",
    next: "Élément suivant",
    close: "Fermer la visionneuse",
    position: (index: number, total: number) => `${index} sur ${total}`,
    photo: "Photo",
    hint: "Flèches gauche et droite pour naviguer, Échap pour fermer.",
  },

  period: {
    range: (start: string, end: string) => `Du ${start} au ${end}`,
    since: (start: string) => `Depuis le ${start}`,
    from: (start: string) => `À partir du ${start}`,
    until: (end: string) => `Jusqu'au ${end}`,
  },
} as const;
