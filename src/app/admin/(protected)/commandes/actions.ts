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
