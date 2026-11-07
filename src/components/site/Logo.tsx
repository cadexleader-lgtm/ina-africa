import Link from "next/link";

import { ORG } from "@/content/fr/site";
import { cn } from "@/lib/cn";

/** Dimensions du fichier public/brand/ina-africa-logo.webp (proportions du logo officiel). */
const LOGO_WIDTH = 800;
const LOGO_HEIGHT = 594;

const HEIGHTS = {
  sm: "h-11", // 44 px : menu mobile
  md: "h-14", // 56 px : en-tête (72 px)
  lg: "h-24", // 96 px : pied de page
} as const;

type LogoProps = {
  /**
   * Sur fond sombre (pied de page) : le logo est posé sur une plaque blanche.
   * Le logo officiel n'est JAMAIS recoloré (« AFRICA » et la devise sont bleu
   * foncé : illisibles directement sur le bleu du pied de page).
   */
  inverse?: boolean;
  size?: keyof typeof HEIGHTS;
  /** Lien vers l'accueil (défaut) ; `false` pour un logo seul. */
  link?: boolean;
  className?: string;
};

/**
 * LOGO OFFICIEL de INA-AFRICA (fichier fourni par l'ONG, fond rendu transparent,
 * aucune autre modification). Un seul composant : tout le site le suit.
 */
export function Logo({ inverse = false, size = "md", link = true, className }: LogoProps) {
  const image = (
    // eslint-disable-next-line @next/next/no-img-element -- image locale déjà optimisée (WebP 2 tailles), hébergeur non choisi
    <img
      src="/brand/ina-africa-logo.webp"
      srcSet="/brand/ina-africa-logo-sm.webp 360w, /brand/ina-africa-logo.webp 800w"
      sizes="(min-width: 640px) 130px, 100px"
      width={LOGO_WIDTH}
      height={LOGO_HEIGHT}
      alt={`${ORG.name} — ${ORG.fullName}`}
      decoding="async"
      className={cn(HEIGHTS[size], "w-auto")}
    />
  );

  const content = inverse ? <span className="inline-flex rounded-card bg-white px-4 py-3">{image}</span> : image;

  if (!link) return <span className={cn("inline-flex", className)}>{content}</span>;
  return (
    <Link href="/" className={cn("inline-flex rounded-field", className)}>
      {content}
      <span className="sr-only"> — Accueil</span>
    </Link>
  );
}
