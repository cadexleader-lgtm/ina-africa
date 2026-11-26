import type { ImageRef } from "@/lib/types/content";

/**
 * VRAIES PHOTOS DES ACTIONS DE INA-AFRICA, transmises par l'ONG (20/11/2026).
 * Fichiers : public/images/actions/<date>-<action>/photo-NN.webp (2000 px) et
 * photo-NN-sm.webp (800 px), sans métadonnées, logo de l'ONG préservé.
 *
 * Elles servent :
 *  - aux cartes des actions (couverture + visionneuse), dans l'ordre ci-dessous ;
 *  - d'illustrations du site (en-têtes de pages, domaines, accueil) à la place
 *    des photos provisoires, sans la mention « Photo d'illustration » : ce sont
 *    de vraies photos de l'ONG. Le texte alternatif dit ce qu'elles montrent.
 */

function photos(dir: string, list: [file: string, alt: string][]): ImageRef[] {
  return list.map(([file, alt]) => ({ path: `/images/actions/${dir}/${file}.webp`, alt }));
}

/** Lancement officiel des activités, 26 août 2023 (distribution aux femmes vulnérables). */
export const LAUNCH_2023_PHOTOS = photos("2023-08-26-lancement", [
  ["photo-03", "Les bénéficiaires et l'équipe de INA-AFRICA devant les sacs de riz et les paniers de vivres distribués lors du lancement des activités, le 26 août 2023"],
  ["photo-06", "Des femmes bénéficiaires, enveloppe en main, devant les vivres qui leur sont remis"],
  ["photo-01", "Une bénéficiaire reçoit une enveloppe et un panier de vivres des mains d'une représentante de INA-AFRICA"],
  ["photo-02", "Des membres de l'équipe de INA-AFRICA, en tenue aux couleurs de l'ONG, le jour du lancement"],
  ["photo-04", "Remise d'un panier de vivres à une bénéficiaire pendant la cérémonie"],
  ["photo-05", "Remise de vivres à une bénéficiaire, devant les paniers et les sacs de riz"],
  ["photo-07", "Une bénéficiaire reçoit un panier de vivres et une enveloppe"],
  ["photo-10", "Lecture d'un message devant les bénéficiaires pendant la cérémonie de lancement"],
  ["photo-11", "Des bénéficiaires en tee-shirt et casquette INA-AFRICA, pouce levé"],
  ["photo-09", "Un membre de INA-AFRICA répond aux questions de la presse lors du lancement"],
  ["photo-08", "L'équipe de INA-AFRICA et des bénéficiaires devant le Centre de promotion sociale de Sainte-Cécile"],
]);

/** Distribution de kits scolaires dans trois écoles, 26 septembre 2025. */
export const SCHOOL_KITS_2025_PHOTOS = photos("2025-09-26-kits-scolaires", [
  ["photo-03", "Des élèves avec leurs nouveaux sacs scolaires, entourés de l'équipe de INA-AFRICA, lors de la distribution du 26 septembre 2025"],
  ["photo-01", "Des élèves en classe présentent les sacs scolaires reçus, en présence d'une autorité traditionnelle"],
  ["photo-13", "Une élève reçoit un sac scolaire des mains d'un membre de INA-AFRICA"],
  ["photo-16", "Un membre de INA-AFRICA remet des sacs scolaires à des enfants"],
  ["photo-15", "Une jeune élève tient son nouveau sac scolaire en classe"],
  ["photo-06", "Les élèves et l'équipe de INA-AFRICA devant l'école, avec les fournitures à distribuer"],
  ["photo-12", "Les élèves d'une autre école avec leurs sacs scolaires et l'équipe de INA-AFRICA"],
  ["photo-14", "Des bénévoles de INA-AFRICA préparent les kits : sacs, cahiers et stylos"],
  ["photo-09", "Une pile de sacs scolaires prêts à être distribués"],
  ["photo-11", "L'équipe de INA-AFRICA et des personnalités locales lors de la distribution"],
  ["photo-08", "L'équipe de INA-AFRICA échange avec les enseignants et les parents"],
  ["photo-17", "Le complexe scolaire Amour de Dieu, à Abomey-Calavi, l'une des trois écoles"],
  ["photo-02", "Un membre de INA-AFRICA devant la bannière de l'ONG"],
  ["photo-05", "Un intervenant prend la parole devant la bannière de INA-AFRICA"],
  ["photo-04", "Les élèves et l'équipe de INA-AFRICA devant la classe de CE1"],
  ["photo-07", "Les élèves réunis devant l'école, puis découvrant leurs nouveaux sacs en classe"],
  ["photo-10", "L'une des salles de classe des écoles visitées"],
  ["photo-18", "Arrivée de l'équipe de INA-AFRICA à l'école"],
]);

