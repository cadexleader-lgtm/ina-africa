import type { PageDef, SectionDef } from "@/lib/page-content/types";

import { ABOUT_PAGE } from "./a-propos";

/**
 * Pages modifiables dans l'administration (menu « Pages du site »), dans
 * l'ordre du menu. Pour rendre une nouvelle page modifiable : décrire ses
 * sections dans un fichier de ce dossier, l'ajouter ici, puis lire ses
 * valeurs avec getPageContent() dans la page du site.
 */
export const EDITABLE_PAGES: PageDef[] = [ABOUT_PAGE];

export function findPage(key: string): PageDef | null {
  return EDITABLE_PAGES.find((page) => page.key === key) ?? null;
}

export function findSection(pageKey: string, sectionKey: string): { page: PageDef; section: SectionDef } | null {
  const page = findPage(pageKey);
  const section = page?.sections.find((candidate) => candidate.key === sectionKey);
  return page && section ? { page, section } : null;
}
