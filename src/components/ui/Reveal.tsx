"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  /** Délai d'apparition en ms (échelonner des cartes : 0, 80, 160…). */
  delay?: number;
  className?: string;
};

/**
 * Apparition discrète (fondu + 12 px, 500 ms) quand le bloc entre à l'écran.
 *  - Sans JavaScript : rien n'est masqué (le contenu est dans le HTML, visible).
 *  - Mouvement réduit demandé : aucun effet.
 *  - Bloc déjà visible au chargement : aucun effet (pas de clignotement).
 * L'état est posé directement sur l'élément (data-reveal), sans re-rendu React.
 */
export function Reveal({ children, delay = 0, className }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (element.getBoundingClientRect().top < window.innerHeight) return;

    element.dataset.reveal = "hidden";
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          element.dataset.reveal = "shown";
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(element);
    return () => {
      observer.disconnect();
      delete element.dataset.reveal;
    };
  }, []);

  const style = delay ? ({ "--reveal-delay": `${delay}ms` } as CSSProperties) : undefined;
  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  );
}
