import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { LoaderCircle } from "lucide-react";

import { cn } from "@/lib/cn";
import { T } from "@/content/fr/site";

/**
 * Boutons du design system.
 *  - primary   : bleu foncé, action principale (UNE par zone)
 *  - secondary : contour bleu foncé
 *  - donate    : or, texte bleu foncé (4,5:1) — réservé au don
 *  - ghost     : sans fond, survol teinté
 *  - link      : lien d'action (texte #0679A1, souligné au survol), sans marge
 *  - inverse   : contour blanc, pour les fonds sombres (Section tone="brand")
 */
export type ButtonVariant = "primary" | "secondary" | "donate" | "ghost" | "link" | "inverse";
export type ButtonSize = "sm" | "md" | "lg";

const BASE =
  "inline-flex items-center justify-center gap-2 text-center leading-tight font-semibold select-none " +
  "transition-[background-color,border-color,color,box-shadow] duration-(--duration-fast) ease-out " +
  "disabled:cursor-not-allowed disabled:opacity-60 aria-disabled:cursor-not-allowed aria-disabled:opacity-60 " +
  "[&_svg]:shrink-0";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "rounded-full bg-brand text-white hover:bg-brand-strong",
  secondary: "rounded-full border-[1.5px] border-brand bg-white text-brand hover:bg-brand-50",
  donate: "rounded-full bg-gold text-brand hover:bg-gold-light",
  ghost: "rounded-full text-brand hover:bg-brand-50",
  link: "text-link underline-offset-4 hover:text-link-strong hover:underline",
  inverse: "rounded-full border-[1.5px] border-white text-white hover:bg-white hover:text-brand",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "min-h-9 px-4 py-1.5 text-small [&_svg]:size-4",
  md: "min-h-11 px-6 py-2 text-body [&_svg]:size-[1.125rem]",
  lg: "min-h-13 px-7 py-2.5 text-body [&_svg]:size-5",
};

const LINK_SIZES: Record<ButtonSize, string> = {
  sm: "text-small [&_svg]:size-4",
  md: "text-body [&_svg]:size-[1.125rem]",
  lg: "text-lead [&_svg]:size-5",
};

/** Classes d'un bouton, pour un élément qui ne peut pas utiliser <Button>/<LinkButton>. */
export function buttonClasses({
  variant = "primary",
  size = "md",
  fullWidth = false,
}: { variant?: ButtonVariant; size?: ButtonSize; fullWidth?: boolean } = {}): string {
  return cn(BASE, VARIANTS[variant], variant === "link" ? LINK_SIZES[size] : SIZES[size], fullWidth && "w-full");
}

type CommonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  /** Icône lucide à gauche (aria-hidden ajouté automatiquement par lucide). */
  iconLeft?: ReactNode;
  /** Icône lucide à droite (ex. <ArrowRight />). */
  iconRight?: ReactNode;
};

type ButtonProps = ComponentPropsWithoutRef<"button"> &
  CommonProps & {
    /** État de chargement : désactivé, roue animée, `aria-busy`. */
    loading?: boolean;
    /** Texte lu pendant le chargement (défaut : le texte du bouton). */
    loadingLabel?: string;
  };

/** Bouton d'action (type="button" par défaut : préciser type="submit" dans un formulaire). */
export function Button({
  variant,
  size,
  fullWidth,
  iconLeft,
  iconRight,
  loading = false,
  loadingLabel,
  disabled,
  className,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(buttonClasses({ variant, size, fullWidth }), className)}
      {...props}
    >
      {loading ? <LoaderCircle aria-hidden="true" className="motion-safe:animate-spin" /> : iconLeft}
      {loading && loadingLabel ? loadingLabel : children}
      {!loading && iconRight}
    </button>
  );
}

type LinkButtonProps = Omit<ComponentPropsWithoutRef<"a">, "href"> &
  CommonProps & {
    href: string;
    /** Lien vers un autre site : ouvre un nouvel onglet avec rel="noopener noreferrer". */
    external?: boolean;
    /** Préchargement Next.js (liens internes seulement). */
    prefetch?: boolean;
  };

/** Lien qui a l'apparence d'un bouton (navigation). */
export function LinkButton({
  variant,
  size,
  fullWidth,
  iconLeft,
  iconRight,
  external = false,
  prefetch,
  className,
  children,
  href,
  ...props
}: LinkButtonProps) {
  const classes = cn(buttonClasses({ variant, size, fullWidth }), className);
  if (external) {
    return (
      <a href={href} className={classes} target="_blank" rel="noopener noreferrer" {...props}>
        {iconLeft}
        {children}
        {iconRight}
        <span className="sr-only"> {T.a11y.newTab}</span>
      </a>
    );
  }
  return (
    <Link href={href} prefetch={prefetch} className={classes} {...props}>
      {iconLeft}
      {children}
      {iconRight}
    </Link>
  );
}
