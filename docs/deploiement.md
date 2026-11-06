# Mettre le site en ligne avec Vercel

Ce guide explique, étape par étape, comment publier le site INA-AFRICA sur
**Vercel** (l'hébergeur). Il ne demande aucune compétence de développeur :
tout se fait dans le navigateur, sur les sites de Vercel et de Supabase.

> **Règle d'or** : une clé secrète ne se colle **que** dans les réglages de
> Vercel (ou de Supabase). Jamais dans un message, un email, un document
> partagé ou une conversation.

---

## 1. Ce qu'il faut avant de commencer

- Un compte **GitHub** qui a accès au dépôt `cadexleader-lgtm/ina-africa`.
- Un accès au projet **Supabase** `ina-africa` (identifiant
  `vzmkyegczqlzjtuntmvz`).
- 20 minutes.

Le plan gratuit de Vercel (« Hobby ») est prévu pour un usage non commercial.
Lisez ses conditions ; si besoin, passez au plan « Pro » (payant).

---

## 2. Créer le compte Vercel

1. Allez sur **https://vercel.com/signup**.
2. Choisissez **Continue with GitHub** et connectez-vous avec votre compte GitHub.
3. Vercel demande l'autorisation d'accéder à GitHub : acceptez. S'il propose
   de choisir les dépôts, sélectionnez **Only select repositories** puis
   `ina-africa`.

---

## 3. Importer le dépôt

1. Sur le tableau de bord Vercel : **Add New… → Project**.
2. Dans la liste, trouvez `cadexleader-lgtm/ina-africa` et cliquez **Import**.
   (S'il n'apparaît pas : **Adjust GitHub App Permissions** et ajoutez le dépôt.)
3. Vercel reconnaît tout seul **Next.js**. Ne changez rien à *Root Directory*,
   *Build Command* ni *Output Directory*.
4. **Avant** de cliquer sur **Deploy**, ouvrez la rubrique
   **Environment Variables** et saisissez les variables du paragraphe 4.

La région des serveurs est déjà réglée sur **Paris (`cdg1`)** par le fichier
`vercel.json` du dépôt, au plus près de la base Supabase (Paris aussi).

---

## 4. Les variables d'environnement

Une variable = un **nom** (à recopier exactement, majuscules comprises) et une
**valeur**. Pour chacune, Vercel demande à quels **environnements** elle
s'applique :

- **Production** : le vrai site, construit à partir de la branche de production ;
- **Preview** (prévisualisation) : une copie de test créée pour chaque autre
  branche. Elle n'est **jamais** indexée par Google et, par défaut, seules
  les personnes connectées à votre équipe Vercel peuvent l'ouvrir.

Elles se modifient plus tard dans **Settings → Environment Variables** du projet.

### 4.1 Variables publiques (obligatoires)

Elles ne sont pas secrètes (elles sont visibles dans le site).

| Nom | Valeur | Environnements |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://vzmkyegczqlzjtuntmvz.supabase.co` | Production et Preview |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | la clé publique qui commence par `sb_publishable_` (voir ci-dessous) | Production et Preview |
| `SITE_INDEXABLE` | `false` (jusqu'au lancement officiel, voir §9) | **Production seulement** |
| `NEXT_PUBLIC_SITE_URL` | l'adresse du site, voir ci-dessous | **Production seulement** |

**Où trouver la clé publique** : Supabase → projet `ina-africa` →
**Project Settings → API Keys** → rubrique *Publishable key* → bouton copier
(la clé commence par `sb_publishable_…`).

**`NEXT_PUBLIC_SITE_URL`** : l'adresse officielle, par exemple
`https://ina-africa.vercel.app`, sans barre `/` à la fin.
- Au **premier déploiement**, vous ne la connaissez pas encore : **laissez-la
  de côté**. Le site utilise alors tout seul l'adresse donnée par Vercel.
- Une fois le site déployé, recopiez l'adresse affichée par Vercel
  (rubrique *Domains*) dans cette variable, puis redéployez (§6).
- Ne la mettez **pas** pour Preview : chaque prévisualisation utilise ainsi sa
  propre adresse.

### 4.2 Variables secrètes (pour activer les formulaires)

Sans elles, le site fonctionne mais les formulaires (contact, bénévole,
adhésion, partenaire, dons hors ligne) affichent « Ce formulaire n'est pas
encore disponible » et **rien n'est envoyé ni enregistré**. Vous pouvez donc
d'abord publier sans elles.

Cochez la case **Sensitive** pour chacune (Vercel ne la réaffichera plus
jamais, même à vous).

| Nom | Valeur | Environnements |
|---|---|---|
| `SUPABASE_SECRET_KEY` | Supabase → **Project Settings → API Keys** → *Secret keys* → copier la clé `sb_secret_…` | Production (et Preview si vous voulez tester les formulaires en prévisualisation) |
| `IP_HASH_SECRET` | une suite aléatoire d'au moins 32 caractères (voir ci-dessous) | les mêmes que la ligne précédente |
| `NOTIFICATION_EMAILS` | les adresses qui reçoivent les formulaires, séparées par des virgules : `contact@exemple.org,direction@exemple.org` | les mêmes |

**Fabriquer `IP_HASH_SECRET`** : utilisez le générateur de mots de passe de
votre gestionnaire de mots de passe (64 caractères, lettres et chiffres), ou,
sur un Mac ou sous Linux, tapez dans le Terminal `openssl rand -hex 32`.
Inventez-la une fois, ne la réutilisez nulle part ailleurs.

### 4.3 Variables à ajouter plus tard (laisser vides pour l'instant)

| Nom | À quoi elle sert | Quand |
|---|---|---|
| `RESEND_API_KEY` et `EMAIL_FROM` | envoi des emails (notifications, newsletter). `EMAIL_FROM` ressemble à `INA-AFRICA <contact@votre-domaine.org>`, sur un domaine vérifié chez Resend | quand le compte Resend et le domaine sont prêts. Les **deux** sont nécessaires |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` et `TURNSTILE_SECRET_KEY` | anti-robot Cloudflare Turnstile sur les formulaires | quand le compte Cloudflare est créé. Les **deux** sont nécessaires |
| `KKIAPAY_…`, `CINETPAY_…` | paiement en ligne | **uniquement** après validation du compte marchand et la mise à jour du site prévue à ce moment-là |

Toutes les variables sont décrites dans le fichier `.env.example` du dépôt.

---

## 5. Choisir la branche de production

Le dépôt n'a pas encore de branche `main`. Pour l'instant, la branche de
production est **`claude/dreamy-rubin-bgm05r`**.

1. Projet Vercel → **Settings → Environments → Production**.
2. Rubrique **Branch Tracking** : saisissez `claude/dreamy-rubin-bgm05r`, puis
   **Save**. (Sur certaines versions de l'interface, ce réglage s'appelle
   **Production Branch**, dans **Settings → Git**.)
3. Allez dans **Deployments** et redéployez la dernière version de cette
   branche (§6) pour qu'elle devienne le site de production.

**Plus tard, passer à `main`** : quand la branche `main` existera sur GitHub,
revenez au même endroit, remplacez le nom par `main`, enregistrez, puis
redéployez. Toutes les autres branches deviennent alors des prévisualisations.

---

## 6. Redéployer (après chaque changement de variable)

Les variables sont lues **au moment de la construction** du site : modifier
une variable ne change rien tant qu'on n'a pas reconstruit.

1. Projet Vercel → **Deployments**.
2. Sur la ligne du dernier déploiement de production, cliquez **⋯ → Redeploy**,
   puis confirmez **Redeploy**.
3. Attendez l'état **Ready** (2 à 4 minutes).

Chaque nouvel envoi de code sur la branche de production redéploie aussi le
site automatiquement.

---

## 7. Régler l'adresse du site dans Supabase (connexion de l'administration)

Supabase doit connaître l'adresse du site pour les liens des emails de
connexion et d'invitation de l'administration.

1. Supabase → projet `ina-africa` → **Authentication → URL Configuration**.
2. **Site URL** : l'adresse du site, par exemple `https://ina-africa.vercel.app`
   → **Save**.
3. **Redirect URLs** → **Add URL** : la même adresse suivie de
   `/auth/confirm`, par exemple `https://ina-africa.vercel.app/auth/confirm`
   → **Save**.
4. Facultatif, pour tester la connexion sur les prévisualisations : ajoutez
   aussi `https://ina-africa-*.vercel.app/**`.

---

## 8. Vérifier le site après déploiement

- Ouvrez l'adresse du site : accueil, À propos, domaines, galerie, faire un
  don, contact, nous rejoindre, mentions légales s'affichent.
- `https://<adresse du site>/robots.txt` doit afficher `Disallow: /` tant que
  `SITE_INDEXABLE` vaut `false` : Google n'indexe rien.
- Sans les variables secrètes, les formulaires affichent « pas encore
  disponible » : c'est normal.
- `https://<adresse du site>/styleguide` affiche « page introuvable » : cette
  page est réservée au développement.

En cas d'échec : **Deployments** → cliquez sur le déploiement en erreur →
**Build Logs**, et transmettez les dernières lignes au développeur (elles ne
contiennent aucune clé).

---

## 9. Nom de domaine personnalisé (plus tard) et lancement

**Ajouter le domaine** (par exemple `ina-africa.org`) :

1. Projet Vercel → **Settings → Domains** → **Add** → saisissez le domaine.
2. Vercel affiche les enregistrements DNS à créer (*A* ou *CNAME*). Créez-les
   chez le fournisseur du domaine (là où il a été acheté). L'activation prend
   de quelques minutes à quelques heures ; le certificat HTTPS est automatique.
3. Remplacez la valeur de `NEXT_PUBLIC_SITE_URL` (Production) par
   `https://ina-africa.org`.
4. Dans Supabase (§7) : changez **Site URL** et ajoutez
   `https://ina-africa.org/auth/confirm` aux **Redirect URLs** (gardez
   l'adresse vercel.app tant qu'elle sert).
5. Redéployez (§6).

**Lancement officiel** (quand les vraies photos et les textes de l'ONG sont en
place) :

1. `SITE_INDEXABLE` (Production) : remplacez `false` par `true`.
2. Redéployez (§6).
3. Vérifiez que `/robots.txt` n'affiche plus `Disallow: /` mais l'adresse du
   plan du site (`Sitemap: …/sitemap.xml`).

Les prévisualisations restent non indexées quoi qu'il arrive.
