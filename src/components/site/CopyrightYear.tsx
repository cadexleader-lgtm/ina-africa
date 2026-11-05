import { cacheLife } from "next/cache";

/**
 * Année courante du « © ». Avec Cache Components, lire l'heure exige un cache :
 * la valeur fait partie du rendu statique et se renouvelle chaque jour.
 */
export async function CopyrightYear() {
  "use cache";
  cacheLife("days");
  return <>{new Date().getFullYear()}</>;
}
