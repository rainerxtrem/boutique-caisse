"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/components/cart-context";
import { Button, Card } from "@/components/ui";
import { formatPrice } from "@/lib/format";
import { checkout } from "./actions";

export default function PanierPage() {
  const { items, setQty, removeItem, totalPrice, clear } = useCart();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleCheckout() {
    setError(null);
    startTransition(async () => {
      const result = await checkout(
        items.map((i) => ({ productId: i.productId, qty: i.qty }))
      );
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.orderNumber) {
        clear();
        router.push(`/commande/${result.orderNumber}`);
      }
    });
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-white py-16 text-center text-muted">
        Votre panier est vide.{" "}
        <Link href="/" className="text-brand hover:underline">
          Retour au catalogue
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Mon panier</h1>

      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <Card
            key={item.productId}
            className="flex items-center gap-4 p-4"
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-brand-light text-lg font-semibold text-brand-dark">
              {item.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="h-full w-full rounded-lg object-cover"
                />
              ) : (
                item.name.slice(0, 1).toUpperCase()
              )}
            </div>
            <div className="flex-1">
              <p className="font-medium">{item.name}</p>
              <p className="text-sm text-muted">{formatPrice(item.price)}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setQty(item.productId, item.qty - 1)}
                className="h-8 w-8 rounded-lg border border-border text-lg hover:bg-gray-50"
              >
                −
              </button>
              <span className="w-6 text-center">{item.qty}</span>
              <button
                type="button"
                onClick={() => setQty(item.productId, item.qty + 1)}
                className="h-8 w-8 rounded-lg border border-border text-lg hover:bg-gray-50"
              >
                +
              </button>
            </div>
            <div className="w-20 text-right font-semibold">
              {formatPrice(item.price * item.qty)}
            </div>
            <button
              type="button"
              onClick={() => removeItem(item.productId)}
              className="text-sm text-danger hover:underline"
            >
              Retirer
            </button>
          </Card>
        ))}
      </div>

      <Card className="flex flex-col gap-4 p-6">
        <div className="flex items-center justify-between text-lg font-semibold">
          <span>Total</span>
          <span>{formatPrice(totalPrice)}</span>
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        <Button onClick={handleCheckout} disabled={pending}>
          {pending ? "Validation..." : "Valider la commande (retrait en boutique)"}
        </Button>
        <p className="text-xs text-muted">
          Le paiement s&apos;effectue directement en boutique lors du
          retrait de votre commande.
        </p>
      </Card>
    </div>
  );
}
