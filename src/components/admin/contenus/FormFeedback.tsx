"use client";

import type { RefObject } from "react";

import { Alert } from "@/components/ui/Alert";

import type { Feedback } from "./useActionForm";

/**
 * Messages de succès / d'erreur d'un formulaire, ANNONCÉS aux lecteurs
 * d'écran : les deux zones sont toujours présentes dans la page (une zone
 * insérée au dernier moment n'est pas toujours lue), seul leur contenu change.
 * `extra` : erreurs sans champ correspondant (affichées sous le message).
 */
export function FormFeedback({
  feedback,
  feedbackRef,
  extra = [],
  className,
}: {
  feedback: Feedback | null;
  feedbackRef?: RefObject<HTMLDivElement | null>;
  extra?: string[];
  className?: string;
}) {
  const success = feedback?.tone === "success" ? feedback.message : null;
  const error = feedback?.tone === "error" ? feedback.message : null;
  return (
    <div ref={feedbackRef} tabIndex={-1} className={className ? `focus:outline-none ${className}` : "focus:outline-none"}>
      <div role="status" aria-live="polite" aria-atomic="true">
        {success && (
          <Alert tone="success" role="none">
            {success}
          </Alert>
        )}
      </div>
      <div role="alert" aria-atomic="true">
        {error && (
          <Alert tone="error" role="none">
            <p>{error}</p>
            {extra.length > 0 && (
              <ul className="mt-2 list-disc pl-5">
                {extra.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            )}
          </Alert>
        )}
      </div>
    </div>
  );
}
