import { Container } from "@/components/ui/Container";
import { LoadingState } from "@/components/ui/LoadingState";
import { T } from "@/content/fr/site";

function Bar({ className }: { className: string }) {
  return <span className={`block rounded-full bg-line ${className}`} />;
}

/** Attente de l'article (fallback du <Suspense>) : même gabarit que la page de lecture. */
export function ArticleSkeleton() {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">{T.a11y.loading}</span>
      <div aria-hidden="true" className="motion-safe:animate-pulse">
        <div className="border-b border-line bg-ivory pb-12 md:pb-16">
          <Container size="reading" className="flex flex-col pt-8 sm:pt-12">
            <Bar className="h-3.5 w-48" />
            <Bar className="mt-10 h-9 w-28" />
            <Bar className="mt-6 h-10 w-full" />
            <Bar className="mt-3 h-10 w-3/4" />
            <Bar className="mt-8 h-3.5 w-64" />
          </Container>
        </div>
        <Container size="reading" className="flex flex-col gap-3 py-12 md:py-16">
          {Array.from({ length: 8 }, (_, index) => (
            <Bar key={index} className={index % 4 === 3 ? "h-3.5 w-2/3" : "h-3.5 w-full"} />
          ))}
        </Container>
      </div>
    </div>
  );
}

/** Attente de la liste des actualités. */
export function NewsListSkeleton() {
  return <LoadingState variant="cards" count={3} />;
}
