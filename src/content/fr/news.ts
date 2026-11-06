/**
 * Textes d'INTERFACE des actualités, des pages légales et des pages d'erreur
 * (propriétaire : agent B2). Uniquement des libellés neutres : aucun article,
 * aucune date, aucun chiffre ni texte légal n'est écrit ici. Les contenus
 * viennent de l'administration (articles, paramètres du site).
 */

const NBSP = " ";

/** « texte » avec les espaces insécables du français. */
export function quote(text: string): string {
  return `«${NBSP}${text}${NBSP}»`;
}

export const NEWS_T = {
  list: {
    metaTitle: "Actualités",
    metaDescription:
      "Les actualités d'INA-AFRICA (Initiative pour un Nouvel Avenir en Afrique), ONG béninoise : nouvelles de l'association, de ses actions et de ses projets.",
    label: "Actualités",
    title: "La vie d'INA-AFRICA",
    intro: "Les nouvelles de l'ONG, de ses actions et de ses projets, publiées par l'équipe d'INA-AFRICA.",
    searchLabel: "Rechercher un article",
    searchPlaceholder: "Un mot, un sujet…",
    searchSubmit: "Rechercher",
    searchTooShort: `Saisissez au moins 2${NBSP}caractères pour lancer une recherche.`,
    categoriesLabel: "Catégories d'articles",
    categoriesTitle: "Catégories",
    allCategories: "Toutes",
    featured: "À la une",
    readArticle: "Lire l'article",
    moreTitle: "Autres actualités",
    resultsTitle: "Résultats",
    results: (count: number, query: string) =>
      `${count}${NBSP}${count > 1 ? "articles correspondent" : "article correspond"} à ${quote(query)}`,
    categoryCount: (count: number, name: string) =>
      `${count}${NBSP}${count > 1 ? "articles" : "article"} dans la catégorie ${quote(name)}`,
    clearSearch: "Effacer la recherche",
    emptyTitle: "Aucune actualité publiée pour le moment",
    emptyText: "Les nouvelles d'INA-AFRICA paraîtront ici dès leur publication.",
    emptyAction: "Découvrir INA-AFRICA",
    noResultsTitle: (query: string) => `Aucun article ne correspond à ${quote(query)}`,
    noResultsText: "Vérifiez l'orthographe ou essayez avec d'autres mots.",
    emptyCategoryTitle: "Aucun article dans cette catégorie pour le moment",
    emptyCategoryText: "Les articles de cette catégorie paraîtront ici dès leur publication.",
    unknownCategoryTitle: "Cette catégorie n'existe pas",
    unknownCategoryText: "Elle a peut-être été renommée ou retirée.",
    allNews: "Voir toutes les actualités",
    pageOutOfRangeTitle: "Cette page de résultats n'existe pas",
    pageOutOfRangeText: "La liste contient moins de pages.",
    firstPage: "Revenir à la première page",
    pageSuffix: (page: number) => ` (page ${page})`,
    searchMetaTitle: (query: string) => `Recherche ${quote(query)} dans les actualités`,
    categoryMetaTitle: (name: string) => `${name} — Actualités`,
    categoryMetaDescription: (name: string) => `Les actualités d'INA-AFRICA dans la catégorie ${quote(name)}.`,
    paginationLabel: "Pagination des actualités",
  },
  article: {
    home: "Accueil",
    news: "Actualités",
    publishedOn: "Publié le",
    updatedOn: "Mis à jour le",
    readingTime: (minutes: number) => `${minutes}${NBSP}min de lecture`,
    share: "Partager cet article",
    back: "Toutes les actualités",
    relatedLabel: "À lire aussi",
    relatedTitle: (category: string) => `Dans la catégorie ${quote(category)}`,
    seeCategory: "Voir la catégorie",
    noContent: "Le texte de cet article n'est pas encore disponible.",
    notFoundTitle: "Article introuvable",
  },
  legal: {
    label: "Informations légales",
    legalNotice: {
      title: "Mentions légales",
      description: "Mentions légales du site d'INA-AFRICA (Initiative pour un Nouvel Avenir en Afrique).",
    },
    privacyPolicy: {
      title: "Politique de confidentialité",
      description: "Politique de confidentialité du site d'INA-AFRICA (Initiative pour un Nouvel Avenir en Afrique).",
    },
    emptyTitle: "Ce contenu sera publié prochainement",
    emptyText: "INA-AFRICA prépare le texte de cette page. Pour toute question en attendant, vous pouvez nous écrire.",
    emptyAction: "Nous contacter",
    otherPage: `Voir aussi${NBSP}:`,
  },
  notFound: {
    metaTitle: "Page introuvable",
    label: "Erreur 404",
    title: "Cette page est introuvable",
    text: "L'adresse est peut-être mal saisie, ou la page a été déplacée ou retirée.",
    home: "Retour à l'accueil",
    linksTitle: "Pages utiles",
    searchTitle: "Chercher dans les actualités",
    links: [
      { href: "/a-propos", label: "À propos d'INA-AFRICA" },
      { href: "/domaines", label: "Nos domaines d'action" },
      { href: "/projets", label: "Nos projets" },
      { href: "/actualites", label: "Actualités" },
      { href: "/faire-un-don", label: "Faire un don" },
      { href: "/contact", label: "Contact" },
    ],
  },
  error: {
    title: "Cette page ne peut pas être affichée pour le moment",
    text: "Un problème est survenu de notre côté. Veuillez réessayer dans quelques instants.",
    retry: "Réessayer",
    home: "Retour à l'accueil",
  },
} as const;
