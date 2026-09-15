import Link from "next/link";
import { prisma } from "@/lib/db";
import { Badge, Card } from "@/components/ui";
import { Sparkline } from "@/components/sparkline";
import { formatPrice } from "@/lib/format";
import { requirePermission } from "@/lib/permissions";

export default async function AdminDashboardPage() {
  await requirePermission("dashboard.view");
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const sevenDaysAgo = new Date(startOfDay);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

  const [todayOrders, pendingOrders, lowStock, customerCount, weekOrders] =
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
      prisma.order.findMany({
        where: { createdAt: { gte: sevenDaysAgo }, status: { not: "CANCELLED" } },
        select: { createdAt: true, total: true },
      }),
    ]);

  const todayTotal = todayOrders.reduce((sum, o) => sum + Number(o.total), 0);
  const todaySalesCount = todayOrders.filter((o) => o.source === "CAISSE").length;

  const revenueByDay = new Map<string, number>();
  const ordersByDay = new Map<string, number>();
  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    revenueByDay.set(key, 0);
    ordersByDay.set(key, 0);
  }
  for (const o of weekOrders) {
    const key = o.createdAt.toISOString().slice(0, 10);
    revenueByDay.set(key, (revenueByDay.get(key) ?? 0) + Number(o.total));
    ordersByDay.set(key, (ordersByDay.get(key) ?? 0) + 1);
  }
  const revenueSpark = Array.from(revenueByDay.values()).map((value) => ({ value }));
  const ordersSpark = Array.from(ordersByDay.values()).map((value) => ({ value }));

  const stats = [
    { label: "Ventes du jour", value: formatPrice(todayTotal), spark: revenueSpark },
    { label: "Tickets du jour", value: todayOrders.length.toString(), spark: ordersSpark },
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
          <Card key={s.label} className="overflow-hidden p-5">
            <p className="text-sm text-muted">{s.label}</p>
            <p className="mt-1 text-2xl font-semibold">{s.value}</p>
            {s.spark && (
              <div className="-mx-1 -mb-1 mt-1">
                <Sparkline data={s.spark} />
              </div>
            )}
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
