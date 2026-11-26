import { DONATE_TEXT, FORM_TEXT } from "@/content/fr/forms";
import { PAGE_BACKDROPS } from "@/content/provisional-images";
import type { PageDef } from "@/lib/page-content/types";

import { image, line, text } from "./fields";

/** Pages « Faire un don », « Nos besoins », « Contact ». Ne jamais renommer une clé (mêmes clés que src/content/fr/forms.ts). */

const D = DONATE_TEXT;
const N = DONATE_TEXT.needs;
const C = FORM_TEXT.contact;

export const DONATE_PAGE: PageDef = {
  key: "faire-un-don",
  label: "Faire un don",
  path: "/faire-un-don",
  description: "Page de don : haut de page, formulaire, actions, autres façons d'agir.",
  sections: [
    {
      key: "en-tete",
      title: "Haut de la page",
      anchor: null,
      fields: [
        line("eyebrow", "Petit titre au-dessus", D.eyebrow, 60),
        line("title", "Titre de la page", D.title, 160),
        line("introLead", "Phrase d'accroche (en gras)", D.introLead, 300),
        text("intro", "Présentation", D.intro, 2000, 5),
        line("heroAction", "Bouton de don", D.heroAction, 60),
        line("allNeeds", "Bouton vers les besoins", D.campaigns.all, 60),
        image("image", "Photo de fond", PAGE_BACKDROPS.donate),
      ],
      elsewhere: [{ label: "Montants proposés, numéros Mobile Money : Paramètres → Dons", href: "/admin/parametres#dons" }],
    },
    {
      key: "formulaire",
      title: "Formulaire et actions",
      anchor: "votre-don",
      fields: [
        line("formTitle", "Titre du formulaire", D.formTitle, 120),
        text("formIntro", "Texte sous le titre", D.formIntro, 400, 2),
        line("proofTitle", "Titre « Ce que fait déjà INA-AFRICA »", D.proofTitle, 120),
        text("proofIntro", "Texte des actions", D.proofIntro, 400, 2),
        line("proofAction", "Lien vers les actions", D.proofAction, 60),
        line("otherTitle", "Titre « D'autres façons d'agir »", D.otherWays.title, 120),
        line("otherVolunteer", "Lien bénévole", D.otherWays.volunteer, 60),
        line("otherMember", "Lien membre", D.otherWays.member, 60),
        line("otherPartner", "Lien partenaire", D.otherWays.partner, 60),
      ],
    },
    {
      key: "besoins",
      title: "Nos besoins du moment",
      anchor: "don-appels",
      fields: [
        line("label", "Petit titre au-dessus", D.needs.eyebrow, 60),
        line("title", "Titre", D.campaigns.title, 160),
        text("intro", "Texte", D.campaigns.intro, 600, 2),
      ],
      elsewhere: [{ label: "Les besoins eux-mêmes : Appels aux dons", href: "/admin/appels-aux-dons" }],
    },
  ],
};

export const NEEDS_PAGE: PageDef = {
  key: "nos-besoins",
  label: "Nos besoins",
  path: "/nos-besoins",
  description: "Page des besoins (les besoins eux-mêmes se gèrent dans Appels aux dons).",
  sections: [
    {
      key: "en-tete",
      title: "Haut de la page",
      anchor: null,
      fields: [
        line("eyebrow", "Petit titre au-dessus", N.eyebrow, 60),
        line("title", "Titre de la page", N.title, 160),
        line("introLead", "Phrase d'accroche (en gras)", N.introLead, 300),
        text("intro", "Présentation", N.intro, 2000, 6),
        image("image", "Photo de fond", PAGE_BACKDROPS.needs),
      ],
      elsewhere: [{ label: "Les besoins eux-mêmes : Appels aux dons", href: "/admin/appels-aux-dons" }],
    },
    {
      key: "don-general",
      title: "Don général et page vide",
      anchor: null,
      fields: [
        line("generalTitle", "Encadré don général : titre", N.generalTitle, 160),
        text("generalText", "Encadré don général : texte", N.generalText, 400, 2),
        line("generalAction", "Encadré don général : bouton", N.generalAction, 60),
        line("emptyTitle", "Sans besoin publié : titre", N.emptyTitle, 160),
        text("emptyText", "Sans besoin publié : texte", N.emptyText, 600, 3),
        line("emptyAction", "Sans besoin publié : bouton", N.emptyAction, 60),
      ],
    },
  ],
};

export const CONTACT_PAGE: PageDef = {
  key: "contact",
  label: "Contact",
  path: "/contact",
  description: "Page de contact (coordonnées : Paramètres → Coordonnées et réseaux).",
  sections: [
    {
      key: "en-tete",
      title: "Haut de la page et encadrés",
      anchor: null,
      fields: [
        line("eyebrow", "Petit titre au-dessus", C.eyebrow, 60),
        line("title", "Titre de la page", C.title, 160),
        text("intro", "Présentation", C.intro, 1000, 3),
        line("formTitle", "Titre du formulaire", C.formTitle, 120),
        line("joinTitle", "Encadré « s'engager » : titre", C.joinTitle, 120),
        text("joinText", "Encadré « s'engager » : texte", C.joinText, 400, 2),
        line("joinAction", "Encadré « s'engager » : lien", C.joinAction, 60),
        image("image", "Photo de fond (facultative : sans photo, le logo de INA-AFRICA s'affiche)", null),
      ],
      elsewhere: [{ label: "Adresse, email, téléphone, WhatsApp : Paramètres → Coordonnées et réseaux", href: "/admin/parametres#coordonnees" }],
    },
  ],
};
