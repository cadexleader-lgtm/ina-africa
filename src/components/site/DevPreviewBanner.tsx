import { T } from "@/content/fr/site";
import { isDevPreview } from "@/server/data/dev-preview";

/** Bandeau discret affiché seulement en `next dev` quand Supabase n'est pas configuré. */
export function DevPreviewBanner() {
  if (!isDevPreview()) return null;
  return (
    <aside aria-label="Aperçu de développement" className="border-b border-gold bg-gold-50 px-gutter py-2 text-center text-small text-brand">
      <p>{T.devPreview}</p>
    </aside>
  );
}
