# INA-AFRICA — Plan frontend (Étape 1 : audit et architecture)

> **Statut** : **validé le 05/11/2026** (plan, couleurs, migration).
> **Date** : 5 novembre 2026.
> **Sources** : cahier des charges frontend, les 2 maquettes, les 3 photos reçues, backend Phase 1 (dépôt `ina-africa`, branche `claude/dreamy-rubin-bgm05r`).

---

## 0. Décisions validées (05/11/2026)
- Plan, ajustements de couleurs (§3.2) et migration (§1.2) : **validés**.
  Migration écrite : `supabase/migrations/20261106090000_frontend_content_fields.sql`.
- **Textes officiels** : vision, missions, objectifs et moyens d'action repris
  **mot pour mot des statuts** (chapitre II, art. 8 à 11) ; historique et
  section « impact » tirés du document de présentation ; accroche de l'accueil
  tirée de la maquette (`…090100_official_texts.sql`, ne remplit que les champs
  vides). Valeurs : **vides** tant que l'ONG ne les a pas validées.
- **Photos** : origine inconnue, l'utilisateur demande d'utiliser celles
  fournies → **photos provisoires** (`public/images/provisoires/`,
  `src/content/provisional-images.ts`) : en illustration seulement, toujours
  avec la mention « Photo d'illustration », jamais présentées comme une action
  de INA-AFRICA, **à remplacer avant la mise en ligne**.
- **Logo** : envoyé plus tard → en attendant, « INA-AFRICA » en texte dans un
  composant `Logo` unique (jamais de logo redessiné).
- **Données** : lectures publiques prêtes dans `src/server/data/` (cache +
  étiquettes `TAGS`). Sans Supabase configuré, elles renvoient des listes
  vides → les pages DOIVENT afficher leurs états vides.

---

## 1. Audit de l'existant

### 1.1 Ce que le backend fournit déjà
| Besoin du cahier | Disponible | Remarque |
|---|---|---|
| Articles, catégories, publication par un admin | ✅ `articles`, `article_categories` | contenu riche en JSON (éditeur Tiptap) |
| Projets publiés | ✅ `projects` | ⚠️ **pas de lien vers un domaine** ni de photos de galerie par projet (retirés en v3) → nécessaire pour « filtrer par domaine » et « galerie photographique » |
| Domaines d'action | ✅ `action_areas` | ⚠️ seed de 6 domaines ≠ les 7 domaines confirmés du cahier ; pas de **résumé court** pour les cartes |
| Équipe, partenaires et sponsors, galerie photos/vidéos | ✅ | |
| Paramètres du site (coordonnées, réseaux, mission, vision, objectifs, historique, dons hors ligne, montants suggérés) | ✅ `site_settings` | ⚠️ manquent : **valeurs**, **approche d'intervention**, textes et photos du **hero** et de la section **impact**, **mentions légales**, **politique de confidentialité** |
| Appels aux dons, dons en ligne/hors ligne, jauge, tableau de bord | ✅ | |
| Formulaires (contact, bénévole, adhésion, partenariat) et newsletter | ✅ tables | ⚠️ **actions serveur pas encore écrites** (prévues en Phase 3) |
| Connexion admin, double authentification, protection `/admin` | ❌ | Phase 2, **pas encore faite** |
| Paiement en ligne | ❌ | Phase 4, attend le compte marchand |
| Projet Supabase | ❌ | **pas encore créé** : les pages ne pourront afficher de vraies données qu'une fois le projet créé et les migrations appliquées (avec ton accord) |

**Conséquence** : les étapes 6 (formulaires et dons) et 7 (dashboard) du cahier incluent les actions serveur des Phases 2 et 3. Je les construis **ensemble**, chaque page avec son action serveur, sans dupliquer quoi que ce soit.

