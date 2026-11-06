"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { ENGAGE_NAV } from "@/content/fr/site";
import { cn } from "@/lib/cn";

/**
 * Menu déroulant « Agir avec nous » (en-tête, ordinateur). Bouton +
 * liste de liens : s'ouvre au clic ou au clavier, se ferme avec Échap, un clic
 * à l'extérieur ou quand le focus quitte le menu.
 */
export function EngageMenu() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div
      ref={rootRef}
      className="relative"
      onBlur={(event) => {
        if (!rootRef.current?.contains(event.relatedTarget as Node)) setOpen(false);
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-11 items-center gap-1 rounded-full px-3 text-nav font-semibold text-brand transition-colors duration-(--duration-fast) hover:bg-brand-50"
      >
        Agir avec nous
        <ChevronDown aria-hidden="true" className={cn("size-4 transition-transform duration-(--duration-fast)", open && "rotate-180")} />
      </button>
      <div
        id={menuId}
        hidden={!open}
        className="absolute top-full right-0 z-50 mt-2 w-80 rounded-card border border-line bg-white p-2 shadow-overlay"
      >
        <ul>
          {ENGAGE_NAV.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={() => setOpen(false)}
                className="block rounded-field px-4 py-3 transition-colors duration-(--duration-fast) hover:bg-ivory"
              >
                <span className="block font-semibold text-brand">{item.label}</span>
                <span className="block text-small text-muted">{item.description}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
