/**
 * Assemble des classes CSS en ignorant les valeurs vides.
 * Pas de fusion intelligente des classes Tailwind (aucune dépendance) :
 * la prop `className` d'un composant est AJOUTÉE à ses classes ; éviter d'y
 * passer une classe qui contredit celles du composant (préférer une variante).
 */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}
