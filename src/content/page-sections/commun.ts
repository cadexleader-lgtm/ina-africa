import { HERO } from "@/content/fr/ina-africa";
import { PAGES } from "@/content/fr/pages";
import { T as SITE } from "@/content/fr/site";
import type { PageDef } from "@/lib/page-content/types";

import { line, text } from "./fields";

/**
 * Blocs présents sur plusieurs pages : bloc « Soutenir INA-AFRICA » en bas des
 * pages intérieures, pied de page. Ne jamais renommer une clé.
 */

const C = PAGES.callToAction;

export const COMMON_PAGE: PageDef = {
  key: "commun",
  label: "Blocs communs (bas de page, pied de page)",
  path: "/domaines",
  description: "Le bloc « Soutenir INA-AFRICA » en bas des pages intérieures, et le pied de page de tout le site.",
  sections: [
    {
      key: "soutenir",
      title: "Bloc « Soutenir INA-AFRICA »",
      description: "En bas des pages Domaines, Projets, Galerie, et de chaque domaine et projet.",
      anchor: "domaines-soutenir",
      fields: [
        line("donateTitle", "Titre", C.donateTitle, 120),
        text("donateText", "Texte", C.donateText, 600, 2),
        line("donateLink", "Bouton de don", C.donateLink, 40),
        line("joinLink", "Lien bénévole", C.joinLink, 60),
        line("areasTitle", "Carte « domaines » : titre", C.areasTitle, 120),
        text("areasText", "Carte « domaines » : texte", C.areasText, 400, 2),
        line("areasLink", "Carte « domaines » : lien", C.areasLink, 60),
        line("projectsTitle", "Carte « projets » : titre", C.projectsTitle, 120),
        text("projectsText", "Carte « projets » : texte", C.projectsText, 400, 2),
        line("projectsLink", "Carte « projets » : lien", C.projectsLink, 60),
      ],
    },
    {
      key: "pied-de-page",
      title: "Pied de page",
      description: "Bas de toutes les pages du site.",
      anchor: null,
      fields: [
        text("text", "Phrase de présentation (sous le logo)", HERO.text, 400, 3),
        line("contactTitle", "Titre des coordonnées (lu par les lecteurs d'écran)", SITE.footer.contactTitle, 60),
        line("socialTitle", "Titre des réseaux sociaux", SITE.footer.socialTitle, 60),
        line("navTitle", "Titre de la colonne « Navigation »", SITE.footer.navTitle, 60),
        line("joinTitle", "Titre de la colonne « Nous rejoindre »", SITE.footer.joinTitle, 60),
        line("areasTitle", "Titre de la colonne des domaines", SITE.footer.areasTitle, 60),
        line("rights", "Mention après le copyright", SITE.footer.rights, 120),
      ],
      elsewhere: [{ label: "Adresse, email, téléphone, WhatsApp, réseaux : Paramètres → Coordonnées et réseaux", href: "/admin/parametres#coordonnees" }],
    },
  ],
};
