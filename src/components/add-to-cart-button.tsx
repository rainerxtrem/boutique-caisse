"use client";

import { useState } from "react";
import { useCart } from "@/components/cart-context";
import { Button } from "@/components/ui";

export function AddToCartButton({
  product,
  disabled,
}: {
  product: {
    id: string;
    name: string;
    price: number;
    imageUrl: string | null;
  };
  disabled?: boolean;
}) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  return (
    <Button
      type="button"
      disabled={disabled}
      onClick={() => {
        addItem({
          productId: product.id,
          name: product.name,
          price: product.price,
          imageUrl: product.imageUrl,
        });
        setAdded(true);
        setTimeout(() => setAdded(false), 1200);
      }}
    >
      {disabled ? "Rupture de stock" : added ? "Ajouté ✓" : "Ajouter au panier"}
    </Button>
  );
}
