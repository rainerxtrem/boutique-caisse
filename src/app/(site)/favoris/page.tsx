import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentCustomer } from "@/lib/auth-customer";
import { ProductCard } from "@/components/product-card";

export default async function FavorisPage() {
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/connexion");

  const favorites = await prisma.favorite.findMany({
    where: { customerId: customer.id },
    include: { product: { include: { category: true } } },
    orderBy: { createdAt: "desc" },
  });

  const products = favorites
    .map((f) => f.product)
    .filter((p) => p.active);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Mes favoris</h1>
        <p className="text-sm text-muted">Vos produits enregistrés pour plus tard.</p>
      </div>

      {products.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-white py-16 text-center text-muted">
          Aucun favori pour l&apos;instant.{" "}
          <Link href="/" className="text-brand hover:underline">
            Voir le catalogue
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              isLoggedIn
              product={{
                id: p.id,
                name: p.name,
                slug: p.slug,
                price: Number(p.price),
                flashPrice: p.flashPrice ? Number(p.flashPrice) : null,
                flashPriceEndsAt: p.flashPriceEndsAt?.toISOString() ?? null,
                stock: p.stock,
                temporarilyUnavailable: p.temporarilyUnavailable,
                imageUrl: p.imageUrl,
                category: p.category ? { name: p.category.name } : null,
                isFavorite: true,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
