import "server-only";
import { prisma } from "@/lib/db";

export type PromoCodeResolution =
  | { ok: true; promo: { id: string; type: "PERCENT" | "FIXED"; value: number } }
  | { ok: false; error: string };

export async function resolvePromoCode(
  code: string,
  subtotal: number
): Promise<PromoCodeResolution> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return { ok: false, error: "Code requis." };

  const promo = await prisma.promoCode.findUnique({ where: { code: normalized } });
  if (!promo || !promo.active) return { ok: false, error: "Code promo invalide." };

  const now = new Date();
  if (promo.startsAt && now < promo.startsAt) {
    return { ok: false, error: "Ce code n'est pas encore actif." };
  }
  if (promo.endsAt && now > promo.endsAt) {
    return { ok: false, error: "Ce code a expiré." };
  }
  if (promo.usageLimit !== null && promo.usageCount >= promo.usageLimit) {
    return { ok: false, error: "Ce code a atteint sa limite d'utilisation." };
  }
  if (promo.minOrderAmount && subtotal < Number(promo.minOrderAmount)) {
    return {
      ok: false,
      error: `Montant minimum de ${Number(promo.minOrderAmount).toFixed(2)}€ requis pour ce code.`,
    };
  }

  return {
    ok: true,
    promo: { id: promo.id, type: promo.type, value: Number(promo.value) },
  };
}
