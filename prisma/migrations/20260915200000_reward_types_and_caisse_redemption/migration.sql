-- CreateEnum
CREATE TYPE "RewardType" AS ENUM ('PHYSICAL', 'PERCENT', 'FIXED');

-- AlterTable: Reward gains a type + discount value (nullable, unused for PHYSICAL)
ALTER TABLE "Reward" ADD COLUMN "type" "RewardType" NOT NULL DEFAULT 'PHYSICAL';
ALTER TABLE "Reward" ADD COLUMN "value" DECIMAL(10,2);

-- AlterTable: Order gains an aggregate reward-discount field, same pattern as promoDiscount
ALTER TABLE "Order" ADD COLUMN "rewardDiscount" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- AlterTable: RewardRedemption traces which order consumed it (discount-type rewards only)
ALTER TABLE "RewardRedemption" ADD COLUMN "orderId" TEXT;

-- AddForeignKey
ALTER TABLE "RewardRedemption" ADD CONSTRAINT "RewardRedemption_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
