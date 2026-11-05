import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { ProvisionalBadge, ResponsiveImage } from "@/components/ui/ResponsiveImage";
import { CARD, CARD_IMAGE, CARD_LINK, CARD_MORE } from "@/components/site/card-styles";
import { areaIcon } from "@/components/site/domain-icons";
import { MediaTile } from "@/components/site/MediaTile";
import { PROVISIONAL_AREA_IMAGES, PROVISIONAL_LABEL } from "@/content/provisional-images";
import { T } from "@/content/fr/site";
import { cn } from "@/lib/cn";
import type { ActionArea } from "@/lib/types/content";

type DomainCardProps = {
  area: ActionArea;
  headingLevel?: "h2" | "h3";
  /** Utiliser la photo provisoire du domaine s'il n'a pas de photo (défaut : oui, avec la mention). */
  allowProvisional?: boolean;
  /** `sizes` de la photo (défaut : grille 4 colonnes). */
  sizes?: string;
  className?: string;
};

/**
 * Carte d'un domaine d'intervention → /domaines/[slug].
 * Photo : celle de l'administration, sinon l'illustration provisoire du
 * domaine (mention « Photo d'illustration »), sinon une tuile avec UNE icône.
 * Téléphone : carte horizontale compacte ; dès 640 px : carte verticale.
 */
export function DomainCard({
  area,
  headingLevel: Heading = "h3",
  allowProvisional = true,
  sizes = "(min-width: 1280px) 290px, (min-width: 640px) 45vw, 88px",
  className,
}: DomainCardProps) {
  const image = area.image ?? (allowProvisional ? PROVISIONAL_AREA_IMAGES[area.slug] : undefined) ?? null;
  const provisional = Boolean(image && !area.image);

  return (
    <article className={cn(CARD, "flex-row items-center gap-4 p-3 sm:flex-col sm:items-stretch sm:gap-0 sm:p-0", className)}>
      <div className="relative size-22 shrink-0 overflow-hidden rounded-field sm:aspect-[4/3] sm:size-auto sm:w-full sm:rounded-none">
        {image ? (
          <ResponsiveImage image={image} sizes={sizes} fill provisionalLabel="none" imgClassName={CARD_IMAGE} />
        ) : (
          <MediaTile icon={areaIcon(area.slug)} size="responsive" className="absolute inset-0" />
        )}
        {provisional && (
          <span className="absolute bottom-3 left-3 hidden sm:block">
            <ProvisionalBadge />
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col sm:p-6">
        <Heading className="text-h4">
          <Link href={`/domaines/${area.slug}`} className={CARD_LINK}>
            {area.title}
          </Link>
        </Heading>
        {area.summary && <p className="mt-2 line-clamp-3 text-small text-muted sm:text-body">{area.summary}</p>}
        {provisional && <p className="mt-1 text-small text-muted sm:hidden">{PROVISIONAL_LABEL}</p>}
        <span aria-hidden="true" className="mt-auto hidden sm:block">
          <span className={CARD_MORE}>
            {T.actions.discover}
            <ArrowRight className="size-4 transition-transform duration-(--duration-fast) group-hover:translate-x-0.5" />
          </span>
        </span>
      </div>
      <ArrowRight aria-hidden="true" className="mr-2 size-5 shrink-0 text-link sm:hidden" />
    </article>
  );
}
