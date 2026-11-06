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

## Écritures publiques

Formulaires (contact, bénévole, adhésion, sponsor, newsletter) et dons en ligne :
**seul le serveur écrit**, après validation Zod, anti-robot (Cloudflare
Turnstile) et limite d'envois par empreinte d'IP. Les visiteurs n'ont aucun
droit d'écriture sur ces tables.

## Paiement (Phase 4)

Interface commune aux prestataires (KKiaPay, CinetPay) : création du paiement,
vérification auprès du prestataire, lecture des notifications. Un paiement n'est
confirmé qu'après vérification côté serveur ; la base garantit qu'un don ne peut
pas être encaissé deux fois (voir docs/database.md §3). Aucun prestataire n'est
activé tant que le compte marchand n'est pas validé.

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
| 4 | Paiement en ligne (après validation du compte marchand) | à faire |
| 5 | Tests et validation | à faire |
| 6 | Site public (fait le 06/11/2026 : accueil, À propos, domaines, projets, galerie, actualités, pages légales, contact, nous rejoindre, newsletter, dons) ; administration à faire | en cours |
