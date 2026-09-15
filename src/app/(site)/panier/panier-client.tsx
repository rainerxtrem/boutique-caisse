"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/components/cart-context";
import { Button, Card, Select } from "@/components/ui";
import { formatPrice } from "@/lib/format";
import { computeOrderPricing } from "@/lib/pricing";
import type { PickupDay } from "@/lib/pickup";
import { checkout, previewPromoCode } from "./actions";

export function PanierClient({
  customerDiscountPercent,
  birthdayActive,
  pickupDays,
}: {
  customerDiscountPercent: number;
  birthdayActive: boolean;
  pickupDays: PickupDay[];
}) {
  const { items, setQty, removeItem, clear } = useCart();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const [promoInput, setPromoInput] = useState("");
  const [promo, setPromo] = useState<{ code: string; type: "PERCENT" | "FIXED"; value: number } | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [checkingPromo, startPromoTransition] = useTransition();

  const allSlots = pickupDays.flatMap((d) => d.slots.map((s) => ({ ...s, day: d.label })));
  const [pickupSlot, setPickupSlot] = useState<string>(allSlots[0]?.value ?? "");

  const pricing = useMemo(
    () =>
      computeOrderPricing(
        items.map((i) => ({ unitPrice: i.price, qty: i.qty })),
        { promoCode: promo, customerDiscountPercent }
      ),
    [items, promo, customerDiscountPercent]
  );

  function handleCheckPromo() {
    setPromoError(null);
    if (!promoInput.trim()) {
      setPromo(null);
      return;
    }
    startPromoTransition(async () => {
      const result = await previewPromoCode(promoInput, pricing.subtotal);
      if (!result.ok) {
        setPromoError(result.error);
        setPromo(null);
        return;
      }
      setPromo({ code: promoInput.trim().toUpperCase(), ...result.promo });
    });
  }

  function handleCheckout() {
    setError(null);
    startTransition(async () => {
      const result = await checkout(
        items.map((i) => ({ productId: i.productId, qty: i.qty })),
        { promoCode: promo?.code ?? null, pickupSlot: pickupSlot || null }
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

      {birthdayActive && (
        <div className="rounded-lg bg-brand-light p-3 text-sm text-brand-dark">
          🎂 Joyeux anniversaire ! Une remise anniversaire est appliquée
          automatiquement sur votre commande.
        </div>
      )}

      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <Card key={item.productId} className="flex items-center gap-4 p-4">
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
        {allSlots.length > 0 && (
          <div>
            <label className="mb-1.5 block text-sm font-medium">Créneau de retrait</label>
            <Select value={pickupSlot} onChange={(e) => setPickupSlot(e.target.value)}>
              {pickupDays.map((day) => (
                <optgroup key={day.date} label={day.label}>
                  {day.slots.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </Select>
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Code promo"
            value={promoInput}
            onChange={(e) => setPromoInput(e.target.value)}
            className="flex-1 rounded-lg border border-border px-3 py-2 text-sm uppercase focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
          <Button variant="secondary" onClick={handleCheckPromo} disabled={checkingPromo}>
            Appliquer
          </Button>
        </div>
        {promoError && <p className="text-sm text-danger">{promoError}</p>}
        {promo && (
          <p className="text-sm text-brand-dark">
            Code {promo.code} appliqué (
            {promo.type === "PERCENT" ? `-${promo.value}%` : `-${formatPrice(promo.value)}`})
          </p>
        )}

        <div className="flex items-center justify-between text-sm text-muted">
          <span>Sous-total</span>
          <span>{formatPrice(pricing.subtotal)}</span>
        </div>
        {pricing.discountTotal > 0 && (
          <div className="flex items-center justify-between text-sm text-muted">
            <span>Remises</span>
            <span>-{formatPrice(pricing.discountTotal)}</span>
          </div>
        )}
        <div className="flex items-center justify-between text-lg font-semibold">
          <span>Total</span>
          <span>{formatPrice(pricing.total)}</span>
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
