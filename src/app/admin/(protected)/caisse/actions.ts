"use server";

import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { withOrderNumber, creditLoyaltyPoints } from "@/lib/orders";
import { computeOrderPricing, getEffectivePrice } from "@/lib/pricing";
import { resolvePromoCode } from "@/lib/promo";
import { isBirthdayPeriod, BIRTHDAY_DISCOUNT_PERCENT, getLoyaltyTiers, resolveTier } from "@/lib/loyalty";
import { applyReferralBonusIfFirstOrder, generateUniqueReferralCode } from "@/lib/referral";
import { logAudit } from "@/lib/audit";
import { formatPrice } from "@/lib/format";

export async function findCustomerByPhone(phone: string) {
  await requirePermission("caisse.use");
  const customer = await prisma.customer.findUnique({
    where: { phone: phone.trim() },
  });
  return customer;
}

export type CustomerSearchResult = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  points: number;
  permanentDiscountPercent: number;
  tierLabel: string;
  tierDiscountPercent: number;
};

export async function searchCustomers(query: string): Promise<CustomerSearchResult[]> {
  await requirePermission("caisse.use");
  const q = query.trim();
  if (q.length < 2) return [];

  const [customers, tiers] = await Promise.all([
    prisma.customer.findMany({
      where: {
        OR: [
          { firstName: { contains: q, mode: "insensitive" } },
          { lastName: { contains: q, mode: "insensitive" } },
          { phone: { contains: q } },
        ],
      },
      orderBy: { firstName: "asc" },
      take: 8,
    }),
    getLoyaltyTiers(),
  ]);

  return customers.map((c) => {
    const tier = resolveTier(tiers, c.lifetimePoints).current;
    return {
      id: c.id,
      firstName: c.firstName,
      lastName: c.lastName,
      phone: c.phone,
      points: c.points,
      permanentDiscountPercent: Number(c.permanentDiscountPercent),
      tierLabel: tier.label,
      tierDiscountPercent: tier.discountPercent,
    };
  });
}

export type CreateFlashCustomerResult =
  | { success: true; customer: CustomerSearchResult; referralRegistered: boolean }
  | { success: false; error: string };

export async function createFlashCustomer(
  firstName: string,
  lastName: string,
  phone: string,
  referredByCode?: string
): Promise<CreateFlashCustomerResult> {
  await requirePermission("caisse.use");

  const cleanPhone = phone.trim();
  if (!cleanPhone || cleanPhone.length < 6) {
    return { success: false, error: "Numéro de téléphone invalide." };
  }
  if (!firstName.trim()) {
    return { success: false, error: "Prénom requis." };
  }

  const existing = await prisma.customer.findUnique({ where: { phone: cleanPhone } });
  if (existing) {
    return { success: false, error: "Un compte existe déjà avec ce numéro." };
  }

  let referredById: string | null = null;
  const referredByCodeRaw = referredByCode?.trim();
  if (referredByCodeRaw) {
    const referrer = await prisma.customer.findUnique({
      where: { referralCode: referredByCodeRaw.toUpperCase() },
    });
    if (!referrer) {
      return { success: false, error: "Code de parrainage introuvable." };
    }
    if (referrer.phone === cleanPhone) {
      return { success: false, error: "Un client ne peut pas être son propre parrain." };
    }
    referredById = referrer.id;
  }

  const referralCode = await generateUniqueReferralCode();
  const customer = await prisma.customer.create({
    data: {
      firstName: firstName.trim(),
      lastName: lastName.trim() || "—",
      phone: cleanPhone,
      referralCode,
      referredById,
    },
  });

  const tiers = await getLoyaltyTiers();
  const tier = resolveTier(tiers, customer.lifetimePoints).current;

  return {
    success: true,
    customer: {
      id: customer.id,
      firstName: customer.firstName,
      lastName: customer.lastName,
      phone: customer.phone,
      points: customer.points,
      permanentDiscountPercent: Number(customer.permanentDiscountPercent),
      tierLabel: tier.label,
      tierDiscountPercent: tier.discountPercent,
    },
    referralRegistered: referredById != null,
  };
}

