# Base de données INA-AFRICA

Schéma Supabase (Postgres) du site vitrine de l'ONG INA-AFRICA : présentation de
l'ONG, dons en ligne et hors ligne, appels aux dons à partager, blog, formulaires.

Diagramme des relations : [`diagrammes/schema.png`](diagrammes/schema.png)
(source Mermaid : [`diagrammes/schema.mmd`](diagrammes/schema.mmd)).

## 1. Les 17 tables

| Table | Rôle | Visible des visiteurs |
|---|---|---|
| `profiles` | comptes de l'administration (créés automatiquement avec le compte Auth) | non |
| `user_roles` | rôle de chaque compte : `editor` < `admin` < `super_admin` | non |
| `article_categories` | catégories du blog | oui |
| `articles` | blog / actualités (contenu de l'éditeur visuel en JSON) | si `status = published` |
| `projects` | projets et réalisations | si `is_published` |
| `action_areas` | domaines d'intervention | si `is_active` |
| `partners` | partenaires et sponsors (`kind`) | si `is_active` |
| `team_members` | équipe | si `is_active` |
| `gallery_items` | galerie : photo ou vidéo YouTube / Facebook | si `is_published` |
| `site_settings` | une seule ligne : présentation, coordonnées, réseaux, montants suggérés, instructions de don hors ligne | oui |
| `media` | bibliothèque des fichiers envoyés (côté administration) | non |
| `donation_campaigns` | appels aux dons (une page et un lien à partager chacun) | si `is_active` |
| `donations` | dons **en ligne et hors ligne** (`channel`) | non |
| `payment_transactions` | tentatives de paiement en ligne | non |
| `contact_requests` | boîte de réception unique : contact, bénévole, adhésion, sponsor | non |
| `newsletter_subscribers` | inscriptions (double confirmation) | non |
| `audit_logs` | trace des publications, dons et rôles | non |

Principe : **rien n'est public par défaut**. Tout contenu naît en brouillon ou
inactif ; seul un admin le publie ou l'active.

Conventions : `id uuid`, `created_at` / `updated_at` (tenu à jour par un trigger),
montants en `bigint` de francs CFA entiers (`currency = 'XOF'`), emails en
minuscules (type `email_address`), adresses lisibles (`slug`) au format
`mots-separes-par-des-tirets`, images référencées par leur **chemin** dans le
stockage `public-media` (jamais une URL externe) avec un texte alternatif
obligatoire pour publier.

## 2. Qui peut faire quoi

La double authentification est **exigée par la base** : un `admin` ou
`super_admin` dont la session n'est pas validée par le second facteur (`aal2`)
n'a aucun droit (`private.has_role()`).

| | Visiteur | editor | admin | super_admin |
|---|---|---|---|---|
| Articles | lit les publiés | crée, modifie les non publiés, soumet (`in_review`), supprime **ses** brouillons | publie, archive, modifie, supprime | idem |
| Projets, galerie, domaines, partenaires, équipe, catégories | lit ce qui est publié / actif | lit | gère | gère |
| Appels aux dons | lit les actifs | lit | gère | gère |
| Paramètres du site | lit | — | modifie | modifie |
| Médiathèque / stockage public | voit les fichiers par leur adresse, ne peut pas lister | liste, envoie, renseigne le texte alternatif | + supprime | idem |
| Justificatifs (stockage privé) | — | — | lit, envoie | idem |
| Demandes, newsletter | écrit **via le serveur uniquement** | — | lit, change le statut, supprime | idem |
| Dons, transactions | donne **via le serveur uniquement** | — | **lecture seule** + saisie des dons hors ligne | idem |
| Comptes et rôles | — | son profil | son profil, voit les rôles | attribue les rôles |
| Journal d'audit | — | — | — | lit |

Le circuit des articles est contrôlé par le trigger `private.articles_workflow()` :
l'éditeur ne peut ni publier, ni archiver, ni changer l'auteur ; la date de
publication et la personne qui publie sont posées automatiquement.

## 3. Les dons

**En ligne** (KKiaPay / CinetPay, Phase 4) :
1. le serveur crée le don (`channel = online`, `pending`) et une transaction ;
2. le visiteur paie chez le prestataire ;
3. le serveur **revérifie auprès du prestataire**, puis appelle
   `confirm_payment_transaction()` (service_role uniquement) qui contrôle le
   montant et la devise, verrouille les lignes et passe la transaction en
   `succeeded` et le don en `paid`.

Garanties de la base : au plus une transaction réussie par don ; un identifiant
de transaction du prestataire ne sert qu'une fois ; une notification répétée ne
change rien (`already_confirmed`) ; une transaction ne peut pas être `succeeded`
sans `verified_at` ; une page de retour ne peut rien valider (aucun droit
d'écriture côté navigateur).

**Hors ligne** (Mobile Money, virement) : saisis par un admin avec
`record_offline_donation()` → validés directement (`paid`), avec la personne qui
a saisi (`recorded_by`). La même opération (mode + référence) ne peut pas être
saisie deux fois. Une erreur se corrige par `cancel_offline_donation()` (motif
obligatoire), jamais par une suppression.

**Comptage** (`admin_dashboard_stats()`, `campaign_progress()`) : en ligne =
transactions `succeeded` **et** vérifiées (les remboursements sont exclus) ;
hors ligne = dons `paid` non annulés. Les deux sont toujours affichés séparément,
puis totalisés.

## 4. Fonctions appelables

| Fonction | Qui | Rôle |
|---|---|---|
| `confirm_payment_transaction(...)` | service_role | confirme un paiement vérifié (idempotente) |
| `fail_payment_transaction(...)` | service_role | marque une tentative échouée / annulée (idempotente) |
| `refund_payment_transaction(...)` | service_role | enregistre un remboursement vérifié |
| `record_offline_donation(...)` | admin | saisit un don hors ligne (clé d'idempotence contre le double clic) |
| `cancel_offline_donation(id, motif)` | admin | annule un don hors ligne saisi par erreur |
| `admin_dashboard_stats()` | editor (contenus), admin (tout) | chiffres du tableau de bord |
| `campaign_progress(id)` | tous | jauge d'un appel aux dons : totaux seulement, si l'admin l'affiche |

Toutes les erreurs levées par ces fonctions portent l'indice (`hint`)
`ina-africa` : leur message est rédigé en français pour l'utilisateur et peut
être affiché tel quel (`src/server/errors.ts`).

## 5. Migrations

Dans `supabase/migrations/`, à appliquer dans l'ordre :

1. `…100000_foundations` — schéma `private`, types, fonctions utilitaires, type `email_address`
2. `…100100_accounts_and_roles` — profils, rôles, double authentification, dernier super_admin protégé
3. `…100200_audit_logs` — journal d'audit
4. `…100300_media_and_storage` — médiathèque, espaces `public-media` et `private-documents`
5. `…100400_site_content` — blog, projets, domaines, partenaires, équipe, galerie, paramètres
6. `…100500_contact_requests_and_newsletter` — formulaires publics
7. `…100600_donations` — appels aux dons, dons, transactions, fonctions de paiement
8. `…100700_admin_dashboard` — chiffres du tableau de bord
9. `…100800_initial_data` — ligne de paramètres + 6 domaines en brouillon (sans texte inventé)

Règles pour toute nouvelle migration :
- ne jamais modifier une migration déjà appliquée : en créer une nouvelle ;
- toute nouvelle table : RLS activée, `revoke all … from anon, authenticated`,
  puis droits explicites, et `grant all … to service_role` ;
- toute fonction : `set search_path = ''`, droits d'exécution explicites ;
- toute erreur levée : `using errcode = '…', hint = 'ina-africa'` et message en français ;
- ajouter les tests correspondants dans `tests/db/`.

### Tester en local (sans toucher à Supabase)

```bash
npm run test:db
```

Démarre un Postgres jetable, applique une reproduction minimale de Supabase
(`tests/db/supabase-shim.sql`), toutes les migrations, puis les tests de
`tests/db/` (chaque fichier dans une transaction annulée). Nécessite les
binaires Postgres 16 (`PGBIN=/chemin/vers/bin` si besoin).

### Appliquer sur le projet Supabase (uniquement avec accord)

```bash
npx supabase link --project-ref <ref-du-projet>
npx supabase db push
```

### Créer le premier super_admin (une seule fois)

1. Supabase → Authentication → Users → **Add user** (email + mot de passe, « Auto Confirm »).
2. Supabase → SQL Editor :

```sql
insert into public.user_roles (user_id, role)
select id, 'super_admin' from public.profiles where email = 'adresse@exemple.org';
```

Les comptes suivants sont créés depuis l'administration par ce super_admin.

### Réglages Supabase à faire dans le tableau de bord (Phase 2)

- Authentication → Sign In / Providers : **désactiver** « Allow new users to sign up ».
- Authentication → Multi-Factor : activer **TOTP**.
- Authentication → Emails → SMTP : SMTP personnalisé (Resend) avant la mise en ligne.
- Authentication → URL Configuration : adresse du site + `/auth/confirm`.
