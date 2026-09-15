"use server";

import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth-staff";
import { withOrderNumber, creditLoyaltyPoints } from "@/lib/orders";
import { computeOrderPricing, getEffectivePrice } from "@/lib/pricing";
import { resolvePromoCode } from "@/lib/promo";
import { isBirthdayPeriod, BIRTHDAY_DISCOUNT_PERCENT } from "@/lib/loyalty";
import { applyReferralBonusIfFirstOrder, generateUniqueReferralCode } from "@/lib/referral";

export async function findCustomerByPhone(phone: string) {
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
};

export async function searchCustomers(query: string): Promise<CustomerSearchResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const customers = await prisma.customer.findMany({
    where: {
      OR: [
        { firstName: { contains: q, mode: "insensitive" } },
        { lastName: { contains: q, mode: "insensitive" } },
        { phone: { contains: q } },
      ],
    },
    orderBy: { firstName: "asc" },
    take: 8,
  });

  return customers.map((c) => ({
    id: c.id,
    firstName: c.firstName,
    lastName: c.lastName,
    phone: c.phone,
    points: c.points,
    permanentDiscountPercent: Number(c.permanentDiscountPercent),
  }));
}

export type CreateFlashCustomerResult =
  | { success: true; customer: CustomerSearchResult }
  | { success: false; error: string };

export async function createFlashCustomer(
  firstName: string,
  lastName: string,
  phone: string
): Promise<CreateFlashCustomerResult> {
  await requireStaff();

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

  const referralCode = await generateUniqueReferralCode();
  const customer = await prisma.customer.create({
    data: {
      firstName: firstName.trim(),
      lastName: lastName.trim() || "—",
      phone: cleanPhone,
      referralCode,
    },
  });

  return {
    success: true,
    customer: {
      id: customer.id,
      firstName: customer.firstName,
      lastName: customer.lastName,
      phone: customer.phone,
      points: customer.points,
      permanentDiscountPercent: Number(customer.permanentDiscountPercent),
    },
  };
}

export async function previewPromoCode(code: string, subtotal: number) {
  const resolution = await resolvePromoCode(code, subtotal);
  if (!resolution.ok) return { ok: false as const, error: resolution.error };
  return { ok: true as const, promo: resolution.promo };
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
  registerLabel: string | null
): Promise<CompleteSaleResult> {
  const session = await requireStaff();

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

    const customerDiscountPercent =
      (customer ? Number(customer.permanentDiscountPercent) : 0) +
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
        globalDiscountPercent,
      }
    );

    const changeGiven =
      payment.method !== "CARD" && payment.amountPaid != null
        ? Math.max(0, Math.round((payment.amountPaid - pricing.total) * 100) / 100)
        : 0;

    const number = await withOrderNumber("CAI", async (number) => {
      await prisma.$transaction(async (tx) => {
        await tx.order.create({
          data: {
            number,
            source: "CAISSE",
            status: "COMPLETED",
            subtotal: pricing.subtotal,
            discountTotal: pricing.discountTotal,
            total: pricing.total,
            promoCodeId: promo?.id,
            promoDiscount: pricing.promoDiscount,
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
