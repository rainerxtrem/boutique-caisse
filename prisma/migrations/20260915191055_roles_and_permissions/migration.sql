-- CreateTable
CREATE TABLE "Permission" (
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "category" TEXT NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "roleId" TEXT NOT NULL,
    "permissionKey" TEXT NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleId","permissionKey")
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionKey_fkey" FOREIGN KEY ("permissionKey") REFERENCES "Permission"("key") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed permission catalog
INSERT INTO "Permission" ("key", "label", "category") VALUES
  ('dashboard.view', 'Voir le tableau de bord', 'Apercu'),
  ('statistiques.view', 'Voir les statistiques', 'Apercu'),
  ('statistiques.export', 'Exporter les statistiques (CSV)', 'Apercu'),
  ('caisse.use', 'Utiliser la caisse (encaisser)', 'Vente'),
  ('caisse.cloture', 'Cloturer la caisse', 'Vente'),
  ('caisse.retours', 'Traiter les retours en caisse', 'Vente'),
  ('commandes.view', 'Voir les commandes web', 'Vente'),
  ('commandes.manage', 'Gerer les commandes web', 'Vente'),
  ('commandes.refund', 'Effectuer un remboursement', 'Vente'),
  ('clients.view', 'Voir les clients fidelite', 'Clients'),
  ('clients.manage', 'Creer/modifier/supprimer des clients', 'Clients'),
  ('fidelite.manage_tiers', 'Gerer les paliers fidelite', 'Clients'),
  ('recompenses.manage', 'Gerer les recompenses', 'Clients'),
  ('recompenses.fulfill', 'Remettre une recompense', 'Clients'),
  ('articles.view', 'Voir les articles', 'Catalogue'),
  ('articles.manage', 'Creer/modifier/desactiver des articles', 'Catalogue'),
  ('fournisseurs.manage', 'Gerer les fournisseurs', 'Catalogue'),
  ('promotions.manage', 'Gerer les codes promo', 'Marketing'),
  ('bannieres.manage', 'Gerer les bannieres', 'Marketing'),
  ('utilisateurs.manage', 'Gerer les utilisateurs', 'Administration'),
  ('roles.manage', 'Gerer les roles et permissions', 'Administration'),
  ('audit.view', 'Voir le journal d''audit', 'Administration');

-- Seed default roles
INSERT INTO "Role" ("id", "name", "createdAt") VALUES
  ('role-admin', 'Administrateur', CURRENT_TIMESTAMP),
  ('role-vendeur', 'Vendeur', CURRENT_TIMESTAMP);

-- Administrateur gets every permission
INSERT INTO "RolePermission" ("roleId", "permissionKey")
SELECT 'role-admin', "key" FROM "Permission";

-- Vendeur gets a day-to-day subset
INSERT INTO "RolePermission" ("roleId", "permissionKey") VALUES
  ('role-vendeur', 'dashboard.view'),
  ('role-vendeur', 'caisse.use'),
  ('role-vendeur', 'caisse.retours'),
  ('role-vendeur', 'commandes.view'),
  ('role-vendeur', 'commandes.manage'),
  ('role-vendeur', 'clients.view'),
  ('role-vendeur', 'clients.manage'),
  ('role-vendeur', 'articles.view'),
  ('role-vendeur', 'recompenses.fulfill');

-- AlterTable: add roleId nullable first, backfill, then enforce NOT NULL
ALTER TABLE "User" ADD COLUMN "roleId" TEXT;

UPDATE "User" SET "roleId" = CASE WHEN "role" = 'ADMIN' THEN 'role-admin' ELSE 'role-vendeur' END;

ALTER TABLE "User" ALTER COLUMN "roleId" SET NOT NULL;

ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "User" DROP COLUMN "role";

DROP TYPE "StaffRole";
