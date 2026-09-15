"use client";

import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart-context";
import { Button } from "@/components/ui";

export function ReorderButton({
  items,
}: {
  items: { productId: string | null; name: string; price: number }[];
}) {
  const { addItem } = useCart();
  const router = useRouter();

  const orderable = items.filter(
    (i): i is { productId: string; name: string; price: number } => !!i.productId
  );

  if (orderable.length === 0) return null;

  return (
    <Button
      variant="secondary"
      className="!py-1.5 text-xs"
      onClick={() => {
        for (const item of orderable) {
          addItem({ productId: item.productId, name: item.name, price: item.price, imageUrl: null });
        }
        router.push("/panier");
      }}
    >
      Recommander
    </Button>
  );
}