export async function previewPromoCode(code: string, subtotal: number) {
  await requirePermission("caisse.use");
  const resolution = await resolvePromoCode(code, subtotal);
  if (!resolution.ok) return { ok: false as const, error: resolution.error };
  return { ok: true as const, promo: resolution.promo };
}

export type CustomerRewardRedemption = {
  id: string;
  rewardName: string;
  type: "PERCENT" | "FIXED";
  value: number;
};

export async function getCustomerRewardRedemptions(
  customerId: string
): Promise<CustomerRewardRedemption[]> {
  await requirePermission("caisse.use");
  const redemptions = await prisma.rewardRedemption.findMany({
    where: {
      customerId,
      status: "PENDING",
      reward: { active: true, type: { in: ["PERCENT", "FIXED"] } },
    },
    include: { reward: true },
    orderBy: { createdAt: "asc" },
  });

  return redemptions.map((r) => ({
    id: r.id,
    rewardName: r.reward.name,
    type: r.reward.type as "PERCENT" | "FIXED",
    value: Number(r.reward.value),
  }));
}

export type SaleLine = {
  productId: string;
  qty: number;
  discountPercent: number;
};

export type PaymentMethod = "CASH" | "CARD" | "MIXED";

export type CompleteSaleResult =
  | {
      success: true;
      orderNumber: string;
      total: number;
      changeGiven: number;
    }
  | { success: false; error: string };

