"use client";

import { useEffect, type FormEvent, type ReactNode, type RefObject } from "react";
import { Save } from "lucide-react";

import { Button } from "@/components/ui/Button";

import { FormFeedback } from "./FormFeedback";
import type { Feedback } from "./useActionForm";

/**
 * Formulaire d'édition d'un contenu : messages annoncés en haut, champs,
 * barre d'enregistrement collée en bas de l'écran. Prévient avant de quitter
 * la page avec des modifications non enregistrées.
 */
export function ContentForm({
  formRef,
  onSubmit,
  feedback,
  feedbackRef,
  extraErrors,
  pending,
  dirty,
  submitLabel = "Enregistrer",
  secondaryActions,
  children,
}: {
  formRef: RefObject<HTMLFormElement | null>;
  onSubmit: () => void;
  feedback: Feedback | null;
  feedbackRef: RefObject<HTMLDivElement | null>;
  extraErrors?: string[];
  pending: boolean;
  dirty: boolean;
  submitLabel?: string;
  secondaryActions?: ReactNode;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  return (
    <form
      ref={formRef}
      noValidate
      onSubmit={(event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        onSubmit();
      }}
      className="flex flex-col gap-6"
    >
      <FormFeedback feedback={feedback} feedbackRef={feedbackRef} extra={extraErrors} />
      {children}
      <div className="sticky bottom-0 z-10 -mx-1 flex flex-wrap items-center gap-3 rounded-card border border-line bg-white px-4 py-3 shadow-card">
        <Button type="submit" loading={pending} loadingLabel="Enregistrement…" iconLeft={<Save />}>
          {submitLabel}
        </Button>
        {secondaryActions}
        <p className="text-small text-muted" aria-live="polite">
          {dirty ? "Modifications non enregistrées." : ""}
        </p>
      </div>
    </form>
  );
}
