import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { TopBar } from "@/components/site/TopBar";
import { T } from "@/content/fr/site";

/**
 * Layout du site public : bandeau du haut, en-tête, contenu, pied de page.
 * Chaque page fournit son contenu DANS <main id="contenu"> (ne pas remettre de <main>).
 * Agent C : passer le bloc newsletter au pied de page → <Footer newsletter={…} />.
 */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a
        href="#contenu"
        className="fixed top-3 left-3 z-50 -translate-y-[calc(100%+1rem)] rounded-full bg-brand px-5 py-3 font-semibold text-white focus:translate-y-0"
      >
        {T.a11y.skipToContent}
      </a>
      <TopBar />
      <Header />
      <main id="contenu" tabIndex={-1} className="focus:outline-none">
        {children}
      </main>
      <Footer />
    </>
  );
}
