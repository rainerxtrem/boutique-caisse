import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { getEffectivePrice } from "@/lib/pricing";
import { CaisseClient } from "./caisse-client";

export default async function CaissePage() {
  const session = await requirePermission("caisse.use");

  const products = await prisma.product.findMany({
    where: { active: true },
    include: {
      category: true,
      relatedFrom: { include: { relatedProduct: true } },
    },
    orderBy: { name: "asc" },
  });

  const categories = Array.from(
    new Set(products.map((p) => p.category?.name).filter(Boolean))
  ) as string[];

  return (
    <CaisseClient
      vendeurName={session.name}
      categories={categories}
      products={products.map((p) => ({
        id: p.id,
        name: p.name,
        price: getEffectivePrice(p),
        stock: p.stock,
        imageUrl: p.imageUrl,
        categoryName: p.category?.name ?? null,
        temporarilyUnavailable: p.temporarilyUnavailable,
        relatedProducts: p.relatedFrom
          .filter((r) => r.relatedProduct.active && !r.relatedProduct.temporarilyUnavailable)
          .map((r) => ({
            id: r.relatedProduct.id,
            name: r.relatedProduct.name,
            price: Number(r.relatedProduct.price),
          })),
      }))}
    />
  );
}