export async function completeSale(
  lines: SaleLine[],
  customerId: string | null,
  globalDiscountPercent: number,
  promoCodeInput: string | null,
  payment: { method: PaymentMethod; amountPaid: number | null },
  registerLabel: string | null,
  rewardRedemptionId: string | null = null
): Promise<CompleteSaleResult> {
  const session = await requirePermission("caisse.use");

  if (!lines.length) {
    return { success: false, error: "Le ticket est vide." };
  }

  const products = await prisma.product.findMany({
    where: { id: { in: lines.map((l) => l.productId) } },
  });

  const customer = customerId
    ? await prisma.customer.findUnique({ where: { id: customerId } })
    : null;

  try {
    const computedLines = lines.map((line) => {
      const product = products.find((p) => p.id === line.productId);
      if (!product) throw new Error("Article introuvable.");
      if (product.temporarilyUnavailable) {
        throw new Error(`${product.name} est temporairement indisponible.`);
      }
      if (product.stock < line.qty) {
        throw new Error(`Stock insuffisant pour ${product.name}.`);
      }
      return {
        product,
        qty: line.qty,
        unitPrice: getEffectivePrice(product),
        discountPercent: line.discountPercent,
      };
    });

    const subtotalPreview = computedLines.reduce(
      (sum, l) => sum + l.unitPrice * l.qty * (1 - l.discountPercent / 100),
      0
    );

    let promo: { id: string; type: "PERCENT" | "FIXED"; value: number } | null = null;
    if (promoCodeInput) {
      const resolution = await resolvePromoCode(promoCodeInput, subtotalPreview);
      if (!resolution.ok) throw new Error(resolution.error);
      promo = resolution.promo;
    }

    let rewardDiscountInput: { type: "PERCENT" | "FIXED"; value: number } | null = null;
    let rewardRedemptionName: string | null = null;
    if (rewardRedemptionId) {
      if (!customerId) throw new Error("Sélectionnez un client pour appliquer une récompense.");
      const found = await prisma.rewardRedemption.findUnique({
        where: { id: rewardRedemptionId },
        include: { reward: true },
      });
      if (!found) throw new Error("Récompense introuvable.");
      if (found.status !== "PENDING") throw new Error("Cette récompense a déjà été utilisée.");
      if (found.customerId !== customerId) {
        throw new Error("Cette récompense n'appartient pas au client sélectionné.");
      }
      if (!found.reward.active || found.reward.type === "PHYSICAL") {
        throw new Error("Cette récompense n'est plus applicable en caisse.");
      }
      rewardDiscountInput = {
        type: found.reward.type as "PERCENT" | "FIXED",
        value: Number(found.reward.value),
      };
      rewardRedemptionName = found.reward.name;
    }

    const customerTierDiscountPercent = customer
      ? resolveTier(await getLoyaltyTiers(), customer.lifetimePoints).current.discountPercent
      : 0;

    const customerDiscountPercent =
      (customer ? Number(customer.permanentDiscountPercent) : 0) +
      customerTierDiscountPercent +
      (customer && isBirthdayPeriod(customer.birthDate) ? BIRTHDAY_DISCOUNT_PERCENT : 0);

    const pricing = computeOrderPricing(
      computedLines.map((l) => ({
        unitPrice: l.unitPrice,
        qty: l.qty,
        discountPercent: l.discountPercent,
      })),
      {
        promoCode: promo,
        customerDiscountPercent,
        rewardDiscount: rewardDiscountInput,
        globalDiscountPercent,
      }
    );

    const changeGiven =
      payment.method !== "CARD" && payment.amountPaid != null
        ? Math.max(0, Math.round((payment.amountPaid - pricing.total) * 100) / 100)
        : 0;

    const number = await withOrderNumber("CAI", async (number) => {
      await prisma.$transaction(async (tx) => {
        const order = await tx.order.create({
          data: {
            number,
            source: "CAISSE",
            status: "COMPLETED",
            subtotal: pricing.subtotal,
            discountTotal: pricing.discountTotal,
            total: pricing.total,
            promoCodeId: promo?.id,
            promoDiscount: pricing.promoDiscount,
            rewardDiscount: pricing.rewardDiscount,
            paymentMethod: payment.method,
            amountPaid: payment.amountPaid ?? pricing.total,
            changeGiven,
            registerLabel: registerLabel || undefined,
            customerId: customerId ?? undefined,
            userId: session.userId,
            items: {
              create: computedLines.map((l) => ({
                productId: l.product.id,
                productName: l.product.name,
                qty: l.qty,
                unitPrice: l.unitPrice,
                discountPercent: l.discountPercent,
                lineTotal:
                  Math.round(l.unitPrice * l.qty * (1 - l.discountPercent / 100) * 100) / 100,
              })),
            },
          },
        });

        for (const l of computedLines) {
          await tx.product.update({
            where: { id: l.product.id },
            data: { stock: { decrement: l.qty } },
          });
        }

        const offeredLines = computedLines.filter((l) => l.discountPercent === 100);
        if (globalDiscountPercent === 100) {
          await logAudit(tx, {
            actorId: session.userId,
            actorName: session.name,
            action: "sale.offered",
            entityType: "Order",
            entityId: order.id,
            summary: `Panier entièrement offert sur le ticket ${number} (valeur ${formatPrice(pricing.subtotal)})`,
          });
        } else if (offeredLines.length > 0) {
          const names = offeredLines.map((l) => l.product.name).join(", ");
          const value = offeredLines.reduce((sum, l) => sum + l.unitPrice * l.qty, 0);
          await logAudit(tx, {
            actorId: session.userId,
            actorName: session.name,
            action: "sale.item_offered",
            entityType: "Order",
            entityId: order.id,
            summary: `Article(s) offert(s) sur le ticket ${number} : ${names} (valeur ${formatPrice(value)})`,
          });
        }

        if (rewardRedemptionId) {
          await tx.rewardRedemption.update({
            where: { id: rewardRedemptionId },
            data: {
              status: "FULFILLED",
              fulfilledAt: new Date(),
              fulfilledById: session.userId,
              orderId: order.id,
            },
          });
          await logAudit(tx, {
            actorId: session.userId,
            actorName: session.name,
            action: "reward.applied_caisse",
            entityType: "RewardRedemption",
            entityId: rewardRedemptionId,
            summary: `Récompense "${rewardRedemptionName}" appliquée à la commande ${number} (-${formatPrice(pricing.rewardDiscount)})`,
          });
        }

        if (promo) {
          await tx.promoCode.update({
            where: { id: promo.id },
            data: { usageCount: { increment: 1 } },
          });
        }

        if (customerId) {
          await creditLoyaltyPoints(tx, customerId, pricing.total);
          await applyReferralBonusIfFirstOrder(tx, customerId);
        }
      });
      return number;
    });

    return { success: true, orderNumber: number, total: pricing.total, changeGiven };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erreur lors de la vente.",
    };
  }
}
