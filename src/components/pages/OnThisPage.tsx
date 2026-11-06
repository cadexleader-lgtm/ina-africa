import { Container } from "@/components/ui/Container";
import { PAGES } from "@/content/fr/pages";

/**
 * Sommaire « Sur cette page » : liens vers les ancres des sections présentes.
 * Simples liens (fonctionnent sans JavaScript) ; masqué s'il y a moins de 3 sections.
 */
export function OnThisPage({ items }: { items: { id: string; label: string }[] }) {
  if (items.length < 3) return null;
  return (
    <nav aria-label={PAGES.common.onThisPage} className="border-b border-line bg-white">
      <Container className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:gap-8">
        <p className="shrink-0 text-small font-semibold text-muted">{PAGES.common.onThisPage}</p>
        <ul className="flex flex-wrap gap-x-2 gap-y-2">
          {items.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className="inline-flex min-h-10 items-center rounded-full border border-line px-4 text-small font-semibold text-brand transition-colors duration-(--duration-fast) hover:border-brand hover:bg-brand-50"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </Container>
    </nav>
  );
}
