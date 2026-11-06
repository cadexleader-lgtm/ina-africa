import "server-only";

import { slugify } from "@/lib/validation/admin/common";
import { AppError } from "@/server/errors";

const SLUG_MISSING = "Indiquez une adresse (lettres minuscules sans accent, chiffres et tirets).";

/** Adresse lisible saisie, ou calculée à partir du titre si le champ est vide. */
export function resolveSlug(slug: string | null | undefined, title: string): string {
  const value = slug || slugify(title);
  if (!value) throw new AppError("VALIDATION", SLUG_MISSING, { slug: [SLUG_MISSING] });
  return value;
}
