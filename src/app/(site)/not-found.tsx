import type { Metadata } from "next";

import { NotFoundContent } from "@/components/news/NotFoundContent";
import { NEWS_T } from "@/content/fr/news";

export const metadata: Metadata = {
  title: NEWS_T.notFound.metaTitle,
  robots: { index: false, follow: false },
};

/** Page 404 du site public (contenu introuvable : notFound() dans une page du site). */
export default function SiteNotFound() {
  return <NotFoundContent />;
}
