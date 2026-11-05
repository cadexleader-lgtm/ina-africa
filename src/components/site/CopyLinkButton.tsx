"use client";

import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/Button";

/** Copie l'adresse dans le presse-papiers (annoncé aux lecteurs d'écran). */
export function CopyLinkButton({ url, icon }: { url: string; icon?: ReactNode }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setState("copied");
    } catch {
      setState("failed");
    }
    window.setTimeout(() => setState("idle"), 2500);
  }

  return (
    <>
      <Button variant="secondary" size="sm" iconLeft={icon} onClick={copy}>
        {state === "copied" ? "Lien copié" : "Copier le lien"}
      </Button>
      <span role="status" className="sr-only">
        {state === "copied" ? "Lien copié dans le presse-papiers" : state === "failed" ? "Impossible de copier le lien" : ""}
      </span>
    </>
  );
}
