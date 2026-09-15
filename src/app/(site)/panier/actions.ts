"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentCustomer } from "@/lib/auth-customer";
import { withOrderNumber, creditLoyaltyPoints } from "@/lib/orders";
import { computeOrderPricing, getEffectivePrice } from "@/lib/pricing";
import { resolvePromoCode } from "@/lib/promo";
import { isBirthdayPeriod, BIRTHDAY_DISCOUNT_PERCENT, getLoyaltyTiers, resolveTier } from "@/lib/loyalty";
import { applyReferralBonusIfFirstOrder } from "@/lib/referral";

export type CheckoutInput = { productId: string; qty: number }[];
export type CheckoutResult = { error?: string; orderNumber?: string };

export async function previewPromoCode(code: string, subtotal: number) {
  const resolution = await resolvePromoCode(code, subtotal);
  if (!resolution.ok) return { ok: false as const, error: resolution.error };
  return { ok: true as const, promo: resolution.promo };
}

export async function checkout(
  items: CheckoutInput,
  options: { promoCode?: string | null; pickupSlot?: string | null } = {}
): Promise<CheckoutResult> {
  const customer = await getCurrentCustomer();
  if (!customer) {
    redirect("/connexion");
  }

  if (!items.length) {
    return { error: "Votre panier est vide." };
  }

  const products = await prisma.product.findMany({
    where: { id: { in: items.map((i) => i.productId) }, active: true },
  });

  try {
    const lines = items.map((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product) throw new Error("Produit introuvable.");
      if (product.temporarilyUnavailable) {
        throw new Error(`${product.name} est temporairement indisponible.`);
      }
      if (product.stock < item.qty) {
        throw new Error(`Stock insuffisant pour ${product.name}.`);
      }
      return { product, qty: item.qty, unitPrice: getEffectivePrice(product) };
    });

    const subtotalPreview = lines.reduce((sum, l) => sum + l.unitPrice * l.qty, 0);

    let promo: { id: string; type: "PERCENT" | "FIXED"; value: number } | null = null;
    if (options.promoCode) {
      const resolution = await resolvePromoCode(options.promoCode, subtotalPreview);
      if (!resolution.ok) return { error: resolution.error };
      promo = resolution.promo;
    }

    const tierDiscountPercent = resolveTier(await getLoyaltyTiers(), customer.lifetimePoints).current
      .discountPercent;

    const customerDiscountPercent =
      Number(customer.permanentDiscountPercent) +
      tierDiscountPercent +
      (isBirthdayPeriod(customer.birthDate) ? BIRTHDAY_DISCOUNT_PERCENT : 0);

    const pricing = computeOrderPricing(
      lines.map((l) => ({ unitPrice: l.unitPrice, qty: l.qty })),
      { promoCode: promo, customerDiscountPercent }
    );

    const number = await withOrderNumber("CMD", async (number) => {
      await prisma.$transaction(async (tx) => {
        await tx.order.create({
          data: {
            number,
            source: "WEB",
            status: "PENDING",
            subtotal: pricing.subtotal,
            discountTotal: pricing.discountTotal,
            total: pricing.total,
            promoCodeId: promo?.id,
            promoDiscount: pricing.promoDiscount,
            pickupSlot: options.pickupSlot ? new Date(options.pickupSlot) : null,
            customerId: customer.id,
            items: {
              create: lines.map((l) => ({
                productId: l.product.id,
                productName: l.product.name,
                qty: l.qty,
                unitPrice: l.unitPrice,
                discountPercent: 0,
                lineTotal: Math.round(l.unitPrice * l.qty * 100) / 100,
              })),
            },
          },
        });

        for (const l of lines) {
          await tx.product.update({
            where: { id: l.product.id },
            data: { stock: { decrement: l.qty } },
          });
        }

        if (promo) {
          await tx.promoCode.update({
            where: { id: promo.id },
            data: { usageCount: { increment: 1 } },
          });
        }

        await creditLoyaltyPoints(tx, customer.id, pricing.total);
        await applyReferralBonusIfFirstOrder(tx, customer.id);
      });
      return number;
    });

    return { orderNumber: number };
  } catch (err) {
    return {
      error:
        err instanceof Error
          ? err.message
          : "Une erreur est survenue, veuillez réessayer.",
    };
  }
}
