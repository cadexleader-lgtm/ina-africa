import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";

import { cn } from "@/lib/cn";

/** Lien de retour vers la liste (« ← Tous les projets »). */
export function BackLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex min-h-11 items-center gap-2 font-semibold text-link underline-offset-4 hover:text-link-strong hover:underline",
        className,
      )}
    >
      <ArrowLeft
        aria-hidden="true"
        className="size-4 transition-transform duration-(--duration-fast) motion-safe:group-hover:-translate-x-0.5"
      />
      {children}
    </Link>
  );
}
