# CLAUDE.md — INA-AFRICA

@AGENTS.md

> Lire ce fichier en premier. Détails : `docs/architecture.md`, `docs/database.md`, `docs/frontend-plan.md` (plan frontend validé : design system, pages, composants).

## Le projet en une phrase
Site **vitrine** de l'ONG INA-AFRICA (Bénin) : présenter l'ONG, recevoir des dons
(KKiaPay/CinetPay + dons hors ligne saisis par l'admin), appels aux dons à
partager, blog pour Google, formulaire unique « Nous rejoindre / Nous soutenir ».
Volontairement **léger** (devis : 200 000 FCFA, 15-20 jours) : ne pas ajouter de
fonctionnalité hors périmètre sans accord.

## Règles non négociables
- **Aucune image générée par IA**, aucune photo de banque d'images présentée comme une action de l'ONG. Uniquement les vraies photos fournies par l'ONG.
- **Photos provisoires** (`public/images/provisoires/`, `src/content/provisional-images.ts`) : origine inconnue, fournies par l'utilisateur pour le développement. Illustration seulement, toujours avec « Photo d'illustration », jamais dans un projet, un article ou la galerie, **à remplacer avant la mise en ligne**. Les photos de la maquette (générées par IA) ne sont jamais utilisées.
- **Aucun faux contenu** : pas de faux partenaires, chiffres, témoignages, réalisations. Les textes viennent de l'ONG.
- **Aucune clé inventée**, aucun paiement simulé présenté comme réel. Aucun prestataire activé avant validation du compte marchand.
- **Pas de migration appliquée sur Supabase sans accord explicite** de l'utilisateur.
- Avancer **par étapes**, présenter le résultat avant de passer à la suivante. Phase 1 (base) faite ; frontend en cours selon `docs/frontend-plan.md` (validé) ; Phase 2 (connexion admin) avant le dashboard.
- La maquette sert de référence de **mise en page** uniquement : ses logos de partenaires, chiffres, valeurs et articles ne sont pas des contenus réels.

## Où est quoi
| Sujet | Fichier |
|---|---|
| Schéma, règles RLS, fonctions | `supabase/migrations/*.sql` (ordre chronologique) |
| Lectures publiques (cache) | `src/server/data/*.ts` (`TAGS` dans `tags.ts`) — sans Supabase configuré : listes vides → états vides |
| Types des contenus publics | `src/lib/types/content.ts` |
| Contenu riche (liste fermée) | `src/lib/validation/rich-text.ts` — toujours enregistrer le résultat de `parse()`, jamais l'entrée brute |
| Adresses d'images | `src/lib/media.ts` (`<nom>.webp` + `<nom>-sm.webp`) |
| Design system | jetons `src/styles/globals.css` (palettes Tailwind par défaut retirées), composants `src/components/ui/` et `src/components/site/`, démonstration `/styleguide` (dev seulement). `className` s'ajoute sans fusion : ne jamais contredire le composant |
| Textes d'interface | `src/content/fr/*.ts` (un fichier par zone) |
| Tests de la base | `tests/db/*.sql`, lancés par `npm run test:db` (Postgres local, `tests/db/supabase-shim.sql`) |
| Variables d'environnement | `.env.example`, `src/lib/public-env.ts`, `src/server/env.ts` |
| Clients Supabase | `src/server/supabase/server.ts` (session, RLS), `public.ts` (visiteur), `admin.ts` (clé secrète, usage restreint) |
| Erreurs | `src/server/errors.ts` (`ActionResult`, messages FR, indice `ina-africa`) |

## Conventions
- Rôles : `editor` < `admin` < `super_admin` (`private.has_role()`). Admin/super_admin sans double authentification (aal2) = aucun droit.
- L'éditeur écrit et soumet des **articles** ; l'admin publie et gère tout le reste.
- Rien n'est public par défaut (`status`, `is_published`, `is_active`).
- Dons : en ligne et hors ligne dans `donations` (`channel`) ; personne n'écrit dans `donations`/`payment_transactions` depuis le navigateur. Montants en francs CFA entiers (XOF).
- Comptage des dons en ligne = transactions `succeeded` ET `verified_at` ; toujours séparé du hors ligne.
- Emails en minuscules (type `email_address`) : le serveur fait `toLowerCase()` avant d'écrire.
- Images = chemin dans `public-media` (jamais d'URL externe), texte alternatif obligatoire pour publier. SVG refusé en upload (le logo officiel est dans le code, nettoyé).
- Nouvelle migration : nouveau fichier ; RLS + `revoke all … from anon, authenticated` + droits explicites + `grant all … to service_role` ; `set search_path = ''` ; erreurs `hint = 'ina-africa'` ; tests dans `tests/db/`.
- Next.js 16 avec **Cache Components** : lecture de `cookies()` uniquement sous `<Suspense>` ; lire `node_modules/next/dist/docs/` avant d'écrire du code Next.
- UI et messages en français ; code en anglais.
- Couleurs : `#079FD2` jamais pour du texte courant (liens = `#0679A1`) ; or `#D9A500` jamais en texte sur fond clair (traits d'accent, bouton de don avec texte `#17465A`).

## Avant de pousser
`npm run check` (types, lint, unitaires, base) puis `npm run build`.
