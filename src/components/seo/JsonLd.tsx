/**
 * Données structurées (JSON-LD) pour Google.
 *
 * Seul usage autorisé de dangerouslySetInnerHTML dans le projet : le contenu
 * d'une balise <script type="application/ld+json"> doit être du texte brut.
 * Il est produit par JSON.stringify (jamais du HTML fourni par quelqu'un) et
 * chaque « < » est échappé, ce qui empêche de fermer la balise script
 * (méthode recommandée par la documentation Next.js, guide json-ld).
 */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger -- voir le commentaire ci-dessus
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
