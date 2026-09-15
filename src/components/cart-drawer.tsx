"use client";

import Link from "next/link";
import { useCart } from "@/components/cart-context";
import { Button } from "@/components/ui";
import { EmptyState } from "@/components/empty-state";
import { formatPrice } from "@/lib/format";

export function CartDrawer() {
  const { items, isDrawerOpen, closeDrawer, setQty, removeItem, totalPrice } = useCart();

  if (!isDrawerOpen) return null;

  return (
    <div className="fixed inset-0 z-40">
      <div
        className="absolute inset-0 bg-black/30"
        onClick={closeDrawer}
        aria-hidden="true"
      />
      <div className="absolute right-0 top-0 flex h-full w-full max-w-sm flex-col bg-surface shadow-xl">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="font-semibold">Mon panier</h2>
          <button
            onClick={closeDrawer}
            className="rounded-lg px-2 py-1 text-muted hover:bg-gray-100"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
          {items.length === 0 ? (
            <EmptyState icon="cart" title="Panier vide" description="Ajoutez des produits depuis le catalogue." />
          ) : (
            <div className="flex flex-col gap-3">
              {items.map((item) => (
                <div key={item.productId} className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-brand-light text-sm font-semibold text-brand-dark">
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.imageUrl} alt={item.name} className="h-full w-full rounded-lg object-cover" />
                    ) : (
                      item.name.slice(0, 1).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted">{formatPrice(item.price)}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setQty(item.productId, item.qty - 1)}
                      className="h-6 w-6 rounded border border-border text-sm hover:bg-gray-50"
                    >
                      −
                    </button>
                    <span className="w-5 text-center text-sm">{item.qty}</span>
                    <button
                      onClick={() => setQty(item.productId, item.qty + 1)}
                      className="h-6 w-6 rounded border border-border text-sm hover:bg-gray-50"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => removeItem(item.productId)}
                    className="text-xs text-danger hover:underline"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-border p-4">
            <div className="mb-3 flex items-center justify-between font-semibold">
              <span>Total</span>
              <span>{formatPrice(totalPrice)}</span>
            </div>
            <Link href="/panier" onClick={closeDrawer}>
              <Button className="w-full">Commander</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
