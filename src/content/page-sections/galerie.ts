import { PAGES } from "@/content/fr/pages";
import { PAGE_BACKDROPS } from "@/content/provisional-images";
import type { PageDef } from "@/lib/page-content/types";

import { headerSection } from "./fields";

/** Page « Galerie » (/galerie). Ne jamais renommer une clé. */

const T = PAGES.gallery;

export const GALLERY_PAGE: PageDef = {
  key: "galerie",
  label: "Galerie",
  path: "/galerie",
  description: "Haut de la page de la galerie (les photos et vidéos se gèrent dans Galerie).",
  sections: [
    headerSection({
      label: T.label,
      title: T.title,
      intro: T.intro,
      image: PAGE_BACKDROPS.gallery,
      elsewhere: [{ label: "Les photos et vidéos : Galerie", href: "/admin/galerie" }],
    }),
    { key: "soutenir", title: "Bloc « Soutenir INA-AFRICA » (bas de page)", anchor: "galerie-soutenir", fields: [], sharedWith: { page: "commun", section: "soutenir" } },
  ],
};
