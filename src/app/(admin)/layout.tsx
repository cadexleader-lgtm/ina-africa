import type { Metadata } from "next";

/**
 * Groupe de l'ADMINISTRATION : jamais indexé (en plus de robots.txt et de
 * l'en-tête X-Robots-Tag posé par le proxy).
 * Deux mises en page :
 *  - (acces)  : connexion, double authentification, mot de passe ;
 *  - (espace) : espace connecté (en-tête avec nom, rôle, déconnexion).
 */
export const metadata: Metadata = {
  title: { default: "Administration — INA-AFRICA", template: "%s — Administration INA-AFRICA" },
  robots: { index: false, follow: false },
  // Les adresses peuvent porter un chemin interne (?suite=) : jamais transmises aux sites liés.
  referrer: "same-origin",
};

export default function AdminGroupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
