import { INTERVENTION_DOMAINS } from "@/content/fr/ina-africa";
import { PAGES } from "@/content/fr/pages";
import { T as SITE } from "@/content/fr/site";
import { PAGE_BACKDROPS } from "@/content/provisional-images";
import type { PageDef } from "@/lib/page-content/types";

import { headerSection, line, list, text, title } from "./fields";

/** Page « Nos domaines d'action » (/domaines). Ne jamais renommer une clé. */

const T = PAGES.areas;

export const AREAS_PAGE: PageDef = {
  key: "domaines",
  label: "Domaines d'action",
  path: "/domaines",
  description: "Liste des huit piliers et des domaines d'intervention.",
  sections: [
    headerSection({
      label: T.label,
      title: T.title,
      intro: T.intro,
      image: PAGE_BACKDROPS.areas,
    }),
    {
      key: "liste",
      title: "Liste des domaines",
      description: "Textes communs aux cartes des domaines.",
      anchor: null,
      fields: [line("button", "Texte du bouton de chaque carte", SITE.actions.discoverArea, 60)],
      elsewhere: [{ label: "Chaque domaine (titre, résumé, photo, page détaillée) : Domaines", href: "/admin/domaines" }],
    },
    {
      key: "interventions",
      title: "Nos domaines d'intervention",
      anchor: "domaines-interventions",
      alsoOn: ["Accueil"],
      fields: [
        title("Nos domaines d'intervention"),
        text("intro", "Introduction", "Les champs d'action concrets de INA-AFRICA sur le terrain.", 600, 2),
        list("items", "Domaines d'intervention", "Domaine", INTERVENTION_DOMAINS, 200, 16),
      ],
    },
    {
      key: "soutenir",
      title: "Bloc « Soutenir INA-AFRICA » (bas de page)",
      anchor: "domaines-soutenir",
      fields: [],
      sharedWith: { page: "commun", section: "soutenir" },
    },
  ],
};
