import Link from "next/link";

import { ORG } from "@/content/fr/site";
import { cn } from "@/lib/cn";

type LogoProps = {
  /** Sur fond sombre (pied de page) : texte blanc. */
  inverse?: boolean;
  /** Afficher la mention « Initiative pour un Nouvel Avenir en Afrique » : toujours, jamais, ou dès 640 px. */
  tagline?: "always" | "never" | "sm";
  /** Lien vers l'accueil (défaut) ; `false` pour un logo seul. */
  link?: boolean;
  className?: string;
};

/**
 * LOGO PROVISOIRE : le nom en texte, en attendant le fichier officiel de l'ONG.
 * Volontairement aucun pictogramme (on ne redessine pas le vrai logo). À
 * remplacer par le SVG officiel dans CE SEUL composant : tout le site suivra.
 */
export function Logo({ inverse = false, tagline = "sm", link = true, className }: LogoProps) {
  const content = (
    <span className="flex flex-col gap-1">
      <span className={cn("font-heading text-logo font-extrabold", inverse ? "text-white" : "text-brand")}>
        {ORG.name}
      </span>
      {tagline !== "never" && (
        <span
          className={cn(
            "text-logo-tagline font-medium",
            inverse ? "text-muted-inverse" : "text-muted",
            tagline === "sm" && "hidden sm:block",
          )}
        >
          {ORG.fullName}
        </span>
      )}
    </span>
  );

  if (!link) return <span className={cn("inline-flex", className)}>{content}</span>;
  return (
    <Link href="/" className={cn("inline-flex rounded-field", className)}>
      {content}
      <span className="sr-only"> — Accueil</span>
    </Link>
  );
}
