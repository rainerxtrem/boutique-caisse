import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { FavoriteButton } from "@/components/favorite-button";
import { ProductGallery } from "@/components/product-gallery";
import { formatPrice } from "@/lib/format";
import { getEffectivePrice } from "@/lib/pricing";
import { getCurrentCustomer } from "@/lib/auth-customer";
import { getFrequentlyBoughtWith } from "@/lib/recommendations";

export default async function ProductPage({
  params,
}: PageProps<"/produits/[slug]">) {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug, active: true },
    include: {
      category: true,
      relatedFrom: { include: { relatedProduct: { include: { category: true } } } },
      images: { orderBy: { order: "asc" } },
    },
  });

  if (!product) notFound();

  const [customer, coBought] = await Promise.all([
    getCurrentCustomer(),
    getFrequentlyBoughtWith(product.id),
  ]);
  const isFavorite = customer
    ? !!(await prisma.favorite.findUnique({
        where: { customerId_productId: { customerId: customer.id, productId: product.id } },
      }))
    : false;

  const outOfStock = product.stock <= 0 || product.temporarilyUnavailable;
  const effectivePrice = getEffectivePrice(product);
  const onFlash = effectivePrice < Number(product.price);

  const curated = product.relatedFrom
    .map((r) => r.relatedProduct)
    .filter((p) => p.active && !p.temporarilyUnavailable);
  const curatedIds = new Set(curated.map((p) => p.id));
  const related = [...curated, ...coBought.filter((p) => !curatedIds.has(p.id))].slice(0, 4);

  const galleryImages = [
    ...(product.imageUrl ? [product.imageUrl] : []),
    ...product.images.map((i) => i.url),
  ];

  return (
    <div className="flex flex-col gap-6">
      <Link href="/" className="text-sm text-muted hover:text-foreground">
        ← Retour au catalogue
      </Link>
      <div className="grid gap-8 sm:grid-cols-2">
        <ProductGallery images={galleryImages} name={product.name} />
        <div className="flex flex-col gap-4">
          {product.category && (
            <Badge tone="muted" className="w-fit">
              {product.category.name}
            </Badge>
          )}
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-2xl font-semibold">{product.name}</h1>
            <FavoriteButton
              productId={product.id}
              initialFavorite={isFavorite}
              isLoggedIn={!!customer}
              className="border border-border"
            />
          </div>
          {product.description && (
            <p className="text-muted">{product.description}</p>
          )}
          <div className="flex items-center gap-3">
            <span className="text-3xl font-semibold text-brand-dark">
              {formatPrice(effectivePrice)}
            </span>
            {onFlash && (
              <span className="text-lg text-muted line-through">
                {formatPrice(Number(product.price))}
              </span>
            )}
          </div>
          {product.temporarilyUnavailable ? (
            <Badge tone="warning" className="w-fit">
              Indisponible temporairement
            </Badge>
          ) : outOfStock ? (
            <Badge tone="danger" className="w-fit">
              Rupture de stock
            </Badge>
          ) : (
            <Badge tone="brand" className="w-fit">
              {product.stock} en stock
            </Badge>
          )}
          <div className="mt-2">
            <AddToCartButton
              product={{
                id: product.id,
                name: product.name,
                price: effectivePrice,
                imageUrl: product.imageUrl,
              }}
              disabled={outOfStock}
            />
          </div>

          {(product.ingredients || product.allergens || product.prepTimeMinutes) && (
            <div className="mt-2 flex flex-col gap-2 rounded-lg border border-border bg-white p-4 text-sm">
              {product.ingredients && (
                <p>
                  <span className="font-medium">Ingrédients : </span>
                  {product.ingredients}
                </p>
              )}
              {product.allergens && (
                <p>
                  <span className="font-medium">Allergènes : </span>
                  {product.allergens}
                </p>
              )}
              {product.prepTimeMinutes != null && (
                <p>
                  <span className="font-medium">Préparation : </span>
                  ~{product.prepTimeMinutes} min
                </p>
              )}
            </div>
          )}

          <p className="text-xs text-muted">
            Réf. {product.sku} — Retrait en boutique uniquement, réservé aux
            titulaires d&apos;un compte fidélité.
          </p>
        </div>
      </div>

      {related.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold">Souvent acheté avec</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {related.map((r) => (
              <Link
                key={r.id}
                href={`/produits/${r.slug}`}
                className="rounded-xl border border-border bg-white p-4 hover:border-brand hover:shadow-sm"
              >
                <p className="font-medium">{r.name}</p>
                <p className="text-sm text-brand-dark">{formatPrice(getEffectivePrice(r))}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
