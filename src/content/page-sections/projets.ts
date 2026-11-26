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
  description: "Projets publiés, actions documentées par domaine, piliers d'action.",
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
      title: "Huit piliers stratégiques",
      anchor: "projets-domaines",
      fields: [
        label("Nos piliers d'action"),
        title("Huit piliers stratégiques"),
        lead("Des actions ciblées pour un impact global et durable."),
        text(
          "text",
          "Texte",
          "Chaque projet mené sur le terrain par INA-AFRICA s'articule autour de huit piliers stratégiques. Cette approche intégrée nous permet d'apporter des réponses concrètes, inclusives et pérennes aux besoins des communautés les plus vulnérables.",
        ),
      ],
      records: "areas",
    },
    { key: "soutenir", title: "Bloc « Soutenir INA-AFRICA » (bas de page)", anchor: "projets-soutenir", fields: [], sharedWith: { page: "commun", section: "soutenir" } },
  ],
};
