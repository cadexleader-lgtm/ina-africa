import { NEWS_T } from "@/content/fr/news";
import { PAGE_BACKDROPS } from "@/content/provisional-images";
import type { PageDef } from "@/lib/page-content/types";

import { headerSection } from "./fields";

/** Page « Actualités » (/actualites). Ne jamais renommer une clé. */
export const NEWS_PAGE: PageDef = {
  key: "actualites",
  label: "Actualités",
  path: "/actualites",
  description: "Haut de la page des actualités (les articles se gèrent dans Articles).",
  sections: [
    headerSection({
      label: NEWS_T.list.label,
      title: NEWS_T.list.title,
      intro: NEWS_T.list.intro,
      image: PAGE_BACKDROPS.news,
      elsewhere: [
        { label: "Les articles : Articles", href: "/admin/articles" },
        { label: "Les catégories : Catégories", href: "/admin/categories" },
      ],
    }),
    {
      key: "actions",
      title: "Nos actions sur le terrain (affichées tant qu'aucun article n'est publié)",
      anchor: "actions-documentees",
      fields: [],
      sharedWith: { page: "accueil", section: "actions" },
    },
  ],
};
