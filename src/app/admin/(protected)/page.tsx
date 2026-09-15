import Link from "next/link";
import { prisma } from "@/lib/db";
import { Badge, Card } from "@/components/ui";
import { formatPrice } from "@/lib/format";

export default async function AdminDashboardPage() {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [todayOrders, pendingOrders, lowStock, customerCount] =
    await Promise.all([
      prisma.order.findMany({
        where: { createdAt: { gte: startOfDay }, status: { not: "CANCELLED" } },
      }),
      prisma.order.count({ where: { source: "WEB", status: "PENDING" } }),
      prisma.product.findMany({
        where: { active: true, stock: { lte: 5 } },
        orderBy: { stock: "asc" },
        take: 6,
      }),
      prisma.customer.count(),
    ]);

  const todayTotal = todayOrders.reduce((sum, o) => sum + Number(o.total), 0);
  const todaySalesCount = todayOrders.filter((o) => o.source === "CAISSE").length;

  const stats = [
    { label: "Ventes du jour", value: formatPrice(todayTotal) },
    { label: "Tickets du jour", value: todayOrders.length.toString() },
    { label: "Ventes caisse aujourd'hui", value: todaySalesCount.toString() },
    { label: "Clients fidélité", value: customerCount.toString() },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Tableau de bord</h1>
        <p className="text-sm text-muted">Vue d&apos;ensemble de l&apos;activité</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-5">
            <p className="text-sm text-muted">{s.label}</p>
            <p className="mt-1 text-2xl font-semibold">{s.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Commandes web en attente</h2>
            <Link
              href="/admin/commandes"
              className="text-sm text-brand hover:underline"
            >
              Voir tout
            </Link>
          </div>
          {pendingOrders === 0 ? (
            <p className="text-sm text-muted">Aucune commande en attente.</p>
          ) : (
            <p className="text-sm">
              <Badge tone="warning">{pendingOrders} commande(s)</Badge>{" "}
              à préparer.
            </p>
          )}
        </Card>

        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Stock faible</h2>
            <Link
              href="/admin/articles"
              className="text-sm text-brand hover:underline"
            >
              Gérer les articles
            </Link>
          </div>
          {lowStock.length === 0 ? (
            <p className="text-sm text-muted">Tous les stocks sont corrects.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {lowStock.map((p) => (
                <li key={p.id} className="flex items-center justify-between text-sm">
                  <span>{p.name}</span>
                  <Badge tone={p.stock === 0 ? "danger" : "warning"}>
                    {p.stock} restant(s)
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
