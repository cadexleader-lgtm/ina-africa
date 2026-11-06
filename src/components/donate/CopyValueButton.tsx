"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { DONATE_TEXT } from "@/content/fr/forms";

/** Copie un numéro (Mobile Money, compte) dans le presse-papiers, annoncé aux lecteurs d'écran. */
export function CopyValueButton({ value, label }: { value: string; label: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const O = DONATE_TEXT.offline;

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setState("copied");
    } catch {
      setState("failed");
    }
    window.setTimeout(() => setState("idle"), 2500);
  }

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        onClick={copy}
        aria-label={`${O.copy} : ${label}`}
        iconLeft={state === "copied" ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
      >
        {state === "copied" ? O.copied : O.copy}
      </Button>
      <span role="status" className="sr-only">
        {state === "copied" ? O.copiedAnnounce : state === "failed" ? O.copyFailed : ""}
      </span>
    </>
  );
}
