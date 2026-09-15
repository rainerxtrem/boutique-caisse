import Link from "next/link";
import { Badge, Card } from "@/components/ui";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { FavoriteButton } from "@/components/favorite-button";
import { formatPrice } from "@/lib/format";
import { getEffectivePrice } from "@/lib/pricing";

export type ProductCardData = {
  id: string;
  name: string;
  slug: string;
  price: number;
  flashPrice: number | null;
  flashPriceEndsAt: string | null;
  stock: number;
  temporarilyUnavailable: boolean;
  imageUrl: string | null;
  category: { name: string } | null;
  isFavorite?: boolean;
};

export function ProductCard({
  product,
  isLoggedIn = false,
}: {
  product: ProductCardData;
  isLoggedIn?: boolean;
}) {
  const outOfStock = product.stock <= 0 || product.temporarilyUnavailable;
  const effectivePrice = getEffectivePrice(product);
  const onFlash = effectivePrice < product.price;

  return (
    <Card className="flex flex-col overflow-hidden">
      <Link href={`/produits/${product.slug}`} className="relative block">
        <div className="flex aspect-square items-center justify-center bg-brand-light text-4xl font-semibold text-brand-dark">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.imageUrl}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          ) : (
            product.name.slice(0, 1).toUpperCase()
          )}
        </div>
        <FavoriteButton
          productId={product.id}
          initialFavorite={product.isFavorite ?? false}
          isLoggedIn={isLoggedIn}
          className="absolute right-2 top-2"
        />
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/produits/${product.slug}`}
            className="font-medium text-foreground hover:text-brand"
          >
            {product.name}
          </Link>
          {product.category && (
            <Badge tone="muted">{product.category.name}</Badge>
          )}
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="text-lg font-semibold text-brand-dark">
              {formatPrice(effectivePrice)}
            </span>
            {onFlash && (
              <span className="text-sm text-muted line-through">
                {formatPrice(product.price)}
              </span>
            )}
          </span>
          {product.temporarilyUnavailable ? (
            <Badge tone="warning">Indisponible</Badge>
          ) : product.stock <= 0 ? (
            <Badge tone="danger">Rupture</Badge>
          ) : product.stock <= 5 ? (
            <Badge tone="warning">Stock faible ({product.stock})</Badge>
          ) : (
            <Badge tone="brand">En stock</Badge>
          )}
        </div>
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
      </div>
    </Card>
  );
}
