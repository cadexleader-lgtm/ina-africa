/**
 * PHOTOS D'ILLUSTRATION SOUS LICENCE LIBRE (Wikimedia Commons), prises au
 * Bénin. Elles illustrent les domaines d'action de l'ONG mais NE MONTRENT PAS
 * des actions de INA-AFRICA : toujours la mention « Photo d'illustration » et
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
  {
    path: "/images/illustrations/reboisement-natitingou.webp",
    alt: "Un périmètre de reboisement à Natitingou, au Bénin.",
    width: 1920,
    height: 1280,
    credit: {
      author: "Vitoyaovimariusmavy",
      ...CC_BY_SA_4,
      title: "Traversée de périmètre de reboisement de Natitingou 16",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Travers%C3%A9e_de_p%C3%A9rim%C3%A8tre_de_reboisement_de_Natitingou_16.jpg",
    },
  },
  {
    path: "/images/illustrations/inondation-cotonou.webp",
    alt: "Une rue inondée à Cotonou, au Bénin.",
    width: 960,
    height: 640,
    credit: {
      author: "Ganiath BELLO",
      ...CC_BY_SA_4,
      title: "Inondation à Cotonou",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Inondation_%C3%A0_Cotonou.jpg",
    },
  },
  {
    path: "/images/illustrations/couturiere-benin.webp",
    alt: "Une couturière béninoise à sa machine, dans son atelier.",
    width: 1920,
    height: 1280,
    credit: {
      author: "Megnon",
      ...CC_BY_SA_4,
      title: "Une couturière Béninoise",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Une_couturi%C3%A8re_B%C3%A9ninoise.jpg",
    },
  },
  {
    path: "/images/illustrations/apprenti-technicien.webp",
    alt: "Un jeune apprenti répare un téléphone dans un atelier à Cotonou.",
    width: 1920,
    height: 1280,
    credit: {
      author: "Adoscam",
      ...CC_BY_SA_4,
      title: "Un apprenti technicien en train de réparer un téléphone dans un centre à Cotonou",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Un_apprenti_technicien_en_train_de_r%C3%A9parer_un_t%C3%A9l%C3%A9phone_dans_un_centre_%C3%A0_Cotonou.jpg",
    },
  },
  {
    path: "/images/illustrations/femmes-gastronomie.webp",
    alt: "Des femmes commerçantes servent leurs clients sur un marché au Bénin.",
    width: 1920,
    height: 1280,
    credit: {
      author: "FiossifrejusduBénin",
      ...CC_BY_SA_4,
      title: "Les femmes et le bien être de la gastronomie. 04",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Les_femmes_et_le_bien_%C3%AAtre_de_la_gastronomie._04.jpg",
    },
  },
  {
    path: "/images/illustrations/ecolieres-jeux.webp",
    alt: "Des écolières béninoises jouent à un jeu traditionnel dans la cour de l'école.",
    width: 1920,
    height: 1280,
    credit: {
      author: "Domingo Daniella Rhode",
      ...CC_BY_SA_4,
      title: "Jeux de claquette par les écolières au BENIN",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Jeux_de_claquette_par_les_%C3%A9coli%C3%A8res_au_BENIN.jpg",
    },
  },
  {
    path: "/images/illustrations/fille-velo.webp",
    alt: "Une jeune fille à vélo dans une rue de Bohicon.",
    width: 1920,
    height: 1280,
    credit: {
      author: "GBETONGNINOUGBO Joseph Hervé Ahissou",
      ...CC_BY_SA_4,
      title: "Fille vélo Bohicon",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Fille_v%C3%A9lo_Bohicon.jpg",
    },
  },
  {
    path: "/images/illustrations/sport-handicap.webp",
    alt: "Des joueuses de basket en fauteuil roulant pendant un match au Bénin.",
    width: 1920,
    height: 1375,
    credit: {
      author: "DEGAN Gabin",
      ...CC_BY_SA_4,
      title: "DEGAN Gabin ( disabled sports)",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:DEGAN_Gabin_%28_disabled_sports%29.jpg",
    },
  },
  {
    path: "/images/illustrations/femmes-cuisine.webp",
    alt: "Une commerçante souriante à son étal, sur un marché du Bénin.",
    width: 1600,
    height: 1750,
    credit: {
      author: "FiossifrejusduBénin",
      ...CC_BY_SA_4,
      title: "Les femmes et le bien être de la gastronomie. 05",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Les_femmes_et_le_bien_%C3%AAtre_de_la_gastronomie._05.jpg",
    },
  },
];

/** « Auteur, licence » pour une légende courte. */
export function shortCredit(illustration: Illustration): string {
  return `${illustration.credit.author}, ${illustration.credit.license}`;
}
