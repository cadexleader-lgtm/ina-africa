"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Languages } from "lucide-react";

import { T } from "@/content/fr/site";
import { cn } from "@/lib/cn";
import {
  ENGLISH_COOKIE_VALUE,
  LANGUAGE_EVENT,
  TRANSLATE_COOKIE,
  cookieDomains,
  languageFromCookie,
  type SiteLanguage,
} from "@/lib/translate";

/**
 * Bouton FR / EN (traduction automatique par Google, voir src/lib/translate.ts)
 * et bandeau qui le signale quand la page est traduite.
 *
 * Tout ce qui est ici est marqué translate="no" : Google ne doit traduire ni
 * le bouton ni le bandeau.
 */

const SCRIPT_ID = "google-translate-script";
const HOST_ID = "google_translate_element";
const CALLBACK = "inaAfricaTranslateInit";
const SCRIPT_URL = `https://translate.google.com/translate_a/element.js?cb=${CALLBACK}`;

type TranslateWindow = Window & {
  [CALLBACK]?: () => void;
  google?: {
    translate?: {
      TranslateElement?: new (options: Record<string, unknown>, element: string) => unknown;
    };
  };
  __inaAfricaDomPatched?: boolean;
};

function subscribe(onChange: () => void) {
  window.addEventListener(LANGUAGE_EVENT, onChange);
  return () => window.removeEventListener(LANGUAGE_EVENT, onChange);
}
const getSnapshot = (): SiteLanguage => languageFromCookie(document.cookie);
const getServerSnapshot = (): SiteLanguage => "fr";

/** Langue affichée (français côté serveur, puis lue dans le cookie). */
function useSiteLanguage(): SiteLanguage {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * Google remplace des morceaux de texte de la page par ses propres balises :
 * quand React veut ensuite retirer ou insérer un élément à côté, le navigateur
 * lèverait une erreur et la page planterait. Correctif connu (React #11538) :
 * on ignore ces opérations devenues sans objet. Appliqué seulement quand la
 * traduction est demandée.
 */
function protectDomFromTranslation() {
  const w = window as TranslateWindow;
  if (w.__inaAfricaDomPatched) return;
  w.__inaAfricaDomPatched = true;
  const removeChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function <N extends Node>(this: Node, child: N): N {
    if (child.parentNode !== this) return child;
    return removeChild.call(this, child) as N;
  };
  const insertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function <N extends Node>(this: Node, node: N, reference: Node | null): N {
    if (reference && reference.parentNode !== this) return node;
    return insertBefore.call(this, node, reference) as N;
  };
}

function loadGoogleTranslate() {
  if (document.getElementById(SCRIPT_ID)) return;
  protectDomFromTranslation();
  const w = window as TranslateWindow;
  if (!document.getElementById(HOST_ID)) {
    const host = document.createElement("div");
    host.id = HOST_ID;
    host.hidden = true;
    host.setAttribute("translate", "no");
    document.body.appendChild(host);
  }
  w[CALLBACK] = () => {
    const TranslateElement = w.google?.translate?.TranslateElement;
    if (!TranslateElement) return;
    new TranslateElement({ pageLanguage: "fr", includedLanguages: "en,fr", autoDisplay: false }, HOST_ID);
  };
  const script = document.createElement("script");
  script.id = SCRIPT_ID;
  script.src = SCRIPT_URL;
  script.async = true;
  document.body.appendChild(script);
}

function setLanguage(language: SiteLanguage) {
  if (language === "en") {
    document.cookie = `${TRANSLATE_COOKIE}=${ENGLISH_COOKIE_VALUE}; path=/; max-age=31536000; SameSite=Lax`;
    window.dispatchEvent(new Event(LANGUAGE_EVENT));
    loadGoogleTranslate();
    return;
  }
  // Retour au texte d'origine : effacer le cookie partout où Google l'a posé, puis recharger.
  for (const domain of cookieDomains(window.location.hostname)) {
    document.cookie = `${TRANSLATE_COOKIE}=; path=/; max-age=0${domain ? `; domain=${domain}` : ""}`;
  }
  window.dispatchEvent(new Event(LANGUAGE_EVENT));
  window.location.reload();
}

const L = T.language;

export function LanguageSwitch({ className }: { className?: string }) {
  const language = useSiteLanguage();

  // Visiteur déjà passé en anglais (cookie) : la traduction reprend à chaque page.
  useEffect(() => {
    if (language === "en") loadGoogleTranslate();
  }, [language]);

  return (
    <div
      role="group"
      aria-label={L.label}
      translate="no"
      className={cn(
        "notranslate inline-flex items-center rounded-full border border-line bg-white p-0.5 text-small font-semibold",
        className,
      )}
    >
      <Languages aria-hidden="true" className="mx-1.5 hidden size-4 text-brand sm:block" />
      {(["fr", "en"] as const).map((code) => {
        const active = language === code;
        return (
          <button
            key={code}
            type="button"
            lang={code}
            title={L.names[code]}
            aria-pressed={active}
            onClick={() => !active && setLanguage(code)}
            className={cn(
              "min-h-9 min-w-8 rounded-full px-1.5 uppercase sm:min-w-9 sm:px-2 transition-colors duration-(--duration-fast) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
              active ? "bg-brand text-white" : "text-brand hover:bg-brand-50",
            )}
          >
            {code}
            <span className="sr-only"> ({L.names[code]})</span>
          </button>
        );
      })}
    </div>
  );
}

/** Bandeau sous l'en-tête quand la page est traduite (en anglais, non traduit). */
export function TranslationNotice() {
  const language = useSiteLanguage();
  if (language !== "en") return null;
  return (
    <div translate="no" lang="en" className="notranslate border-b border-line bg-ivory text-small text-ink" role="note">
      <div className="mx-auto box-content flex max-w-site flex-wrap items-center justify-between gap-x-4 gap-y-1 px-gutter py-2">
        <p>{L.notice}</p>
        <button
          type="button"
          lang="fr"
          onClick={() => setLanguage("fr")}
          className="font-semibold text-link underline underline-offset-4 hover:text-link-strong"
        >
          {L.backToFrench}
        </button>
      </div>
    </div>
  );
}
