import type { LucideIcon } from "lucide-react";

import { ResponsiveImage } from "@/components/ui/ResponsiveImage";
import { areaIcon } from "@/components/site/domain-icons";
import { PROVISIONAL_AREA_IMAGES } from "@/content/provisional-images";
import type { ActionArea } from "@/lib/types/content";

/** Grande tuile sans photo : fond teinté, arcs et UNE icône (décorative). */
export function IconPanel({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <div aria-hidden="true" className="absolute inset-0 flex items-center justify-center overflow-hidden bg-brand-50">
      <span className="absolute size-[26rem] rounded-full border-2 border-brand-2/15" />
      <span className="absolute size-[17rem] rounded-full border-2 border-gold/30" />
      <span className="relative flex size-24 items-center justify-center rounded-full bg-white shadow-card sm:size-28">
        <Icon className="size-10 text-brand-2 sm:size-12" strokeWidth={1.5} />
      </span>
    </div>
  );
}

/**
 * Visuel d'un domaine : sa photo (administration), sinon l'illustration
 * provisoire du domaine (mention « Photo d'illustration »), sinon une tuile
 * sobre avec l'icône du domaine. Bord supérieur droit courbe.
 */
export function AreaVisual({ area, priority = false }: { area: ActionArea; priority?: boolean }) {
  const image = area.image ?? PROVISIONAL_AREA_IMAGES[area.slug] ?? null;
  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-card rounded-tr-[4rem] shadow-card lg:rounded-tr-[5rem]">
      {image ? (
        <ResponsiveImage image={image} fill priority={priority} sizes="(min-width: 1280px) 480px, (min-width: 1024px) 40vw, 100vw" />
      ) : (
        <IconPanel icon={areaIcon(area.slug)} />
      )}
    </div>
  );
}
