import Link from "next/link";
import { Badge, Card } from "@/components/ui";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { formatPrice } from "@/lib/format";

export type ProductCardData = {
  id: string;
  name: string;
  slug: string;
  price: number;
  stock: number;
  imageUrl: string | null;
  category: { name: string } | null;
};

export function ProductCard({ product }: { product: ProductCardData }) {
  const outOfStock = product.stock <= 0;

  return (
    <Card className="flex flex-col overflow-hidden">
      <Link href={`/produits/${product.slug}`} className="block">
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
          <span className="text-lg font-semibold text-brand-dark">
            {formatPrice(product.price)}
          </span>
          {outOfStock ? (
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
              price: product.price,
              imageUrl: product.imageUrl,
            }}
            disabled={outOfStock}
          />
        </div>
      </div>
    </Card>
  );
}