### 1.2 Petits ajouts au backend nécessaires
Une migration, testée en local comme les autres. Rien n'a encore été appliqué sur Supabase.
1. `projects.action_area_id` → domaine du projet (filtre, cartes, pages domaine « actions associées ») ;
2. `gallery_items.project_id` → photos d'un projet, réutilise la galerie existante sans nouvelle table ;
3. `action_areas.summary` → courte description des cartes ;
4. `site_settings` : `values_text`, `approach`, `hero_kicker`, `hero_title`, `hero_text`, `hero_image_path`, `hero_image_alt`, `impact_title`, `impact_text`, `impact_image_path`, `impact_image_alt`, `legal_notice`, `privacy_policy` → tout reste **modifiable par l'ONG** sans développeur ;
5. domaines initiaux remplacés par les **7 domaines confirmés** du cahier : Éducation · Santé et droits en santé sexuelle et reproductive · Autonomisation des femmes · Jeunesse et adolescents · Inclusion et égalité de genre · Développement local durable et inclusif · Innovation sociale. Toujours en brouillon et sans texte inventé.

### 1.3 Contraintes techniques relevées
- **Next.js 16 avec Cache Components** : lectures publiques mises en cache (`'use cache'` + étiquettes), invalidées à chaque publication ; la session admin n'est lue que sous `<Suspense>`.
- **Hébergement non tranché** (Cloudflare recommandé) : je ne dépends pas de l'optimiseur d'images de Vercel. Les photos sont réduites et converties en **WebP en 2 tailles** (grande ~2000 px, petite ~800 px) au moment de l'envoi, puis servies avec `srcset`.

---

## 2. Remarques sur les maquettes et les photos

### 2.1 Les maquettes : utilisées comme référence de mise en page, pas comme contenu
| Élément de la maquette | Décision |
|---|---|
| Photos des maquettes | **Non utilisées.** Elles ont tout d'une génération par IA : logo INA imprimé sur les t-shirts, fautes typiques (« Éduuation », « communuutés »). Seules les vraies photos de l'ONG apparaîtront. |
| Logos UNICEF, PNUD, AFD, Croix-Rouge Béninoise | **Non affichés** tant que l'ONG n'a pas confirmé le partenariat et l'autorisation. Le bandeau partenaires n'apparaît que si des partenaires sont activés dans l'administration. |
| « +7 ans d'impact », « Plusieurs partenaires », « Des milliers de vies touchées » | **Non affichés.** Seul fait vérifié : *créée en 2017*. |
| Valeurs « Solidarité, Engagement, Innovation », textes mission et vision | Viendront de l'administration, **après validation par l'ONG** (le cahier le demande pour les valeurs). |
| Articles datés (15 oct. 2025…) | Remplacés par les vrais articles publiés ; état vide élégant en attendant. |
| Icône de recherche dans l'en-tête | Non reprise (pas de recherche globale au périmètre). Recherche **dans les Actualités** seulement. |
| Bandeau du haut (lieu, email, réseaux) | Repris, alimenté par les paramètres du site ; masqué si vide. |
| Libellés dorés sur fond blanc (« À propos de nous ») | Contraste trop faible (voir §3.2). Gardés **en bleu foncé**, précédés d'un trait doré décoratif : même allure, lisible. |

