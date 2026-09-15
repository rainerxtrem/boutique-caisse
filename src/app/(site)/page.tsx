import Link from "next/link";
import { prisma } from "@/lib/db";
import { ProductCard } from "@/components/product-card";
import { CatalogFilters } from "@/components/catalog-filters";
import { getCurrentCustomer } from "@/lib/auth-customer";

export default async function HomePage({ searchParams }: PageProps<"/">) {
  const params = await searchParams;
  const category =
    typeof params.categorie === "string" ? params.categorie : undefined;
  const q = typeof params.q === "string" ? params.q : undefined;
  const sort = typeof params.tri === "string" ? params.tri : "nom";
  const onlyInStock = params.dispo === "stock";

  const orderBy =
    sort === "prix-asc"
      ? { price: "asc" as const }
      : sort === "prix-desc"
        ? { price: "desc" as const }
        : { name: "asc" as const };

  const now = new Date();
  const customer = await getCurrentCustomer();

  const [categories, products, highlighted, favorites] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.product.findMany({
      where: {
        active: true,
        temporarilyUnavailable: false,
        ...(onlyInStock ? { stock: { gt: 0 } } : {}),
        ...(category ? { category: { slug: category } } : {}),
        ...(q ? { name: { contains: q, mode: "insensitive" as const } } : {}),
      },
      include: { category: true },
      orderBy,
    }),
    prisma.product.findMany({
      where: {
        active: true,
        temporarilyUnavailable: false,
        OR: [{ featured: true }, { flashPrice: { not: null }, flashPriceEndsAt: { gt: now } }],
      },
      include: { category: true },
      take: 6,
    }),
    customer
      ? prisma.favorite.findMany({ where: { customerId: customer.id }, select: { productId: true } })
      : Promise.resolve([]),
  ]);

  const favoriteIds = new Set(favorites.map((f) => f.productId));

  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-2xl bg-gradient-to-br from-brand to-brand-dark px-6 py-10 text-white sm:px-10">
        <h1 className="text-2xl font-semibold sm:text-3xl">
          Bienvenue à La Boutique
        </h1>
        <p className="mt-2 max-w-xl text-sm text-white/85 sm:text-base">
          Découvrez notre catalogue, vérifiez les stocks et les prix en
          temps réel, et passez commande en ligne pour un retrait en
          boutique. Un compte fidélité créé en magasin est nécessaire pour
          commander.
        </p>
      </section>

      {highlighted.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">✨ En vedette & ventes flash</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {highlighted.map((p) => (
              <ProductCard
                key={p.id}
                isLoggedIn={!!customer}
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
                  isFavorite: favoriteIds.has(p.id),
                }}
              />
            ))}
          </div>
        </section>
      )}

      <form className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <Link
            href="/"
            className={`rounded-full px-3 py-1.5 text-sm font-medium ${
              !category
                ? "bg-brand text-white"
                : "bg-white text-muted border border-border hover:bg-gray-50"
            }`}
          >
            Tout
          </Link>
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/?categorie=${c.slug}`}
              className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                category === c.slug
                  ? "bg-brand text-white"
                  : "bg-white text-muted border border-border hover:bg-gray-50"
              }`}
            >
              {c.name}
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <CatalogFilters sort={sort} onlyInStock={onlyInStock} />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Rechercher un produit..."
            className="w-full max-w-xs rounded-lg border border-border bg-white px-3 py-2 text-sm focus:border-brand focus:ring-2 focus:ring-brand/20 sm:w-64"
          />
        </div>
      </form>

      {products.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-white py-16 text-center text-muted">
          Aucun produit ne correspond à votre recherche.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              isLoggedIn={!!customer}
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
                isFavorite: favoriteIds.has(p.id),
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
