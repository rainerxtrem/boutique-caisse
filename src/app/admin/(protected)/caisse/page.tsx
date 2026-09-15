import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth-staff";
import { CaisseClient } from "./caisse-client";

export default async function CaissePage() {
  const session = await requireStaff();

  const products = await prisma.product.findMany({
    where: { active: true },
    include: { category: true },
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
        price: Number(p.price),
        stock: p.stock,
        categoryName: p.category?.name ?? null,
      }))}
    />
  );
}
