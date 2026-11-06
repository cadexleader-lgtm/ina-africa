import { Search } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { FormField, Input } from "@/components/ui/FormField";
import { NEWS_T } from "@/content/fr/news";
import { cn } from "@/lib/cn";

import { SEARCH_MAX } from "./news-params";

type NewsSearchFormProps = {
  /** id unique du champ (plusieurs formulaires peuvent exister sur une page). */
  id?: string;
  /** Recherche en cours (préremplie). */
  q?: string;
  /** Catégorie en cours : conservée lors d'une nouvelle recherche. */
  category?: string;
  /** Libellé masqué visuellement (toujours lu) : seulement sous un titre qui l'annonce déjà. */
  hideLabel?: boolean;
  className?: string;
};

/**
 * Recherche dans les actualités : formulaire GET classique vers /actualites
 * (fonctionne sans JavaScript, chaque recherche a son adresse).
 */
export function NewsSearchForm({ id = "recherche-actualites", q = "", category, hideLabel = false, className }: NewsSearchFormProps) {
  return (
    <form action="/actualites" method="get" role="search" aria-label={NEWS_T.list.searchLabel} className={cn("w-full", className)}>
      {category && <input type="hidden" name="categorie" value={category} />}
      <FormField id={id} label={NEWS_T.list.searchLabel} hideLabel={hideLabel}>
        {(field) => (
          <div className="flex gap-2">
            <div className="min-w-0 flex-1">
              <Input
                key={q}
                type="search"
                name="q"
                defaultValue={q}
                placeholder={NEWS_T.list.searchPlaceholder}
                minLength={2}
                maxLength={SEARCH_MAX}
                autoComplete="off"
                enterKeyHint="search"
                {...field}
              />
            </div>
            <Button type="submit" iconLeft={<Search aria-hidden="true" />}>
              <span className="sr-only sm:not-sr-only">{NEWS_T.list.searchSubmit}</span>
            </Button>
          </div>
        )}
      </FormField>
    </form>
  );
}
