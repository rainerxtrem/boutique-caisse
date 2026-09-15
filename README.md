# La Boutique — Site + Caisse

Application Next.js (App Router, TypeScript) combinant :

- **Site public** : catalogue produits (prix, stock), fiche produit, connexion par numéro de téléphone, panier, commande en ligne (retrait en boutique), espace fidélité avec historique des commandes et solde de points.
- **Back-office** (`/admin`) : authentification staff (identifiant/mot de passe), caisse enregistreuse (`/admin/caisse`), gestion des commandes web (`/admin/commandes`), gestion des clients fidélité (`/admin/clients`), gestion des articles et catégories (`/admin/articles`), gestion des utilisateurs staff (`/admin/utilisateurs`, réservé aux administrateurs).

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS
- PostgreSQL + Prisma ORM (adaptateur `@prisma/adapter-pg`)
- Sessions par cookies httpOnly signés (JWT via `jose`), mots de passe hashés avec `bcryptjs`

## Démarrage local

```bash
npm install
cp .env.example .env   # renseigner DATABASE_URL et JWT_SECRET
npx prisma migrate deploy   # ou `npx prisma migrate dev` en développement
npm run db:seed             # crée catégories/produits d'exemple + comptes admin/vendeur
npm run dev
```

Comptes créés par le seed :
- Staff admin : `admin` / mot de passe affiché par le script de seed (ou `SEED_ADMIN_PASSWORD`)
- Staff vendeur : `vendeur` / mot de passe affiché par le script de seed (ou `SEED_VENDEUR_PASSWORD`)
- Client fidélité de test : téléphone `0600000000`

## Déploiement (Railway)

1. Créer un projet Railway avec un plugin PostgreSQL.
2. Lier ce dépôt GitHub au service applicatif.
3. Variables d'environnement du service : `DATABASE_URL` (injectée automatiquement par le plugin Postgres si référencé), `JWT_SECRET`.
4. Build command : `npm run build` (exécute `prisma generate` puis `next build`).
5. Après le premier déploiement, exécuter une fois `npm run db:migrate:deploy` puis `npm run db:seed` (via `railway run`) pour initialiser le schéma et les données de départ.
