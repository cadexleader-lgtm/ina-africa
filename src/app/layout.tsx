import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "INA-AFRICA — Initiative pour un Nouvel Avenir en Afrique",
  description: "Site de l'ONG INA-AFRICA, en cours de construction.",
  // Site en construction : rien ne doit être indexé par Google avant la mise en ligne.
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
