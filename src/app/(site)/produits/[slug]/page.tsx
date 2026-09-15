import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { formatPrice } from "@/lib/format";

export default async function ProductPage({
  params,
}: PageProps<"/produits/[slug]">) {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug, active: true },
    include: { category: true },
  });

  if (!product) notFound();

  const outOfStock = product.stock <= 0;

  return (
    <div className="flex flex-col gap-6">
      <Link href="/" className="text-sm text-muted hover:text-foreground">
        ← Retour au catalogue
      </Link>
      <div className="grid gap-8 sm:grid-cols-2">
        <div className="flex aspect-square items-center justify-center rounded-2xl bg-brand-light text-6xl font-semibold text-brand-dark">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.imageUrl}
              alt={product.name}
              className="h-full w-full rounded-2xl object-cover"
            />
          ) : (
            product.name.slice(0, 1).toUpperCase()
          )}
        </div>
        <div className="flex flex-col gap-4">
          {product.category && (
            <Badge tone="muted" className="w-fit">
              {product.category.name}
            </Badge>
          )}
          <h1 className="text-2xl font-semibold">{product.name}</h1>
          {product.description && (
            <p className="text-muted">{product.description}</p>
          )}
          <div className="text-3xl font-semibold text-brand-dark">
            {formatPrice(Number(product.price))}
          </div>
          {outOfStock ? (
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
                price: Number(product.price),
                imageUrl: product.imageUrl,
              }}
              disabled={outOfStock}
            />
          </div>
          <p className="text-xs text-muted">
            Réf. {product.sku} — Retrait en boutique uniquement, réservé aux
            titulaires d&apos;un compte fidélité.
          </p>
        </div>
      </div>
    </div>
  );
}
