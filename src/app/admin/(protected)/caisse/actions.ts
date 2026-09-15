"use server";

import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth-staff";
import { computeLineTotal, nextOrderNumber, POINTS_PER_EURO } from "@/lib/orders";

export async function findCustomerByPhone(phone: string) {
  const customer = await prisma.customer.findUnique({
    where: { phone: phone.trim() },
  });
  return customer;
}

export type SaleLine = {
  productId: string;
  qty: number;
  discountPercent: number;
};

export type CompleteSaleResult =
  | { success: true; orderNumber: string; total: number }
  | { success: false; error: string };

export async function completeSale(
  lines: SaleLine[],
  customerId: string | null,
  globalDiscountPercent: number
): Promise<CompleteSaleResult> {
  const session = await requireStaff();

  if (!lines.length) {
    return { success: false, error: "Le ticket est vide." };
  }

  const products = await prisma.product.findMany({
    where: { id: { in: lines.map((l) => l.productId) } },
  });

  try {
    const computedLines = lines.map((line) => {
      const product = products.find((p) => p.id === line.productId);
      if (!product) throw new Error("Article introuvable.");
      if (product.stock < line.qty) {
        throw new Error(`Stock insuffisant pour ${product.name}.`);
      }
      const unitPrice = Number(product.price);
      return {
        product,
        qty: line.qty,
        unitPrice,
        discountPercent: line.discountPercent,
        lineTotal: computeLineTotal(unitPrice, line.qty, line.discountPercent),
      };
    });

    const subtotal = computedLines.reduce((sum, l) => sum + l.lineTotal, 0);
    const globalDiscount = subtotal * (globalDiscountPercent / 100);
    const total = Math.round((subtotal - globalDiscount) * 100) / 100;
    const number = await nextOrderNumber("CAI");

    await prisma.$transaction(async (tx) => {
      await tx.order.create({
        data: {
          number,
          source: "CAISSE",
          status: "COMPLETED",
          subtotal,
          discountTotal: Math.round(globalDiscount * 100) / 100,
          total,
          customerId: customerId ?? undefined,
          userId: session.userId,
          items: {
            create: computedLines.map((l) => ({
              productId: l.product.id,
              productName: l.product.name,
              qty: l.qty,
              unitPrice: l.unitPrice,
              discountPercent: l.discountPercent,
              lineTotal: l.lineTotal,
            })),
          },
        },
      });

      for (const l of computedLines) {
        await tx.product.update({
          where: { id: l.product.id },
          data: { stock: { decrement: l.qty } },
        });
      }

      if (customerId) {
        await tx.customer.update({
          where: { id: customerId },
          data: { points: { increment: Math.round(total * POINTS_PER_EURO) } },
        });
      }
    });

    return { success: true, orderNumber: number, total };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erreur lors de la vente.",
    };
  }
}
