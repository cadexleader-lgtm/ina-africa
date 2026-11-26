import { FORM_TEXT } from "@/content/fr/forms";
import { JOIN_REASONS, MEMBER_PARTICIPATION, VISION } from "@/content/fr/ina-africa";
import { PAGE_BACKDROPS } from "@/content/provisional-images";
import type { PageDef } from "@/lib/page-content/types";

import { cards, headerSection, image, label, line, list, text, title } from "./fields";

/** Pages « Nous rejoindre » (/nous-rejoindre et ses 3 formulaires). Ne jamais renommer une clé. */

const J = FORM_TEXT.join;
const V = FORM_TEXT.volunteer;
const M = FORM_TEXT.member;
const P = FORM_TEXT.partner;

export const JOIN_PATH_KEYS = ["volunteer", "member", "partner"] as const;

export const JOIN_PAGE: PageDef = {
  key: "nous-rejoindre",
  label: "Nous rejoindre (et ses 3 formulaires)",
  path: "/nous-rejoindre",
  description: "Page des trois façons de s'engager, puis les pages Devenir bénévole, Devenir membre et Devenir partenaire.",
  sections: [
    headerSection({ label: J.eyebrow, title: J.title, intro: J.intro, image: PAGE_BACKDROPS.join }),
    {
      key: "parcours",
      title: "Les trois façons de s'engager",
      anchor: "rejoindre-parcours",
      fields: [
        {
          key: "paths",
          label: "Cartes",
          hint: "Chaque carte mène à son formulaire : seuls les textes changent.",
          itemLabel: "Carte",
          kind: "items",
          fixed: true,
          keys: [...JOIN_PATH_KEYS],
          maxItems: 3,
          fields: [
            { key: "title", label: "Titre", kind: "line", max: 80 },
            { key: "text", label: "Texte", kind: "text", max: 400 },
            { key: "action", label: "Texte du lien", kind: "line", max: 60 },
          ],
          default: JOIN_PATH_KEYS.map((key) => ({ ...J[key] })),
        },
        line("formLength", "Mention sous chaque carte", J.formLength, 60),
      ],
    },
    {
      key: "don",
      title: "Vous préférez soutenir financièrement ?",
      anchor: "rejoindre-parcours",
      fields: [
        title(J.donateTitle),
        text("donateText", "Texte", J.donateText, 600, 2),
        line("donateAction", "Bouton de don", J.donateAction, 40),
        line("contactAction", "Lien vers le contact", J.contactAction, 80),
      ],
    },
    {
      key: "benevole",
      title: "Page « Devenir bénévole »",
      anchor: null,
      path: "/nous-rejoindre/benevole",
      fields: [
        title(V.title, "Titre de la page"),
        text("intro", "Présentation", V.intro, 1500, 3),
        line("formTitle", "Titre du formulaire", V.formTitle, 120),
        image("image", "Photo de fond", PAGE_BACKDROPS.volunteer),
      ],
    },
    {
      key: "membre",
      title: "Page « Devenir membre » : haut et formulaire",
      anchor: null,
      path: "/nous-rejoindre/membre",
      fields: [
        title(M.title, "Titre de la page"),
        text("intro", "Présentation", M.intro, 1500, 3),
        line("formTitle", "Titre du formulaire", M.formTitle, 120),
        text("conditionsNote", "Note sous le titre du formulaire", M.conditionsNote, 400, 2),
        image("image", "Photo de fond", PAGE_BACKDROPS.member),
      ],
    },
    {
      key: "adhesion",
      title: "Page « Devenir membre » : pourquoi devenir membre",
      anchor: "adhesion-pourquoi",
      path: "/nous-rejoindre/membre",
      fields: [
        label("L'adhésion"),
        title("Pourquoi devenir membre ?"),
        text(
          "intro",
          "Introduction",
          "Devenir membre, c'est rejoindre une organisation qui œuvre pour un nouvel avenir en Afrique et participer à sa vie et à ses initiatives, aux côtés de ses instances.",
          1000,
          3,
        ),
        line("visionLabel", "Titre de la citation", "La vision que vous partagez", 120),
        text("vision", "Citation (vision)", VISION, 1000, 3),
        cards("reasons", "Raisons", "Raison", JOIN_REASONS, { maxItems: 6, textMax: 400 }),
        line("participateTitle", "Titre « Comment participer »", "Comment participer", 120),
        text(
          "participateIntro",
          "Introduction « Comment participer »",
          "Les membres peuvent contribuer aux moyens d'action de l'ONG, selon leurs disponibilités et leurs compétences :",
          400,
          2,
        ),
        list("participate", "Façons de participer", "Façon de participer", MEMBER_PARTICIPATION, 200, 10),
        line("stepsTitle", "Titre « La démarche »", "La démarche", 120),
        list(
          "steps",
          "Étapes de la démarche",
          "Étape",
          [
            "Vous remplissez le formulaire de demande d'adhésion ci-dessous.",
            "Votre demande est étudiée par l'organisation.",
            "L'équipe vous contacte pour vous présenter les conditions d'adhésion et valider votre demande.",
          ],
          300,
          6,
        ),
        text("stepsNote", "Note sous les étapes", "Les conditions statutaires et l'éventuelle cotisation vous seront communiquées par l'organisation.", 400, 2),
      ],
    },
    {
      key: "partenaire",
      title: "Page « Devenir partenaire »",
      anchor: null,
      path: "/nous-rejoindre/partenaire",
      fields: [
        title(P.title, "Titre de la page"),
        text("intro", "Présentation", P.intro, 1500, 3),
        line("formTitle", "Titre du formulaire", P.formTitle, 120),
        image("image", "Photo de fond", PAGE_BACKDROPS.partner),
      ],
    },
    {
      key: "formulaires",
      title: "Encadrés à côté des 3 formulaires",
      description: "Les étapes, la note de confidentialité et les autres façons de s'engager.",
      anchor: "rejoindre-formulaire",
      path: "/nous-rejoindre/benevole",
      fields: [
        line("stepsTitle", "Titre des étapes", J.stepsTitle, 120),
        list("steps", "Étapes", "Étape", J.steps, 300, 6),
        text("privacyNote", "Note de confidentialité", J.privacyNote, 400, 2),
        line("otherPathsTitle", "Titre « Autres façons de s'engager »", J.otherPathsTitle, 120),
      ],
    },
  ],
};
