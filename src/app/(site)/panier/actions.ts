"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentCustomer } from "@/lib/auth-customer";
import { nextOrderNumber, computeLineTotal, POINTS_PER_EURO } from "@/lib/orders";

export type CheckoutInput = { productId: string; qty: number }[];
export type CheckoutResult = { error?: string; orderNumber?: string };

export async function checkout(items: CheckoutInput): Promise<CheckoutResult> {
  const customer = await getCurrentCustomer();
  if (!customer) {
    redirect("/connexion");
  }

  if (!items.length) {
    return { error: "Votre panier est vide." };
  }

  const products = await prisma.product.findMany({
    where: { id: { in: items.map((i) => i.productId) }, active: true },
  });

  const lines = items.map((item) => {
    const product = products.find((p) => p.id === item.productId);
    if (!product) {
      throw new Error("Produit introuvable");
    }
    if (product.stock < item.qty) {
      throw new Error(`Stock insuffisant pour ${product.name}`);
    }
    const unitPrice = Number(product.price);
    return {
      product,
      qty: item.qty,
      unitPrice,
      lineTotal: computeLineTotal(unitPrice, item.qty, 0),
    };
  });

  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
  const total = subtotal;
  const number = await nextOrderNumber("CMD");

  try {
    await prisma.$transaction(async (tx) => {
      await tx.order.create({
        data: {
          number,
          source: "WEB",
          status: "PENDING",
          subtotal,
          discountTotal: 0,
          total,
          customerId: customer.id,
          items: {
            create: lines.map((l) => ({
              productId: l.product.id,
              productName: l.product.name,
              qty: l.qty,
              unitPrice: l.unitPrice,
              discountPercent: 0,
              lineTotal: l.lineTotal,
            })),
          },
        },
      });

      for (const l of lines) {
        await tx.product.update({
          where: { id: l.product.id },
          data: { stock: { decrement: l.qty } },
        });
      }

      await tx.customer.update({
        where: { id: customer.id },
        data: { points: { increment: Math.round(total * POINTS_PER_EURO) } },
      });
    });
  } catch (err) {
    return {
      error:
        err instanceof Error
          ? err.message
          : "Une erreur est survenue, veuillez réessayer.",
    };
  }

  return { orderNumber: number };
}
