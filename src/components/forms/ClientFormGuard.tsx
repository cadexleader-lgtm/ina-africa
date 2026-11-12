"use client";

import { useEffect, useState } from "react";

import type { OrgContacts } from "@/components/forms/ContactAlternatives";
import { UnavailableNotice } from "@/components/forms/UnavailableNotice";
import { SPAM_FIELDS } from "@/lib/validation/forms";

/**
 * Variante de FormGuard pour les pages ENTIÈREMENT statiques (ex. page d'un
 * appel aux dons, `ensureStatic = "navigation"`) : l'horodatage signé est
 * demandé par le navigateur à l'affichage, au lieu d'être calculé par le
 * serveur à chaque visite.
 *
 * Le jeton est gardé en mémoire tant que la page est ouverte (et renouvelé
 * avant d'expirer) : un formulaire réaffiché après une erreur reprend le même
 * jeton, donc jamais de « envoi trop rapide » au deuxième essai.
 */

/** Renouvellement avant l'expiration côté serveur (2 h). */
const REFRESH_MS = 90 * 60 * 1000;

const cache = new Map<string, { value: string; at: number }>();
const pending = new Map<string, Promise<string | null>>();

function fetchToken(key: string, action: () => Promise<string | null>): Promise<string | null> {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.at < REFRESH_MS) return Promise.resolve(cached.value);
  let request = pending.get(key);
  if (!request) {
    request = action()
      .then((value) => {
        if (value) cache.set(key, { value, at: Date.now() });
        return value;
      })
      .catch(() => null)
      .finally(() => pending.delete(key));
    pending.set(key, request);
  }
  return request;
}

export function ClientFormGuard({
  formKey,
  formId,
  contacts,
  tokenAction,
}: {
  formKey: string;
  formId: string;
  contacts: OrgContacts;
  tokenAction: () => Promise<string | null>;
}) {
  const [state, setState] = useState<{ token: string | null; unavailable: boolean }>({ token: null, unavailable: false });

  useEffect(() => {
    let active = true;
    const load = () =>
      fetchToken(formKey, tokenAction).then((value) => {
        if (active) setState({ token: value, unavailable: value === null });
      });
    void load();
    const timer = window.setInterval(() => void load(), REFRESH_MS + 1000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [formKey, tokenAction]);

  if (state.unavailable) return <UnavailableNotice contacts={contacts} />;
  if (!state.token) return null;
  return <input type="hidden" name={SPAM_FIELDS.token} value={state.token} form={formId} />;
}
