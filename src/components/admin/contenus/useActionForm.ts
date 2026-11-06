"use client";

import { useCallback, useRef, useState, useTransition, type RefObject } from "react";

import type { ActionResult } from "@/server/errors";

import type { FieldErrorsMap } from "./form-utils";

export type Feedback = { tone: "success" | "error"; message: string };

const NETWORK_ERROR = "La connexion au serveur a échoué. Vérifiez votre connexion internet puis réessayez.";

type RunOptions<O> = {
  /** Message de succès annoncé (rien si absent). */
  success?: string | ((data: O) => string);
  onSuccess?: (data: O) => void;
};

/**
 * Exécute une Server Action de l'administration et gère son résultat :
 *  - `pending` pendant l'envoi (boutons désactivés) ;
 *  - erreurs par champ (`fieldErrors`) et message général ;
 *  - après une erreur, le focus va au premier champ en erreur (ou au message) ;
 *  - message de succès annoncé aux lecteurs d'écran (<FormFeedback>).
 */
export function useActionForm(formRef?: RefObject<HTMLElement | null>) {
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<FieldErrorsMap>({});
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);

  const focusProblem = useCallback(() => {
    // Après le rendu des erreurs.
    requestAnimationFrame(() => {
      const invalid = formRef?.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
      (invalid ?? feedbackRef.current)?.focus();
    });
  }, [formRef]);

  const run = useCallback(
    <O,>(action: () => Promise<ActionResult<O>>, options: RunOptions<O> = {}) => {
      setFeedback(null);
      startTransition(async () => {
        let result: ActionResult<O>;
        try {
          result = await action();
        } catch {
          setFeedback({ tone: "error", message: NETWORK_ERROR });
          focusProblem();
          return;
        }
        if (!result.ok) {
          setErrors(result.error.fieldErrors ?? {});
          setFeedback({ tone: "error", message: result.error.message });
          focusProblem();
          return;
        }
        setErrors({});
        const message = typeof options.success === "function" ? options.success(result.data) : options.success;
        if (message) setFeedback({ tone: "success", message });
        options.onSuccess?.(result.data);
      });
    },
    [focusProblem],
  );

  const clearError = useCallback((key: string) => {
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  }, []);

  return { pending, errors, setErrors, feedback, setFeedback, feedbackRef, run, clearError };
}

/**
 * Valeurs d'un formulaire contrôlé + indicateur « modifications non
 * enregistrées » (comparaison avec la dernière version enregistrée).
 */
export function useFormValues<T extends Record<string, unknown>>(initial: T) {
  const [values, setValues] = useState<T>(initial);
  const [saved, setSaved] = useState<string>(() => JSON.stringify(initial));
  const set = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
  }, []);
  const patch = useCallback((next: Partial<T>) => setValues((current) => ({ ...current, ...next })), []);
  /** À appeler après un enregistrement réussi, avec les valeurs ENVOYÉES. */
  const markSaved = useCallback((snapshot: T) => setSaved(JSON.stringify(snapshot)), []);
  const dirty = JSON.stringify(values) !== saved;
  return { values, set, patch, dirty, markSaved };
}
