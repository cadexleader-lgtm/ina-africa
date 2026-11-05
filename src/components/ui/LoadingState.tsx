import { cn } from "@/lib/cn";
import { T } from "@/content/fr/site";

type LoadingStateProps = {
  /** Forme des squelettes : cartes (grille), liste (lignes) ou texte (paragraphes). */
  variant?: "cards" | "list" | "text";
  count?: number;
  /** Texte lu par les lecteurs d'écran. */
  label?: string;
  className?: string;
};

function Bar({ className }: { className?: string }) {
  return <span className={cn("block rounded-full bg-line", className)} />;
}

/**
 * Squelettes de chargement (fallback des <Suspense>). Pulsation douce,
 * coupée si l'utilisateur préfère un mouvement réduit.
 */
export function LoadingState({ variant = "cards", count = 3, label = T.a11y.loading, className }: LoadingStateProps) {
  const items = Array.from({ length: count }, (_, index) => index);
  return (
    <div role="status" aria-live="polite" className={className}>
      <span className="sr-only">{label}</span>
      <div aria-hidden="true" className="motion-safe:animate-pulse">
        {variant === "cards" && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((index) => (
              <div key={index} className="overflow-hidden rounded-card border border-line bg-white">
                <span className="block aspect-[16/10] bg-line" />
                <div className="flex flex-col gap-3 p-6">
                  <Bar className="h-3 w-1/3" />
                  <Bar className="h-5 w-4/5" />
                  <Bar className="h-3 w-full" />
                  <Bar className="h-3 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        )}
        {variant === "list" && (
          <ul className="flex flex-col divide-y divide-line rounded-card border border-line bg-white">
            {items.map((index) => (
              <li key={index} className="flex items-center gap-4 p-4">
                <span className="size-12 shrink-0 rounded-field bg-line" />
                <div className="flex flex-1 flex-col gap-2">
                  <Bar className="h-4 w-1/2" />
                  <Bar className="h-3 w-1/3" />
                </div>
              </li>
            ))}
          </ul>
        )}
        {variant === "text" && (
          <div className="flex max-w-reading flex-col gap-3">
            {items.map((index) => (
              <Bar key={index} className={cn("h-3.5", index % 3 === 2 ? "w-2/3" : "w-full")} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
