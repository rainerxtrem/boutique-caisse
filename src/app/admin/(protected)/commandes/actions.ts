"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth-staff";
import { POINTS_PER_EURO } from "@/lib/orders";

export async function updateOrderStatus(
  orderId: string,
  status: "PENDING" | "READY" | "COMPLETED" | "CANCELLED"
) {
  await requireStaff();

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error("Commande introuvable.");
  if (order.status === "CANCELLED" || order.status === "COMPLETED") {
    // already final; only allow no-op
    revalidatePath("/admin/commandes");
    return;
  }

  if (status === "CANCELLED") {
    await prisma.$transaction(async (tx) => {
      const items = await tx.orderItem.findMany({ where: { orderId } });
      for (const item of items) {
        if (item.productId) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.qty } },
          });
        }
      }
      if (order.customerId) {
        await tx.customer.update({
          where: { id: order.customerId },
          data: {
            points: {
              decrement: Math.round(Number(order.total) * POINTS_PER_EURO),
            },
          },
        });
      }
      await tx.order.update({ where: { id: orderId }, data: { status } });
    });
  } else {
    await prisma.order.update({ where: { id: orderId }, data: { status } });
  }

  revalidatePath("/admin/commandes");
}

export type RefundLine = { orderItemId: string; qty: number };

export async function processRefund(
  orderId: string,
  lines: RefundLine[],
  reason: string
) {
  const session = await requireStaff();

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { refundItems: true } } },
  });
  if (!order) throw new Error("Commande introuvable.");

  const usable = lines.filter((l) => l.qty > 0);
  if (usable.length === 0) throw new Error("Sélectionnez au moins un article à rembourser.");

  let refundAmount = 0;
  const refundItemsData: { orderItemId: string; qty: number; amount: number }[] = [];

  for (const line of usable) {
    const item = order.items.find((i) => i.id === line.orderItemId);
    if (!item) throw new Error("Ligne de commande introuvable.");
    const alreadyRefunded = item.refundItems.reduce((s, r) => s + r.qty, 0);
    const remaining = item.qty - alreadyRefunded;
    if (line.qty > remaining) {
      throw new Error(`Quantité à rembourser trop élevée pour ${item.productName}.`);
    }
    const unitLineAmount = Number(item.lineTotal) / item.qty;
    const amount = Math.round(unitLineAmount * line.qty * 100) / 100;
    refundAmount += amount;
    refundItemsData.push({ orderItemId: item.id, qty: line.qty, amount });
  }
  refundAmount = Math.round(refundAmount * 100) / 100;

  await prisma.$transaction(async (tx) => {
    await tx.refund.create({
      data: {
        orderId,
        amount: refundAmount,
        reason: reason || null,
        staffUserId: session.userId,
        items: { create: refundItemsData },
      },
    });

    for (const line of usable) {
      const item = order.items.find((i) => i.id === line.orderItemId)!;
      if (item.productId) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: line.qty } },
        });
      }
    }

    if (order.customerId) {
      await tx.customer.update({
        where: { id: order.customerId },
        data: { points: { decrement: Math.round(refundAmount * POINTS_PER_EURO) } },
      });
    }

    const allRefunds = await tx.refundItem.findMany({
      where: { orderItem: { orderId } },
    });
    const totalOrderedQty = order.items.reduce((s, i) => s + i.qty, 0);
    const totalRefundedQty = allRefunds.reduce((s, r) => s + r.qty, 0);

    await tx.order.update({
      where: { id: orderId },
      data: {
        status: totalRefundedQty >= totalOrderedQty ? "REFUNDED" : "PARTIALLY_REFUNDED",
      },
    });
  });

  revalidatePath("/admin/commandes");
  revalidatePath(`/admin/commandes/${orderId}`);
}
