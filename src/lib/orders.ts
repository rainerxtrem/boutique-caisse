import "server-only";
import { prisma } from "@/lib/db";

export async function nextOrderNumber(prefix: "CMD" | "CAI") {
  const count = await prisma.order.count();
  const n = (count + 1).toString().padStart(6, "0");
  return `${prefix}-${n}`;
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
