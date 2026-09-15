import Link from "next/link";
import { prisma } from "@/lib/db";
import { Badge, Button, Card } from "@/components/ui";
import { formatDate, formatPrice } from "@/lib/format";
import { updateOrderStatus } from "./actions";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "En attente",
  READY: "Prête",
  COMPLETED: "Terminée",
  CANCELLED: "Annulée",
};

const STATUS_TONE: Record<string, "default" | "brand" | "warning" | "danger" | "muted"> = {
  PENDING: "warning",
  READY: "brand",
  COMPLETED: "muted",
  CANCELLED: "danger",
};

const FILTERS = ["Tout", "PENDING", "READY", "COMPLETED", "CANCELLED"] as const;

export default async function CommandesPage({
  searchParams,
}: PageProps<"/admin/commandes">) {
  const params = await searchParams;
  const status = typeof params.statut === "string" ? params.statut : "Tout";

  const orders = await prisma.order.findMany({
    where: {
      source: "WEB",
      ...(status !== "Tout" ? { status: status as never } : {}),
    },
    include: { customer: true, items: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Commandes web</h1>
        <p className="text-sm text-muted">
          Gérez les commandes passées par les clients sur le site.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f}
            href={f === "Tout" ? "/admin/commandes" : `/admin/commandes?statut=${f}`}
            className={`rounded-full px-3 py-1.5 text-sm font-medium ${
              status === f
                ? "bg-brand text-white"
                : "bg-white text-muted border border-border hover:bg-gray-50"
            }`}
          >
            {f === "Tout" ? "Toutes" : STATUS_LABEL[f]}
          </Link>
        ))}
      </div>

      {orders.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-white py-16 text-center text-muted">
          Aucune commande pour ce filtre.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((order) => (
            <Card key={order.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-semibold">{order.number}</p>
                  <p className="text-sm text-muted">
                    {order.customer
                      ? `${order.customer.firstName} ${order.customer.lastName} · ${order.customer.phone}`
                      : "Client inconnu"}
                  </p>
                  <p className="text-xs text-muted">{formatDate(order.createdAt)}</p>
                </div>
                <div className="text-right">
                  <Badge tone={STATUS_TONE[order.status]}>
                    {STATUS_LABEL[order.status]}
                  </Badge>
                  <p className="mt-1 font-semibold">{formatPrice(Number(order.total))}</p>
                </div>
              </div>

              <ul className="mt-3 border-t border-border pt-3 text-sm text-muted">
                {order.items.map((item) => (
                  <li key={item.id}>
                    {item.qty} × {item.productName}
                  </li>
                ))}
              </ul>

              {order.status !== "COMPLETED" && order.status !== "CANCELLED" && (
                <div className="mt-3 flex gap-2 border-t border-border pt-3">
                  {order.status === "PENDING" && (
                    <form action={updateOrderStatus.bind(null, order.id, "READY")}>
                      <Button variant="secondary" type="submit" className="!py-1.5 text-xs">
                        Marquer prête
                      </Button>
                    </form>
                  )}
                  <form action={updateOrderStatus.bind(null, order.id, "COMPLETED")}>
                    <Button type="submit" className="!py-1.5 text-xs">
                      Marquer retirée / terminée
                    </Button>
                  </form>
                  <form action={updateOrderStatus.bind(null, order.id, "CANCELLED")}>
                    <Button variant="danger" type="submit" className="!py-1.5 text-xs">
                      Annuler
                    </Button>
                  </form>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
