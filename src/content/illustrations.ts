/**
 * PHOTOS D'ILLUSTRATION SOUS LICENCE LIBRE (Wikimedia Commons), prises au
 * Bénin. Elles illustrent les domaines d'action de l'ONG mais NE MONTRENT PAS
 * des actions d'INA-AFRICA : toujours la mention « Photo d'illustration » et
 * le crédit de l'auteur (obligatoire pour les licences CC BY / CC BY-SA),
 * détaillé sur la page /credits-photos. À compléter puis remplacer par les
 * vraies photos de l'ONG.
 */

export type Illustration = {
  /** Fichier local WebP (960 px) ; une version `-sm.webp` (640 px) existe. */
  path: string;
  alt: string;
  width: number;
  height: number;
  credit: {
    author: string;
    license: string;
    /** Adresse de la licence (vide pour le domaine public). */
    licenseUrl?: string;
    /** Page de la photo sur Wikimedia Commons. */
    sourceUrl: string;
    title: string;
  };
};

const CC_BY_SA_4 = { license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/deed.fr" };

export const ILLUSTRATIONS: Illustration[] = [
  {
    path: "/images/illustrations/eleves-lecture.webp",
    alt: "Des élèves béninois lisent un document en classe.",
    width: 960,
    height: 638,
    credit: {
      author: "DEGAN Gabin",
      ...CC_BY_SA_4,
      title: "DEGAN Gabin ( schoolchildren )",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:DEGAN_Gabin_(_schoolchildren_).jpg",
    },
  },
  {
    path: "/images/illustrations/femmes-cotonou.webp",
    alt: "Des femmes réunies lors d'une rencontre à Cotonou.",
    width: 960,
    height: 659,
    credit: {
      author: "MVN",
      license: "CC BY 2.0",
      licenseUrl: "https://creativecommons.org/licenses/by/2.0/deed.fr",
      title: "Cotonouwomen",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Cotonouwomen.jpg",
    },
  },
  {
    path: "/images/illustrations/chemin-ecole.webp",
    alt: "Des enfants en uniforme marchent vers l'école.",
    width: 960,
    height: 708,
    credit: {
      author: "DEGAN Gabin",
      ...CC_BY_SA_4,
      title: "DEGAN Gabin -( school children on their way to school )",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:DEGAN_Gabin_-(_school_children_on_their_way_to_school_).jpg",
    },
  },
  {
    path: "/images/illustrations/alphabetisation.webp",
    alt: "Une séance d'alphabétisation en plein air devant une école.",
    width: 960,
    height: 720,
    credit: {
      author: "Bassilois",
      ...CC_BY_SA_4,
      title: "Modern literacy methods",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Modern_literacy_methods.jpg",
    },
  },
  {
    path: "/images/illustrations/egalite-femme-moto.webp",
    alt: "Une femme conduit sa moto dans une rue du Bénin.",
    width: 960,
    height: 717,
    credit: {
      author: "Joseph Hervé Ahissou Gbetongninougbo",
      ...CC_BY_SA_4,
      title: "Ageless Equity",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Ageless_Equity.jpg",
    },
  },
  {
    path: "/images/illustrations/nouvelles-classes.webp",
    alt: "Des enfants applaudissent dans une nouvelle salle de classe.",
    width: 960,
    height: 639,
    credit: {
      author: "MSgt Michael Q. Retana, USMC",
      license: "Domaine public",
      title: "Children in Wanrarou, Benin 2009-06-17",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Children_in_Wanrarou,_Benin_2009-06-17.JPG",
    },
  },
];

/** « Auteur, licence » pour une légende courte. */
export function shortCredit(illustration: Illustration): string {
  return `${illustration.credit.author}, ${illustration.credit.license}`;
}
