import "server-only";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { REFERRAL_BONUS_POINTS } from "@/lib/loyalty";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars

function randomCode(length = 6) {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return out;
}

/**
 * Credits both a customer and their referrer once, the first time the
 * referred customer completes an order. Call within the order's transaction,
 * after the order row has been created.
 */
export async function applyReferralBonusIfFirstOrder(
  tx: Prisma.TransactionClient,
  customerId: string
) {
  const customer = await tx.customer.findUnique({ where: { id: customerId } });
  if (!customer || !customer.referredById || customer.referralBonusGranted) return;

  const orderCount = await tx.order.count({ where: { customerId } });
  if (orderCount !== 1) return;

  await tx.customer.update({
    where: { id: customerId },
    data: {
      referralBonusGranted: true,
      points: { increment: REFERRAL_BONUS_POINTS },
      lifetimePoints: { increment: REFERRAL_BONUS_POINTS },
    },
  });
  await tx.customer.update({
    where: { id: customer.referredById },
    data: {
      points: { increment: REFERRAL_BONUS_POINTS },
      lifetimePoints: { increment: REFERRAL_BONUS_POINTS },
    },
  });
}

export async function generateUniqueReferralCode() {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = randomCode();
    const existing = await prisma.customer.findUnique({ where: { referralCode: code } });
    if (!existing) return code;
  }
  throw new Error("Impossible de générer un code de parrainage unique.");
}
