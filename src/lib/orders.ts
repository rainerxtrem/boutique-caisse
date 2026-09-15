import "server-only";
import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";

export async function nextOrderNumber(prefix: "CMD" | "CAI") {
  const count = await prisma.order.count();
  const n = (count + 1).toString().padStart(6, "0");
  return `${prefix}-${n}`;
}

/**
 * Runs `run` with a fresh order number, retrying with a new number if two
 * concurrent sales (e.g. two registers checking out at the same instant)
 * raced for the same count-derived number. `run` must create the Order
 * inside its own transaction using the given number.
 */
export async function withOrderNumber<T>(
  prefix: "CMD" | "CAI",
  run: (number: string) => Promise<T>
): Promise<T> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const number = await nextOrderNumber(prefix);
    try {
      return await run(number);
    } catch (err) {
      const target =
        err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002"
          ? err.meta?.target
          : undefined;
      const isDuplicateNumber =
        Array.isArray(target) ? target.includes("number") : target === "number";
      if (!isDuplicateNumber || attempt === 2) throw err;
    }
  }
  throw new Error("Impossible de générer un numéro de commande unique.");
}

export type CartLine = {
  productId: string;
  qty: number;
  discountPercent?: number;
};

export function computeLineTotal(
  unitPrice: number,
  qty: number,
  discountPercent: number
) {
  const gross = unitPrice * qty;
  const discount = gross * (discountPercent / 100);
  return Math.round((gross - discount) * 100) / 100;
}

export const POINTS_PER_EURO = 1;

/**
 * Credits points earned on a completed order to a customer: increments both
 * the spendable balance and the lifetime total (used for loyalty tiers), and
 * refreshes lastOrderAt for segmentation. Call within the same transaction
 * that creates the order.
 */
export async function creditLoyaltyPoints(
  tx: Prisma.TransactionClient,
  customerId: string,
  amountSpent: number
) {
  const earned = Math.round(amountSpent * POINTS_PER_EURO);
  await tx.customer.update({
    where: { id: customerId },
    data: {
      points: { increment: earned },
      lifetimePoints: { increment: earned },
      lastOrderAt: new Date(),
    },
  });
  return earned;
}
