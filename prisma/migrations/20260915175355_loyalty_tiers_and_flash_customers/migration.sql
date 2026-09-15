-- AlterTable
ALTER TABLE "Customer" ALTER COLUMN "birthDate" DROP NOT NULL;

-- CreateTable
CREATE TABLE "LoyaltyTier" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "minPoints" INTEGER NOT NULL,
    "perk" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoyaltyTier_pkey" PRIMARY KEY ("id")
);

-- Seed default tiers (matches the previously hardcoded thresholds)
INSERT INTO "LoyaltyTier" ("id", "label", "minPoints", "perk", "createdAt", "updatedAt") VALUES
  ('tier-bronze', 'Bronze', 0, 'Bienvenue dans le programme fidélité', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('tier-argent', 'Argent', 100, 'Offres anniversaire renforcées', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('tier-or', 'Or', 300, 'Accès prioritaire aux ventes flash', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
