import { cn } from "@/lib/cn";

/** Paragraphes d'un texte modifiable (une ligne vide entre deux paragraphes dans l'administration). */
export function Paragraphs({ items, className, spacing = "mt-4" }: { items: string[]; className?: string; spacing?: string }) {
  return (
    <>
      {items.map((paragraph, index) => (
        <p key={index} className={cn(index > 0 && spacing, className)}>
          {paragraph}
        </p>
      ))}
    </>
  );
}
