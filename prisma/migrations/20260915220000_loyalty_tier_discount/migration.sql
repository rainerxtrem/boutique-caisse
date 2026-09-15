-- AlterTable: each loyalty tier can now carry its own permanent discount, editable in the admin
ALTER TABLE "LoyaltyTier" ADD COLUMN "discountPercent" DECIMAL(5,2) NOT NULL DEFAULT 0;

-- Seed sensible defaults for the existing Bronze/Argent/Or tiers (percent applied
-- automatically and permanently to every purchase made by a customer in that tier)
UPDATE "LoyaltyTier"
SET "discountPercent" = 0,
    "perk" = 'Cumulez des points des le premier achat, en boutique comme en ligne.'
WHERE "id" = 'tier-bronze';

UPDATE "LoyaltyTier"
SET "discountPercent" = 5,
    "perk" = '5% de remise permanente sur tous les achats, offres anniversaire renforcees.'
WHERE "id" = 'tier-argent';

UPDATE "LoyaltyTier"
SET "discountPercent" = 10,
    "perk" = '10% de remise permanente sur tous les achats, acces prioritaire aux ventes flash.'
WHERE "id" = 'tier-or';
