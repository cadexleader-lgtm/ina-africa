"use client";

import { useEffect, useRef } from "react";

import { FORM_TEXT } from "@/content/fr/forms";
import { SPAM_FIELDS } from "@/lib/validation/forms";

/**
 * Champ piège : hors de l'écran, ignoré par les lecteurs d'écran et le
 * clavier, sans saisie automatique. Un humain le laisse vide ; un robot qui
 * remplit tout le remplit.
 */
export function Honeypot({ formId }: { formId: string }) {
  const id = `${formId}-piege`;
  return (
    <div aria-hidden="true" className="pointer-events-none absolute left-[-9999px] h-px w-px overflow-hidden">
      <label htmlFor={id}>{FORM_TEXT.common.honeypotLabel}</label>
      <input id={id} type="text" name={SPAM_FIELDS.honeypot} tabIndex={-1} autoComplete="off" defaultValue="" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Cloudflare Turnstile (facultatif)
// ---------------------------------------------------------------------------

type TurnstileApi = {
  render: (element: HTMLElement, options: Record<string, unknown>) => string;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

/** Clé PUBLIQUE (intégrée à la compilation). Absente : aucun widget, aucun script chargé. */
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || null;
const SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

let scriptPromise: Promise<void> | null = null;

function loadTurnstile(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = SCRIPT_URL;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => {
        scriptPromise = null;
        reject(new Error("turnstile"));
      };
      document.head.appendChild(script);
    });
  }
  return scriptPromise;
}

function TurnstileWidget({ siteKey, theme }: { siteKey: string; theme: "light" | "dark" }) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let widgetId: string | null = null;
    let cancelled = false;
    loadTurnstile()
      .then(() => {
        if (cancelled || !container.current || !window.turnstile) return;
        widgetId = window.turnstile.render(container.current, {
          sitekey: siteKey,
          theme,
          language: "fr",
          "response-field-name": SPAM_FIELDS.turnstile,
        });
      })
      .catch(() => {
        // Script bloqué : le serveur refusera l'envoi avec un message clair.
      });
    return () => {
      cancelled = true;
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
    };
  }, [siteKey, theme]);

  return (
    <div>
      <p className="sr-only">{FORM_TEXT.common.turnstileLabel}</p>
      <div ref={container} />
      <noscript>
        <p className="text-small text-muted">{FORM_TEXT.common.turnstileNeedsJs}</p>
      </noscript>
    </div>
  );
}

/**
 * Widget anti-robot, affiché seulement si la clé publique est configurée.
 * Le formulaire est remonté après chaque réponse : un nouveau jeton à usage
 * unique est donc demandé à chaque envoi.
 */
export function TurnstileField({ theme = "light" }: { theme?: "light" | "dark" }) {
  return SITE_KEY ? <TurnstileWidget siteKey={SITE_KEY} theme={theme} /> : null;
}
