import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentCustomer } from "@/lib/auth-customer";
import { Badge, Card } from "@/components/ui";
import { PrintButton } from "@/components/print-button";
import { QrCode } from "@/components/qr-code";
import { formatDate, formatPrice } from "@/lib/format";
import { computeVatBreakdown } from "@/lib/tax";
import { getBaseUrl } from "@/lib/base-url";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "En attente de préparation",
  READY: "Prête à être retirée",
  COMPLETED: "Retirée / terminée",
  CANCELLED: "Annulée",
  REFUNDED: "Remboursée",
  PARTIALLY_REFUNDED: "Partiellement remboursée",
};

const PAYMENT_LABEL: Record<string, string> = {
  CASH: "Espèces",
  CARD: "Carte bancaire",
  MIXED: "Paiement mixte",
};

export default async function OrderConfirmationPage({
  params,
}: PageProps<"/commande/[number]">) {
  const { number } = await params;
  const customer = await getCurrentCustomer();
  if (!customer) notFound();

  const order = await prisma.order.findUnique({
    where: { number },
    include: {
      items: { include: { product: { select: { vatRate: true } } } },
      refunds: { include: { items: true } },
    },
  });

  if (!order || order.customerId !== customer.id) notFound();

  const isCaisse = order.source === "CAISSE";
  const totalRefunded = order.refunds.reduce((sum, r) => sum + Number(r.amount), 0);
  const vat = computeVatBreakdown(
    order.items.map((item) => ({
      amountTTC: Number(item.lineTotal),
      vatRate: item.product ? Number(item.product.vatRate) : 20,
    }))
  );
  const baseUrl = await getBaseUrl();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div className="no-print text-center">
        <p className="text-sm font-medium text-brand">
          {isCaisse ? "Ticket de caisse" : "Commande confirmée"}
        </p>
        <h1 className="mt-1 text-2xl font-semibold">{order.number}</h1>
        <p className="mt-1 text-sm text-muted">{formatDate(order.createdAt)}</p>
      </div>

      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <span className="font-medium">Statut</span>
          <Badge tone="brand">{STATUS_LABEL[order.status] ?? order.status}</Badge>
        </div>
        <div className="flex flex-col divide-y divide-border">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium">{item.productName}</p>
                <p className="text-sm text-muted">
                  {item.qty} × {formatPrice(Number(item.unitPrice))}
                  {Number(item.discountPercent) > 0 && ` (-${item.discountPercent}%)`}
                </p>
              </div>
              <span className="font-medium">
                {formatPrice(Number(item.lineTotal))}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-1 border-t border-border pt-4 text-sm">
          <div className="flex items-center justify-between text-muted">
            <span>Sous-total</span>
            <span>{formatPrice(Number(order.subtotal))}</span>
          </div>
          {Number(order.discountTotal) > 0 && (
            <div className="flex items-center justify-between text-muted">
              <span>Remises</span>
              <span>-{formatPrice(Number(order.discountTotal))}</span>
            </div>
          )}
          <div className="flex items-center justify-between text-lg font-semibold">
            <span>{isCaisse ? "Total payé" : "Total à régler en boutique"}</span>
            <span>{formatPrice(Number(order.total))}</span>
          </div>
        </div>

        {isCaisse && (
          <div className="mt-3 flex flex-col gap-1 border-t border-border pt-3 text-sm text-muted">
            <div className="flex items-center justify-between">
              <span>Paiement</span>
              <span>{order.paymentMethod ? PAYMENT_LABEL[order.paymentMethod] : "—"}</span>
            </div>
            {order.paymentMethod !== "CARD" && order.amountPaid != null && (
              <div className="flex items-center justify-between">
                <span>Reçu</span>
                <span>{formatPrice(Number(order.amountPaid))}</span>
              </div>
            )}
            {Number(order.changeGiven) > 0 && (
              <div className="flex items-center justify-between">
                <span>Rendu</span>
                <span>{formatPrice(Number(order.changeGiven))}</span>
              </div>
            )}
          </div>
        )}

        {order.refunds.length > 0 && (
          <div className="mt-3 border-t border-border pt-3">
            <p className="mb-1 text-sm font-medium">Remboursements</p>
            <ul className="flex flex-col gap-1 text-sm text-muted">
              {order.refunds.map((r) => (
                <li key={r.id} className="flex items-center justify-between">
                  <span>
                    {formatDate(r.createdAt)} {r.reason && `· ${r.reason}`}
                  </span>
                  <span className="font-medium text-danger">
                    -{formatPrice(Number(r.amount))}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-1 flex items-center justify-between text-sm font-medium">
              <span>Total remboursé</span>
              <span>{formatPrice(totalRefunded)}</span>
            </div>
          </div>
        )}

        <div className="mt-3 flex flex-col gap-0.5 border-t border-border pt-3 text-xs text-muted">
          <div className="flex items-center justify-between">
            <span>Total HT</span>
            <span>{formatPrice(vat.totalHT)}</span>
          </div>
          {vat.rows.map((row) => (
            <div key={row.vatRate} className="flex items-center justify-between">
              <span>dont TVA {row.vatRate}%</span>
              <span>{formatPrice(row.vatAmount)}</span>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex justify-center">
        <QrCode value={`${baseUrl}/commande/${order.number}`} size={100} />
      </div>

      {!isCaisse && (
        <p className="no-print text-center text-sm text-muted">
          Rendez-vous en boutique pour récupérer et régler votre commande.
        </p>
      )}

      <div className="no-print">
        <PrintButton label={isCaisse ? "Imprimer le ticket" : "Imprimer"} />
      </div>

      <div className="no-print flex justify-center gap-4 text-sm">
        <Link href="/fidelite" className="text-brand hover:underline">
          Mes commandes
        </Link>
        <Link href="/" className="text-muted hover:text-foreground">
          Retour au catalogue
        </Link>
      </div>
    </div>
  );
}
