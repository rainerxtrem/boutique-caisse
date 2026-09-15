import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Badge, Card } from "@/components/ui";
import { Breadcrumb } from "@/components/breadcrumb";
import { formatDate, formatPrice } from "@/lib/format";
import { requirePermission } from "@/lib/permissions";
import { RefundForm } from "./refund-form";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "En attente",
  READY: "Prête",
  COMPLETED: "Terminée",
  CANCELLED: "Annulée",
  REFUNDED: "Remboursée",
  PARTIALLY_REFUNDED: "Partiellement remboursée",
};

export default async function OrderDetailPage({
  params,
}: PageProps<"/admin/commandes/[id]">) {
  await requirePermission("commandes.view");
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { refundItems: true } },
      customer: true,
      user: true,
      refunds: { include: { items: true } },
    },
  });

  if (!order) notFound();

  const refundableItems = order.items
    .map((item) => {
      const refunded = item.refundItems.reduce((s, r) => s + r.qty, 0);
      return { ...item, remaining: item.qty - refunded };
    })
    .filter((item) => item.remaining > 0);

  const canRefund =
    (order.status === "COMPLETED" || order.status === "PARTIALLY_REFUNDED") &&
    refundableItems.length > 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Breadcrumb
          items={[
            {
              label: order.source === "WEB" ? "Commandes web" : "Caisse",
              href: order.source === "WEB" ? "/admin/commandes" : "/admin/caisse",
            },
            { label: order.number },
          ]}
        />
        <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-2xl font-semibold">{order.number}</h1>
          <Badge tone="muted">{STATUS_LABEL[order.status]}</Badge>
        </div>
        <p className="text-sm text-muted">
          {formatDate(order.createdAt)} · {order.source === "WEB" ? "Commande web" : "Vente caisse"}
          {order.customer && ` · ${order.customer.firstName} ${order.customer.lastName}`}
          {order.user && ` · Vendeur ${order.user.name}`}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="mb-3 font-semibold">Articles</h2>
          <ul className="flex flex-col gap-2 text-sm">
            {order.items.map((item) => {
              const refunded = item.refundItems.reduce((s, r) => s + r.qty, 0);
              return (
                <li key={item.id} className="flex items-center justify-between border-b border-border pb-2">
                  <span>
                    {item.qty} × {item.productName}
                    {refunded > 0 && (
                      <span className="ml-2 text-xs text-danger">
                        ({refunded} remboursé{refunded > 1 ? "s" : ""})
                      </span>
                    )}
                  </span>
                  <span className="font-medium">{formatPrice(Number(item.lineTotal))}</span>
                </li>
              );
            })}
          </ul>
          <div className="mt-3 flex items-center justify-between text-lg font-semibold">
            <span>Total</span>
            <span>{formatPrice(Number(order.total))}</span>
          </div>

          {order.refunds.length > 0 && (
            <div className="mt-4 border-t border-border pt-3">
              <h3 className="mb-2 text-sm font-semibold">Remboursements</h3>
              <ul className="flex flex-col gap-2 text-sm text-muted">
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
            </div>
          )}
        </Card>

        {canRefund && (
          <RefundForm
            orderId={order.id}
            items={refundableItems.map((i) => ({
              id: i.id,
              productName: i.productName,
              remaining: i.remaining,
              unitAmount: Number(i.lineTotal) / i.qty,
            }))}
          />
        )}
      </div>
    </div>
  );
}
