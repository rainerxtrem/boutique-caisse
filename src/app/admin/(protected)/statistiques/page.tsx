import { prisma } from "@/lib/db";
import { Card } from "@/components/ui";
import { formatPrice } from "@/lib/format";
import { BestSellersChart, RevenueChart } from "./stats-charts";

export default async function StatistiquesPage() {
  const since = new Date();
  since.setDate(since.getDate() - 13);
  since.setHours(0, 0, 0, 0);

  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: since }, status: { not: "CANCELLED" } },
    include: { items: true, user: true },
  });

  const byDay = new Map<string, number>();
  for (let i = 0; i < 14; i++) {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    byDay.set(d.toISOString().slice(0, 10), 0);
  }
  for (const o of orders) {
    const key = o.createdAt.toISOString().slice(0, 10);
    byDay.set(key, (byDay.get(key) ?? 0) + Number(o.total));
  }
  const revenueData = Array.from(byDay.entries()).map(([date, total]) => ({
    date: date.slice(5),
    total: Math.round(total * 100) / 100,
  }));

  const productQty = new Map<string, number>();
  for (const o of orders) {
    for (const item of o.items) {
      productQty.set(item.productName, (productQty.get(item.productName) ?? 0) + item.qty);
    }
  }
  const bestSellers = Array.from(productQty.entries())
    .map(([name, qty]) => ({ name, qty }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 8);

  const byVendor = new Map<string, number>();
  for (const o of orders) {
    if (o.source !== "CAISSE") continue;
    const name = o.user?.name ?? "Inconnu";
    byVendor.set(name, (byVendor.get(name) ?? 0) + Number(o.total));
  }
  const vendorTotals = Array.from(byVendor.entries()).sort((a, b) => b[1] - a[1]);

  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total), 0);
  const webCount = orders.filter((o) => o.source === "WEB").length;
  const caisseCount = orders.filter((o) => o.source === "CAISSE").length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Statistiques</h1>
          <p className="text-sm text-muted">14 derniers jours.</p>
        </div>
        <a
          href="/admin/statistiques/export"
          className="rounded-lg border border-border bg-white px-4 py-2.5 text-sm font-medium hover:bg-gray-50"
        >
          Exporter en CSV
        </a>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="p-5">
          <p className="text-sm text-muted">CA (14 jours)</p>
          <p className="mt-1 text-2xl font-semibold">{formatPrice(totalRevenue)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-muted">Commandes web</p>
          <p className="mt-1 text-2xl font-semibold">{webCount}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-muted">Ventes caisse</p>
          <p className="mt-1 text-2xl font-semibold">{caisseCount}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-muted">Panier moyen</p>
          <p className="mt-1 text-2xl font-semibold">
            {formatPrice(orders.length ? totalRevenue / orders.length : 0)}
          </p>
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="mb-3 font-semibold">Chiffre d&apos;affaires</h2>
        <RevenueChart data={revenueData} />
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-3 font-semibold">Meilleures ventes</h2>
          {bestSellers.length === 0 ? (
            <p className="text-sm text-muted">Pas encore de données.</p>
          ) : (
            <BestSellersChart data={bestSellers} />
          )}
        </Card>

        <Card className="p-5">
          <h2 className="mb-3 font-semibold">CA par vendeur (caisse)</h2>
          {vendorTotals.length === 0 ? (
            <p className="text-sm text-muted">Pas encore de données.</p>
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {vendorTotals.map(([name, total]) => (
                <li key={name} className="flex items-center justify-between border-b border-border pb-2">
                  <span>{name}</span>
                  <span className="font-semibold">{formatPrice(total)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
