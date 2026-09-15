import "server-only";
import { prisma } from "@/lib/db";

/** Products most frequently bought in the same order as `productId`, ranked by co-occurrence count. */
export async function getFrequentlyBoughtWith(productId: string, limit = 4) {
  const orders = await prisma.orderItem.findMany({
    where: { productId },
    select: { orderId: true },
  });
  const orderIds = orders.map((o) => o.orderId);
  if (orderIds.length === 0) return [];

  const coItems = await prisma.orderItem.findMany({
    where: {
      orderId: { in: orderIds },
      productId: { not: productId },
      NOT: { productId: null },
    },
    select: { productId: true },
  });

  const counts = new Map<string, number>();
  for (const item of coItems) {
    if (!item.productId) continue;
    counts.set(item.productId, (counts.get(item.productId) ?? 0) + 1);
  }

  const rankedIds = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => id)
    .slice(0, limit * 2); // fetch extra in case some are inactive

  if (rankedIds.length === 0) return [];

  const products = await prisma.product.findMany({
    where: { id: { in: rankedIds }, active: true, temporarilyUnavailable: false },
    include: { category: true },
  });

  const order = new Map(rankedIds.map((id, i) => [id, i]));
  return products.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0)).slice(0, limit);
}

/** For a logged-in customer: their most-purchased category, to power a homepage "recommended for you" row. */
export async function getRecommendedForCustomer(customerId: string, limit = 4) {
  const items = await prisma.orderItem.findMany({
    where: { order: { customerId } },
    select: { productId: true },
  });
  const productIds = Array.from(new Set(items.map((i) => i.productId).filter((id): id is string => !!id)));
  if (productIds.length === 0) return [];

  const purchasedProducts = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { categoryId: true },
  });
  const categoryCounts = new Map<string, number>();
  for (const p of purchasedProducts) {
    if (!p.categoryId) continue;
    categoryCounts.set(p.categoryId, (categoryCounts.get(p.categoryId) ?? 0) + 1);
  }
  const topCategoryId = Array.from(categoryCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0];
  if (!topCategoryId) return [];

  return prisma.product.findMany({
    where: {
      categoryId: topCategoryId,
      active: true,
      temporarilyUnavailable: false,
      id: { notIn: productIds },
    },
    include: { category: true },
    take: limit,
  });
}
