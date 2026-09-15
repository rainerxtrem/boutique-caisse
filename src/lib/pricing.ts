// Pure pricing math shared between the web checkout (panier) and the caisse,
// so both apply discounts in the exact same order. No DB/server access here
// so it can also run client-side for live totals in the caisse UI.

export type PricingLine = {
  unitPrice: number;
  qty: number;
  discountPercent?: number;
};

export type PricingOptions = {
  promoCode?: { type: "PERCENT" | "FIXED"; value: number } | null;
  /** Combined customer-based discount (permanent discount + active birthday offer, already summed). */
  customerDiscountPercent?: number;
  /** Loyalty reward redeemed by the customer and applied at checkout (caisse only, for now). */
  rewardDiscount?: { type: "PERCENT" | "FIXED"; value: number } | null;
  /** Manual discount applied by staff at the register. */
  globalDiscountPercent?: number;
};

export type PricingResult = {
  subtotal: number;
  promoDiscount: number;
  customerDiscount: number;
  rewardDiscount: number;
  globalDiscount: number;
  discountTotal: number;
  total: number;
};

type Numeric = number | string | { toString(): string };

export function getEffectivePrice(product: {
  price: Numeric;
  flashPrice?: Numeric | null;
  flashPriceEndsAt?: Date | string | null;
}) {
  const flash = product.flashPrice != null ? Number(product.flashPrice) : null;
  const endsAt = product.flashPriceEndsAt ? new Date(product.flashPriceEndsAt) : null;
  if (flash != null && endsAt && endsAt.getTime() > Date.now()) {
    return flash;
  }
  return Number(product.price);
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export function computeOrderPricing(
  lines: PricingLine[],
  options: PricingOptions = {}
): PricingResult {
  const subtotal = round2(
    lines.reduce((sum, l) => {
      const gross = l.unitPrice * l.qty;
      const discount = gross * ((l.discountPercent ?? 0) / 100);
      return sum + (gross - discount);
    }, 0)
  );

  let running = subtotal;

  const promoDiscount = round2(
    !options.promoCode
      ? 0
      : options.promoCode.type === "PERCENT"
        ? running * (options.promoCode.value / 100)
        : Math.min(options.promoCode.value, running)
  );
  running = round2(Math.max(0, running - promoDiscount));

  const customerDiscount = round2(running * ((options.customerDiscountPercent ?? 0) / 100));
  running = round2(Math.max(0, running - customerDiscount));

  const rewardDiscount = round2(
    !options.rewardDiscount
      ? 0
      : options.rewardDiscount.type === "PERCENT"
        ? running * (options.rewardDiscount.value / 100)
        : Math.min(options.rewardDiscount.value, running)
  );
  running = round2(Math.max(0, running - rewardDiscount));

  const globalDiscount = round2(running * ((options.globalDiscountPercent ?? 0) / 100));
  running = round2(Math.max(0, running - globalDiscount));

  return {
    subtotal,
    promoDiscount,
    customerDiscount,
    rewardDiscount,
    globalDiscount,
    discountTotal: round2(promoDiscount + customerDiscount + rewardDiscount + globalDiscount),
    total: Math.max(0, running),
  };
}
