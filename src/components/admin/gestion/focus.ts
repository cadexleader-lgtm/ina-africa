/**
 * Après une action, un bouton désactivé pendant le chargement (ou remplacé)
 * perd le focus, qui retombe sur la page : on le remet sur le premier
 * élément actif de la zone, pour que la navigation au clavier continue au
 * même endroit.
 */
export function refocusWithin(container: HTMLElement | null) {
  window.requestAnimationFrame(() => {
    const active = document.activeElement;
    if (!container || (active && active !== document.body && container.contains(active))) return;
    if (active && active !== document.body) return;
    container.querySelector<HTMLElement>("button:not([disabled]), a[href], input:not([disabled]), textarea, select")?.focus();
  });
}