/** Distribution de kits vestimentaires (sous-vêtements) aux femmes vulnérables, Tanmey (Zinvié), 21 mars 2026. */
export const CLOTHING_KITS_2026_PHOTOS = photos("2026-03-21-kits-vestimentaires", [
  ["photo-07", "Les femmes bénéficiaires et l'équipe de INA-AFRICA devant le hangar, à Tanmey (Zinvié), le 21 mars 2026"],
  ["photo-01", "Une bénévole de INA-AFRICA parmi les femmes réunies pour la distribution"],
  ["photo-06", "Une membre de INA-AFRICA guide les bénéficiaires, leur kit à la main"],
  ["photo-05", "Une bénévole de INA-AFRICA au milieu des femmes rassemblées"],
  ["photo-10", "L'équipe de INA-AFRICA organise la distribution des kits"],
  ["photo-02", "Les femmes repartent avec leur kit après la distribution"],
  ["photo-09", "Les bénéficiaires, leur kit à la main, avec l'équipe de INA-AFRICA"],
  ["photo-11", "Photo de groupe des bénéficiaires et de l'équipe de INA-AFRICA"],
  ["photo-03", "Des bénévoles de INA-AFRICA avec des personnalités locales de Tanmey"],
  ["photo-08", "L'équipe de INA-AFRICA et des personnalités locales, sourire aux lèvres"],
  ["photo-04", "L'équipe de INA-AFRICA avec des personnalités locales du village"],
]);

function pick(list: ImageRef[], file: string): ImageRef {
  const found = list.find((photo) => photo.path.endsWith(`/${file}.webp`));
  if (!found) throw new Error(`Photo introuvable : ${file}`);
  return found;
}

/** Photos choisies pour illustrer le site (une par emplacement). */
export const REAL_PHOTOS = {
  kitsGroup: pick(SCHOOL_KITS_2025_PHOTOS, "photo-03"),
  kitsClassroom: pick(SCHOOL_KITS_2025_PHOTOS, "photo-01"),
  kitsGirlBackpack: pick(SCHOOL_KITS_2025_PHOTOS, "photo-13"),
  kitsHandOver: pick(SCHOOL_KITS_2025_PHOTOS, "photo-16"),
  kitsGirlClass: pick(SCHOOL_KITS_2025_PHOTOS, "photo-15"),
  kitsSchoolFront: pick(SCHOOL_KITS_2025_PHOTOS, "photo-06"),
  kitsOtherSchool: pick(SCHOOL_KITS_2025_PHOTOS, "photo-12"),
  kitsVolunteers: pick(SCHOOL_KITS_2025_PHOTOS, "photo-14"),
  kitsTeam: pick(SCHOOL_KITS_2025_PHOTOS, "photo-11"),
  kitsExchange: pick(SCHOOL_KITS_2025_PHOTOS, "photo-08"),
  clothingGroup: pick(CLOTHING_KITS_2026_PHOTOS, "photo-07"),
  clothingWomen: pick(CLOTHING_KITS_2026_PHOTOS, "photo-06"),
  clothingTeam: pick(CLOTHING_KITS_2026_PHOTOS, "photo-03"),
  launchGroup: pick(LAUNCH_2023_PHOTOS, "photo-03"),
  launchWomen: pick(LAUNCH_2023_PHOTOS, "photo-06"),
  launchTeam: pick(LAUNCH_2023_PHOTOS, "photo-02"),
  launchThumbsUp: pick(LAUNCH_2023_PHOTOS, "photo-11"),
  launchSpeech: pick(LAUNCH_2023_PHOTOS, "photo-10"),
} as const;
