import { PAGES } from "@/content/fr/pages";
import { PAGE_BACKDROPS } from "@/content/provisional-images";
import type { PageDef } from "@/lib/page-content/types";

import { headerSection, label, lead, text, title } from "./fields";

/** Page « Nos projets et actions » (/projets). Ne jamais renommer une clé. */

const T = PAGES.projects;

export const PROJECTS_PAGE: PageDef = {
  key: "projets",
  label: "Projets",
  path: "/projets",
  description: "Projets publiés, actions documentées par domaine, domaines d'intervention.",
  sections: [
    headerSection({ label: T.label, title: T.title, intro: T.intro, image: PAGE_BACKDROPS.projects }),
    {
      key: "publies",
      title: "Projets publiés",
      anchor: "projets-publies",
      fields: [label("Projets"), title("Projets publiés")],
      elsewhere: [{ label: "Les projets eux-mêmes : Projets", href: "/admin/projets" }],
    },
    {
      key: "actions",
      title: "Nos actions sur le terrain",
      anchor: "actions-documentees",
      fields: [],
      sharedWith: { page: "accueil", section: "actions" },
    },
    {
      key: "piliers",
      title: "Nos domaines d'intervention",
      anchor: "projets-domaines",
      fields: [
        label("Ce que nous faisons"),
        title("Nos domaines d'intervention"),
        lead("Des actions ciblées pour un impact global et durable."),
        text(
          "text",
          "Texte",
          "Chaque projet mené sur le terrain par INA-AFRICA s'inscrit dans l'un de ses sept domaines d'intervention. Cette approche intégrée nous permet d'apporter des réponses concrètes, inclusives et pérennes aux besoins des communautés les plus vulnérables.",
        ),
      ],
      records: "areas",
    },
    { key: "soutenir", title: "Bloc « Soutenir INA-AFRICA » (bas de page)", anchor: "projets-soutenir", fields: [], sharedWith: { page: "commun", section: "soutenir" } },
  ],
};
