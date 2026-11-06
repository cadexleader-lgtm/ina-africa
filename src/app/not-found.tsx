import type { Metadata } from "next";

import SiteLayout from "@/app/(site)/layout";
import { NotFoundContent } from "@/components/news/NotFoundContent";
import { NEWS_T } from "@/content/fr/news";

export const metadata: Metadata = {
  title: NEWS_T.notFound.metaTitle,
  robots: { index: false, follow: false },
};

/**
 * 404 des adresses qui ne correspondent à aucune page : même présentation que
 * le site public (en-tête, pied de page) grâce au layout du site, réutilisé tel quel.
 */
export default function RootNotFound() {
  return (
    <SiteLayout>
      <NotFoundContent />
    </SiteLayout>
  );
}
