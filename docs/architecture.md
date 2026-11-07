# Architecture INA-AFRICA

Site vitrine de l'ONG INA-AFRICA : présenter l'ONG, recevoir des dons (en ligne
et hors ligne), publier des appels aux dons faciles à partager, faire vivre un
blog pour Google, accueillir bénévoles, adhérents et sponsors.

## Stack

- **Next.js 16** (App Router, Cache Components activé) + **TypeScript** strict
- **Supabase** : Postgres (règles RLS sur toutes les tables), Auth, Storage
- **Zod 4** pour valider tout ce qui entre côté serveur
- **Vitest** (tests unitaires) + Postgres local (tests de la base)

## Organisation du code

```
src/
  app/                 pages (Phase 6) et routes API (webhooks, Phase 4)
  lib/                 code partagé navigateur/serveur (public-env.ts, validations Zod)
  server/              code SERVEUR uniquement (import "server-only")
    env.ts             variables secrètes validées
    errors.ts          erreurs centralisées (ActionResult, messages en français)
    supabase/
      server.ts        client avec la session de l'admin connecté → RLS appliquée
      public.ts        client visiteur anonyme → ne voit que le publié
      admin.ts         client privilégié (clé secrète) → contourne RLS, usage restreint
    (à venir) data/ services/ actions/ payments/ email/
supabase/migrations/   schéma versionné (voir docs/database.md)
tests/db/              tests de la base sur Postgres local
tests/unit/            tests unitaires
```

## Trois barrières pour l'administration

1. la route `/admin` redirige toute personne non connectée (Phase 2) ;
2. chaque Server Action revérifie le rôle avant d'agir ;
3. les règles RLS de Postgres refusent l'opération si le rôle ne suffit pas
   (et exigent la double authentification pour admin et super_admin).

Si une vérification est oubliée dans le code, la base refuse quand même.

## Connexion à l'administration

Pas d'inscription publique : les comptes sont créés par un super_admin (le
tout premier à la main, voir `docs/database.md` §5 « Créer le premier
super_admin »). Tout passe par la session de la personne (Supabase Auth +
RLS) : le client privilégié n'est jamais utilisé pour se connecter.

### Fichiers

| Rôle | Fichier |
|---|---|
| Proxy (ex-middleware) : rafraîchit la session, `/admin/**` sans session → `/admin/connexion?suite=…` ; matcher `/admin`, `/admin/:path*`, `/auth/:path*` (jamais le site public) | `src/proxy.ts` |
| Garde (contrat des pages et des actions) : `getAdminSession()`, `requireAdminPage(min)`, `authorize(min)`, `roleAtLeast()` | `src/server/auth/guard.ts` (rôles : `roles.ts`) |
| Actions : connexion, déconnexion, code TOTP, activation TOTP, mot de passe oublié, lien reçu par email, nouveau mot de passe | `src/server/auth/actions.ts` |
| Validation (Zod) et paramètre `suite` | `src/lib/validation/auth.ts` |
| Pages d'accès (mise en page sobre centrée) | `src/app/(admin)/(acces)/admin/…`, `src/app/auth/confirm` |
| Espace connecté (en-tête : nom, rôle, déconnexion) | `src/app/(admin)/(espace)/admin/…` (layout + tableau de bord minimal) |
| Composants et textes | `src/components/admin/` |

**Nouvelle page d'administration** : la placer dans
`src/app/(admin)/(espace)/admin/<chemin>/page.tsx`, avec `export const instant = false`
et `const session = await requireAdminPage("editor" | "admin" | "super_admin")`
en tête. Le layout ne protège rien à lui seul. Chaque Server Action commence
par `const auth = await authorize(rôle); if (!auth.ok) return auth;`.

### Parcours

1. `/admin/connexion` : email + mot de passe (`signInWithPassword`). Échec →
   « Email ou mot de passe incorrect » (jamais d'indication sur l'existence du compte).
2. Après la connexion, le rôle est lu dans `user_roles` (règle RLS : chacun lit son rôle) :
   - aucun rôle → déconnexion + « Ce compte n'a pas accès à l'administration » ;
   - un facteur TOTP vérifié et session `aal1` → `/admin/verification` (code à 6 chiffres,
     `challenge` + `verify` → `aal2`), quel que soit le rôle ;
   - admin ou super_admin SANS facteur → `/admin/securite/double-authentification`
     (activation forcée : `enroll` → QR code et clé texte → premier code) ;
   - editor sans facteur → accès direct ; l'activation lui est proposée (facultative).
3. Retour à la page demandée (`suite`) ou à `/admin`.

