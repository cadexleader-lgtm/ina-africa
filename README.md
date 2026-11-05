# INA-AFRICA

Site de l'ONG **INA-AFRICA** (Initiative pour un Nouvel Avenir en Afrique) :
présentation de l'ONG, dons en ligne et hors ligne, appels aux dons à partager,
blog, accueil des bénévoles, adhérents et sponsors.

- Architecture : [`docs/architecture.md`](docs/architecture.md)
- Base de données, droits, dons : [`docs/database.md`](docs/database.md)

## Démarrer

```bash
npm install
cp .env.example .env.local   # puis compléter (jamais commité)
npm run dev
```

## Vérifications

```bash
npm run typecheck   # types TypeScript
npm run lint        # règles de code
npm test            # tests unitaires
npm run test:db     # base de données sur un Postgres local jetable
npm run build       # compilation de production
```

`npm run check` enchaîne les quatre premières.

## État

Phase 1 terminée : schéma de la base, règles de sécurité et tests locaux. Les
migrations ne sont **pas encore appliquées** sur le projet Supabase. Le site
public n'est pas encore construit (Phase 6).
