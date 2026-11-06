/*
 * Aides des pages (serveur) de l'administration des contenus.
 */

type Params = Record<string, string | string[] | undefined>;

/** Première valeur d'un paramètre d'adresse. */
export function firstParam(params: Params, name: string): string {
  const value = params[name];
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export type Notice = { message: string; tone: "success" | "error" };

/**
 * Message affiché après une redirection (?etat=cree | supprime) : la page
 * d'arrivée l'annonce (création réussie, suppression faite).
 */
export function stateNotice(params: Params, labels: { created?: string; deleted?: string }): Notice | null {
  const state = firstParam(params, "etat");
  if (state === "cree" && labels.created) return { tone: "success", message: labels.created };
  if (state === "supprime" && labels.deleted) return { tone: "success", message: labels.deleted };
  return null;
}

/** Paramètres d'adresse conservés par la pagination (valeurs simples, non vides). */
export function keptParams(params: Params, names: readonly string[]): Record<string, string> {
  const kept: Record<string, string> = {};
  for (const name of names) {
    const value = firstParam(params, name);
    if (value) kept[name] = value;
  }
  return kept;
}