`suite` n'accepte qu'un chemin interne de l'administration (commence par
`/admin`, pas de `//`, de `\`, de schéma, de `..` ni de caractère de contrôle)
— protection contre les redirections ouvertes (`safeAdminPath`).

Décisions côté serveur : `auth.getUser()` (jeton vérifié par Supabase Auth) puis
`mfa.getAuthenticatorAssuranceLevel()` ; jamais `getSession()` seul. Le proxy
utilise `getClaims()` (vérification du jeton, rafraîchissement des cookies).
La base exige de toute façon `aal2` pour admin et super_admin (`private.has_role`).
Un rôle insuffisant pour une page → `/admin/acces-refuse` (`forbidden()` demanderait
`experimental.authInterrupts` dans `next.config.ts`).

### Mot de passe oublié, invitation

- `/admin/mot-de-passe-oublie` : `resetPasswordForEmail`, réponse identique qu'un compte existe ou non.
- `/auth/confirm?token_hash=…&type=recovery|invite` : le jeton n'est utilisé
  (`verifyOtp`) qu'au **clic** sur « Continuer » (les filtres de messagerie
  ouvrent les liens et consommeraient un jeton à usage unique). Accepte aussi
  `?code=` (modèle d'email par défaut, flux PKCE, même navigateur seulement).
- `/admin/nouveau-mot-de-passe` : `updateUser` (12 caractères au moins, 72 octets
  au plus). Un compte qui a activé la double authentification valide d'abord son code
  (Supabase exige `aal2` pour changer le mot de passe).
- Déconnexion : Server Action `signOut` (session courante seulement).

### Réglages Supabase (tableau de bord, à faire une fois)

- Authentication → Sign In / Providers : désactiver « Allow new users to sign up ».
- Authentication → Multi-Factor : activer **TOTP** (enroll + verify).
- Authentication → URL Configuration : « Site URL » = adresse du site ;
  « Redirect URLs » : `https://<domaine>/auth/confirm` (et `http://localhost:3000/auth/confirm` en développement).
- Authentication → Emails → modèles :
  - « Reset password » : lien `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery`
  - « Invite user » : lien `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite`
- SMTP personnalisé (Resend) avant la mise en ligne (l'envoi par défaut est très limité).

## Écritures publiques

Formulaires (contact, bénévole, adhésion, sponsor, newsletter) et dons en ligne :
**seul le serveur écrit**, après validation Zod, anti-robot (Cloudflare
Turnstile) et limite d'envois par empreinte d'IP. Les visiteurs n'ont aucun
droit d'écriture sur ces tables.

## Paiement en ligne (KKiaPay)

- `src/server/payments/kkiapay.ts` : configuration (mode test `sandbox` avec la
  seule clé publique, mode réel `live` avec les trois clés) et vérification d'un
  paiement par l'API KKiaPay (`/api/v1/transactions/status`, mêmes en-têtes que
  le SDK serveur officiel).
- Formulaire de don → `startOnlineDonation` (`src/server/actions/donations.ts`) :
  en mode test, **rien n'est écrit** ; en mode réel, don + transaction `pending`
  (référence aléatoire, transmise à KKiaPay comme `partnerId`). Le navigateur
  ouvre ensuite la fenêtre KKiaPay (`src/components/donate/KkiapayCheckout.tsx`,
  script `cdn.kkiapay.me/k.js`, iframe `widget-v3.kkiapay.me`, autorisés dans la CSP).
- Fin du paiement → `checkOnlinePayment` relit le paiement chez KKiaPay. En mode
  réel, `src/server/payments/reconcile.ts` confirme par `confirm_payment_transaction()`
  (référence, montant et identifiant unique revérifiés). Mêmes vérifications depuis
  la page de suivi (`?transaction_id=`) et la notification
  `POST /api/paiements/notification` (en-tête `x-kkiapay-secret`).
- Un échec ne clôt pas la tentative : le visiteur peut réessayer dans la même fenêtre.
- Frais KKiaPay : par défaut payés par le donateur (s'ajoutent au montant affiché
  par KKiaPay) ; l'API renvoie le montant du don hors frais.

## Clés et secrets

Modèle dans `.env.example`. Les variables `NEXT_PUBLIC_*` sont envoyées au
navigateur : aucun secret. La clé secrète Supabase n'est lue que par
`src/server/supabase/admin.ts`. Les fichiers `.env*` ne sont jamais commités.

## Phases

| Phase | Contenu | État |
|---|---|---|
| 0 | Audit et plan | ✅ |
| 1 | Base de données : tables, RLS, fonctions, tests locaux | ✅ (appliquée sur Supabase le 06/11/2026, projet `vzmkyegczqlzjtuntmvz`) |
| 2 | Authentification admin, double authentification, protection des routes | à faire |
| 3 | Opérations backend (contenus, formulaires, dons hors ligne, médias) | à faire |
| 4 | Paiement en ligne KKiaPay | mode test branché le 07/11/2026 ; mode réel après validation du compte marchand |
| 5 | Tests et validation | à faire |
| 6 | Site public (fait le 06/11/2026 : accueil, À propos, domaines, projets, galerie, actualités, pages légales, contact, nous rejoindre, newsletter, dons) ; administration à faire | en cours |
