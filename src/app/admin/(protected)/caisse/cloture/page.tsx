import { prisma } from "@/lib/db";
import { Badge, Button, Card, Input, Label, Textarea } from "@/components/ui";
import { formatDate, formatPrice } from "@/lib/format";
import { requirePermission } from "@/lib/permissions";
import { createCashClosing } from "./actions";

export default async function ClotureCaissePage() {
  await requirePermission("caisse.cloture");
  const lastClosing = await prisma.cashClosing.findFirst({
    orderBy: { periodEnd: "desc" },
  });

  const periodStart = lastClosing?.periodEnd ?? new Date(0);
  const periodEnd = new Date();

  const orders = await prisma.order.findMany({
    where: {
      source: "CAISSE",
      status: { not: "CANCELLED" },
      createdAt: { gt: periodStart, lte: periodEnd },
    },
  });

  const expectedCash = orders
    .filter((o) => o.paymentMethod === "CASH")
    .reduce((sum, o) => sum + Number(o.total), 0);
  const expectedCard = orders
    .filter((o) => o.paymentMethod === "CARD")
    .reduce((sum, o) => sum + Number(o.total), 0);
  const mixedTotal = orders
    .filter((o) => o.paymentMethod === "MIXED")
    .reduce((sum, o) => sum + Number(o.total), 0);

  const history = await prisma.cashClosing.findMany({
    include: { closedBy: true },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Clôture de caisse</h1>
        <p className="text-sm text-muted">Rapport Z depuis la dernière clôture.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="mb-3 font-semibold">
            Période du {formatDate(periodStart)} au {formatDate(periodEnd)}
          </h2>
          <div className="mb-4 flex flex-col gap-1 text-sm">
            <div className="flex justify-between">
              <span>Ventes espèces (attendu)</span>
              <span className="font-medium">{formatPrice(expectedCash)}</span>
            </div>
            <div className="flex justify-between">
              <span>Ventes carte (attendu)</span>
              <span className="font-medium">{formatPrice(expectedCard)}</span>
            </div>
            {mixedTotal > 0 && (
              <div className="flex justify-between text-muted">
                <span>Ventes en paiement mixte (à répartir manuellement)</span>
                <span>{formatPrice(mixedTotal)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-border pt-1 font-semibold">
              <span>{orders.length} vente(s)</span>
              <span>{formatPrice(expectedCash + expectedCard + mixedTotal)}</span>
            </div>
          </div>

          <form action={createCashClosing} className="flex flex-col gap-4">
            <input type="hidden" name="periodStart" value={periodStart.toISOString()} />
            <input type="hidden" name="periodEnd" value={periodEnd.toISOString()} />
            <input type="hidden" name="expectedCash" value={expectedCash} />
            <input type="hidden" name="expectedCard" value={expectedCard} />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="declaredCash">Espèces comptées (€)</Label>
                <Input
                  id="declaredCash"
                  name="declaredCash"
                  type="number"
                  step="0.01"
                  defaultValue={expectedCash.toFixed(2)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="declaredCard">Carte relevée (€)</Label>
                <Input
                  id="declaredCard"
                  name="declaredCard"
                  type="number"
                  step="0.01"
                  defaultValue={expectedCard.toFixed(2)}
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="notes">Notes (optionnel)</Label>
              <Textarea id="notes" name="notes" rows={2} />
            </div>
            <Button type="submit">Clôturer la caisse</Button>
          </form>
        </Card>

        <Card className="p-6">
          <h2 className="mb-3 font-semibold">Historique des clôtures</h2>
          {history.length === 0 ? (
            <p className="text-sm text-muted">Aucune clôture enregistrée.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {history.map((h) => (
                <li key={h.id} className="border-b border-border pb-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{formatDate(h.createdAt)}</span>
                    <Badge tone={Number(h.difference) === 0 ? "brand" : "warning"}>
                      {Number(h.difference) === 0
                        ? "Aucun écart"
                        : `Écart ${Number(h.difference) > 0 ? "+" : ""}${formatPrice(Number(h.difference))}`}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted">
                    Par {h.closedBy?.name ?? "—"} · Espèces {formatPrice(Number(h.declaredCash))} · Carte{" "}
                    {formatPrice(Number(h.declaredCard))}
                  </p>
                  {h.notes && <p className="mt-1 text-xs italic text-muted">{h.notes}</p>}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
