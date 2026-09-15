/** Prices in this app are TTC (tax-included). This just derives the HT/VAT breakdown for display. */
export function splitVat(amountTTC: number, vatRatePercent: number) {
  const amountHT = Math.round((amountTTC / (1 + vatRatePercent / 100)) * 100) / 100;
  const vatAmount = Math.round((amountTTC - amountHT) * 100) / 100;
  return { amountHT, vatAmount, amountTTC };
}

/** Groups order lines by VAT rate and sums the HT/VAT breakdown for each — for receipts and exports. */
export function computeVatBreakdown(
  lines: { amountTTC: number; vatRate: number }[]
) {
  const byRate = new Map<number, { amountHT: number; vatAmount: number; amountTTC: number }>();
  for (const line of lines) {
    const split = splitVat(line.amountTTC, line.vatRate);
    const existing = byRate.get(line.vatRate) ?? { amountHT: 0, vatAmount: 0, amountTTC: 0 };
    byRate.set(line.vatRate, {
      amountHT: Math.round((existing.amountHT + split.amountHT) * 100) / 100,
      vatAmount: Math.round((existing.vatAmount + split.vatAmount) * 100) / 100,
      amountTTC: Math.round((existing.amountTTC + split.amountTTC) * 100) / 100,
    });
  }
  const rows = Array.from(byRate.entries())
    .map(([vatRate, totals]) => ({ vatRate, ...totals }))
    .sort((a, b) => a.vatRate - b.vatRate);
  const totalHT = Math.round(rows.reduce((s, r) => s + r.amountHT, 0) * 100) / 100;
  const totalVat = Math.round(rows.reduce((s, r) => s + r.vatAmount, 0) * 100) / 100;
  return { rows, totalHT, totalVat };
}
