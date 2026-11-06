import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { areaIcon } from "@/components/site/domain-icons";
import type { ActionArea } from "@/lib/types/content";

/** Liste compacte des autres domaines (liens), pour passer d'un domaine à l'autre. */
export function OtherAreas({ areas }: { areas: ActionArea[] }) {
  if (areas.length === 0) return null;
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {areas.map((area) => {
        const Icon = areaIcon(area.slug);
        return (
          <li key={area.id} className="flex">
            <Link
              href={`/domaines/${area.slug}`}
              className="group flex w-full items-center gap-4 rounded-card border border-line bg-white p-4 transition-[border-color,box-shadow] duration-(--duration-base) hover:border-transparent hover:shadow-card"
            >
              <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-50">
                <Icon className="size-5 text-brand-2" strokeWidth={1.75} />
              </span>
              <span className="min-w-0 flex-1 font-heading text-body font-bold text-brand decoration-gold decoration-2 underline-offset-[6px] group-hover:underline">
                {area.title}
              </span>
              <ArrowRight
                aria-hidden="true"
                className="size-4 shrink-0 text-link transition-transform duration-(--duration-fast) motion-safe:group-hover:translate-x-0.5"
              />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