### 2.2 Les 3 photos reçues
| Photo | Taille | Constat |
|---|---|---|
| Couturière à la machine | 1200 × 1200 | belle qualité ; usage possible en carte ou section, trop carrée pour le hero |
| Jeunes en atelier (combinaisons bleues) | 1200 × 800 | bonne qualité ; un peu juste pour un hero plein écran (2000 px conseillés) |
| Salle de classe | **565 × 377** | **trop petite** (floue au-delà d'une vignette) ; l'emploi du temps au tableau est en **anglais** (« Mon, Tue… English & SST ») : ce n'est vraisemblablement **pas le Bénin**, donc pas une activité de INA-AFRICA |

Aucune des trois n'a de métadonnées d'auteur. **Avant de les utiliser, j'ai besoin de savoir d'où elles viennent** :
- **Photos de l'ONG** → utilisables partout ;
- **photos sous licence** (banque d'images, autorisation écrite) → seulement en illustration (domaines, sections générales), avec la mention « Photo d'illustration », **jamais** présentées comme une action de INA-AFRICA ni dans un projet ou un article ;
- **source inconnue** (prises sur internet) → non utilisables (droits d'auteur et droit à l'image).

---

## 3. Design system

### 3.1 Choix techniques
- **Tailwind CSS v4** : jetons centralisés (`@theme`), aucun JavaScript envoyé au navigateur. C'est une seule dépendance de développement.
- **Polices** : `next/font` auto-hébergées (Manrope pour les titres, Inter pour le texte), caractères latins seulement, `display: swap`.
- **Icônes** : `lucide-react`, seulement les icônes utilisées (un rôle précis, jamais décoratives).
- **Éditeur** : Tiptap dans l'administration uniquement, chargé à la demande, donc sans effet sur le site public.
- **Animations** : CSS + un petit observateur d'apparition, pas de bibliothèque d'animation. Tout est coupé si `prefers-reduced-motion`.
- Pas de bibliothèque de composants lourde. Seul un composant de dialogue accessible sera ajouté, si nécessaire.

### 3.2 Couleurs (contrastes calculés, norme WCAG AA = 4,5:1 pour le texte)
| Jeton | Valeur | Usage | Contraste |
|---|---|---|---|
| `brand` | #17465A | titres, boutons principaux, en-tête et pied de page | 10,2 sur blanc ✅ |
| `brand-2` | #079FD2 | **accents seulement** : icônes, traits, grands éléments | 3,0 sur blanc ❌ texte courant |
| `link` | **#0679A1** (nouveau, dérivé de #079FD2) | liens et texte d'action | 4,9 sur blanc ✅, 4,6 sur ivoire ✅ |
| `gold` | #D9A500 | traits d'accent, bouton « Faire un don » **avec texte bleu foncé** | bleu foncé sur or 4,5 ✅ ; or sur blanc 2,25 ❌ (jamais du texte doré sur fond clair) |
| `surface` / `ivory` | #FFFFFF / #F7F7F4 | fonds dominants | |
| `text-muted` | #5F6B72 | texte secondaire | 5,5 sur blanc ✅, 5,1 sur ivoire ✅ |
| `line` | #E9ECEF | séparateurs, bordures | |

Pas de dégradés, à une exception près : un voile sombre derrière un texte posé sur une photo, si nécessaire.

### 3.3 Typographie (fluide, `clamp()`)
| Niveau | Police | Taille | Interligne |
|---|---|---|---|
| H1 | Manrope 800 | 36 → 56 px | 1,1 |
| H2 | Manrope 700 | 28 → 40 px | 1,15 |
| H3 | Manrope 700 | 20 → 24 px | 1,3 |
| Libellé de section | Inter 600 | 14 px, bleu foncé + trait doré | |
| Texte | Inter 400 | 17 px | 1,65 ; ≤ 65 caractères par ligne |
| Petit | Inter 400 | 14 px (jamais moins) | |

### 3.4 Espacements, formes, mouvement
- Grille de 4 px ; marge verticale des sections de 64 → 112 px ; conteneur de 1200 px ; largeur de lecture de 680 px.
- Rayons : 8 px (champs), 16 px (cartes et images), boutons arrondis comme la maquette.
- 2 niveaux d'ombre seulement (carte au survol, menus).
- Survol en 200 ms, transitions en 250 ms, apparition des sections en 500 ms (fondu + 12 px).

### 3.5 Composants (bibliothèque unique)
`Container`, `Section`, `SectionHeading` (libellé + titre + intro), `Button` / `LinkButton` (principal, secondaire, don, lien), `Header`, `MobileMenu`, `Footer`, `TopBar`, `ResponsiveImage` (srcset WebP + texte alternatif obligatoire), `ImageCard`, `DomainCard`, `ProjectCard` (grande et compacte), `ArticleCard`, `RichText` (affichage sécurisé du JSON de l'éditeur, liste fermée d'éléments, aucun HTML injecté), `FormField` (libellé, aide, erreur), `Checkbox`, `Select`, `Alert`, `EmptyState`, `LoadingState`, `ErrorState`, `Pagination`, `Breadcrumbs`, `Modal`, `Reveal` (apparition), `VideoEmbed` (YouTube en mode sans cookie, Facebook, chargé au clic), `DashboardShell`, `DashboardSidebar`, `DataTable`.

Une page `/styleguide` (non indexée, désactivée en production) affichera tous les composants : c'est elle que je te montrerai pour valider le design system.

---

## 4. Pages

### 4.1 Site public
| Route | Contenu | Données |
|---|---|---|
| `/` | hero éditorial asymétrique (texte à gauche, grande photo à droite, bord courbe comme la maquette, 2 actions) · présentation rapide · 7 domaines · projets (1 mis en avant + 2) · impact humain (photo + texte, sans chiffres) · 3 dernières actualités · appel à l'action (un bouton « Faire un don » + 2 liens bénévole et partenaire) · bandeau partenaires **seulement s'il y en a** | `site_settings`, `action_areas`, `projects`, `articles`, `partners` |
| `/a-propos` | présentation, historique (2017), mission, vision, valeurs (si renseignées), objectifs, approche, équipe (si renseignée) | `site_settings`, `team_members` |
| `/domaines` · `/domaines/[slug]` | grille ; détail = description, photo, projets associés | `action_areas`, `projects` |
| `/projets` · `/projets/[slug]` | liste filtrable par domaine (`?domaine=`) et statut ; détail = contenu riche, galerie photo | `projects`, `gallery_items` |
| `/actualites` · `/actualites/[slug]` | catégories, recherche, pagination (12 par page) ; lecture confortable | `articles`, `article_categories` |
| `/galerie` | photos et vidéos publiées (promis au devis), visionneuse accessible | `gallery_items` |
| `/faire-un-don` · `/faire-un-don/[slug]` | page générale + une page par appel aux dons (le **lien à partager**, avec un bel aperçu WhatsApp et Facebook), montants suggérés et libre, jauge si l'admin l'active, instructions Mobile Money et virement | `donation_campaigns`, `campaign_progress`, `site_settings` |
| `/faire-un-don/suivi` | après le paiement : « paiement en cours de vérification », puis le statut **lu sur le serveur** (jamais déduit de l'adresse) | `donations` (serveur) |
| `/nous-rejoindre/benevole` · `/membre` · `/partenaire` | formulaires courts (seulement les données utiles) | → `contact_requests` |
| `/contact` | nom, email, sujet, message, consentement, anti-spam | → `contact_requests` |
| `/newsletter/confirmer` · `/newsletter/desinscription` | double confirmation, désinscription en un clic | `newsletter_subscribers` |
| `/mentions-legales` · `/politique-de-confidentialite` | textes administrables (état propre si non renseignés) | `site_settings` |
| `sitemap.xml`, `robots.txt`, images de partage, 404 | générés à partir de la base | |

**Navigation** (cahier) : Accueil · À propos · Nos domaines d'action · Nos projets · Actualités · Contact + bouton doré **Faire un don**. Sur téléphone : logo, bouton de don compact et menu. Les pages « Nous rejoindre » sont accessibles depuis l'appel à l'action, la page de don et le pied de page.

**Paiement en ligne** : le bouton de paiement n'apparaît **que si un prestataire est réellement configuré**. Sinon, la page de don affiche honnêtement les instructions Mobile Money et virement.

**Newsletter** : le formulaire n'apparaît qu'une fois l'envoi d'emails configuré, car la double confirmation en dépend.

### 4.2 Administration (`/admin`, distincte du site, non indexée)
- **Accès** : connexion, mot de passe oublié, enregistrement et saisie du code de double authentification, protection de toutes les pages côté serveur. C'est la Phase 2.
- **Menu selon le rôle** (le rôle est lu sur le serveur, jamais fourni par le navigateur) :
  - Tableau de bord ;
  - Articles ;
  - Catégories ;
  - Projets ;
  - Domaines ;
  - Galerie et médias ;
  - Équipe ;
  - Partenaires ;
  - Appels aux dons et dons, avec la saisie des dons hors ligne ;
  - Messages, Bénévoles, Adhésions, Partenariats (une boîte, filtrée) ;
  - Newsletter, avec l'export ;
  - Paramètres du site ;
  - Utilisateurs (super_admin).
- **L'éditeur** ne voit que : Tableau de bord (chiffres de contenu), Articles, Médias. Aucune donnée personnelle.
- **Éditeur visuel Tiptap** : sous-titres, gras, italique, souligné, listes, citations, liens, images de la médiathèque, vidéos YouTube et Facebook. Le contenu est validé côté serveur avant l'enregistrement.
- **Médias** : envoi direct vers Supabase avec une autorisation signée par le serveur, réduction en WebP dans le navigateur, texte alternatif demandé à l'envoi.

---

## 5. Architecture du code
```
src/
  app/
    (site)/            pages publiques + layout (Header, Footer)
    admin/             administration + layout (DashboardShell)
    auth/confirm/      validation des liens d'email (au clic)
    sitemap.ts, robots.ts
  components/
    ui/                composants de base (Button, FormField, Alert…)
    site/              Header, Footer, cartes, sections
    admin/             DashboardShell, DataTable, éditeur
    rich-text/         RichText (affichage) — partagé
  content/fr.ts        tous les textes d'interface (prêt pour d'autres langues)
  lib/validation/      schémas Zod partagés (formulaires, contenu riche)
  server/
    data/              lectures publiques mises en cache
    actions/           Server Actions (formulaires, admin)
    auth/              getCurrentUser(), requireRole()
    security/          anti-spam (piège + délai + empreinte IP + Turnstile)
  styles/              jetons Tailwind (@theme)
```

**Sécurité** :
- composants serveur par défaut ;
- seuls deviennent des composants client : le menu mobile, l'apparition au défilement, la visionneuse, les champs interactifs et l'administration ;
- aucune clé secrète hors de `src/server/` (`server-only` fait échouer la compilation sinon) ;
- chaque action serveur valide avec Zod, puis vérifie le rôle, puis les règles RLS appliquent la décision finale ;
- aucun message technique n'est affiché ;
- les formulaires fonctionnent même sans JavaScript.

---

## 6. Organisation avec 3 agents (à ta demande)

Je reste **chef d'orchestre** : j'écris les petits ajouts au backend et les contrats partagés (types, accès aux données, textes), je confie les tâches, je **relis chaque livraison** (sécurité, cohérence avec le backend, aucun faux contenu), je lance les tests et je fusionne. Chaque agent a **ses propres fichiers**, pour éviter les conflits.

| Agent | Mission | Étapes du cahier |
|---|---|---|
| **A — Design system et accueil** | jetons, polices, composants de base, page `/styleguide`, en-tête, menu mobile, pied de page, page d'accueil | 2, 3 |
| **B — Pages de contenu** | lectures en cache, À propos, Domaines, Projets, Actualités (catégories, recherche, pagination), Galerie, pages légales, référencement (métadonnées, plan du site, données structurées) | 4, 5 |
| **C — Formulaires et dons** | actions serveur et anti-spam, Contact, Nous rejoindre, Newsletter, pages de don et d'appels aux dons, suivi du paiement, interface prestataire **inactive** | 6 |

Ordre :
1. A livre d'abord les jetons et les composants de base (je te montre `/styleguide` pour validation) ;
2. B et C démarrent en parallèle pendant que A fait l'en-tête, le pied de page et l'accueil (je te montre l'accueil sur ordinateur, tablette et téléphone) ;
3. **le dashboard** (étape 7) se fait dans une 2e vague, après la Phase 2, toujours avec 3 agents : accès et structure / contenus, éditeur et médias / dons, boîte de réception, newsletter, utilisateurs et paramètres ;
4. étapes 8 et 9 : je fais la vérification finale.

**Contrôles à chaque étape** : types, lint, build, tests unitaires et de la base, captures d'écran automatiques (ordinateur, tablette, téléphone, aucun débordement horizontal), contrôle d'accessibilité automatique (`@axe-core/playwright`, outil de développement uniquement), vérification des droits par rôle.

---

## 7. Ce qu'il me faut pour avancer
1. **Validation de ce plan**, dont les ajouts au backend du §1.2 et les ajustements de couleurs du §3.2.
2. **L'origine des 3 photos** (§2.2) et le reste des photos, en grand format.
3. **Le logo officiel en fichier source** (SVG, AI, EPS ou PDF). En attendant, l'en-tête affiche « INA-AFRICA » en texte, jamais un logo redessiné.
4. **Le projet Supabase** (avant l'étape 5) pour afficher et tester de vraies données.
