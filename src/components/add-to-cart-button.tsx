"use client";

import { useState } from "react";
import { useCart } from "@/components/cart-context";
import { useToast } from "@/components/toast-provider";
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
  const { showToast } = useToast();
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
        showToast(`${product.name} ajouté au panier.`);
        setTimeout(() => setAdded(false), 1200);
      }}
    >
      {disabled ? "Rupture de stock" : added ? "Ajouté ✓" : "Ajouter au panier"}
    </Button>
  );
}
