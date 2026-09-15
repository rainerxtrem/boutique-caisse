import Link from "next/link";
import { prisma } from "@/lib/db";
import { Badge, Button, Card, Input } from "@/components/ui";
import { formatDateOnly } from "@/lib/format";
import { getLoyaltyTiers, resolveTier } from "@/lib/loyalty";

const SEGMENTS = [
  { key: "tous", label: "Tous" },
  { key: "meilleurs", label: "Meilleurs clients" },
  { key: "inactifs", label: "Inactifs (90j+)" },
] as const;

export default async function ClientsPage({
  searchParams,
}: PageProps<"/admin/clients">) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const segment = typeof params.segment === "string" ? params.segment : "tous";

  const tiers = await getLoyaltyTiers();

  const customers = await prisma.customer.findMany({
    where: q
      ? {
          OR: [
            { firstName: { contains: q, mode: "insensitive" } },
            { lastName: { contains: q, mode: "insensitive" } },
            { phone: { contains: q } },
          ],
        }
      : undefined,
    include: { orders: { where: { status: { not: "CANCELLED" } }, select: { total: true } } },
  });

  const withSpend = customers.map((c) => ({
    ...c,
    totalSpent: c.orders.reduce((sum, o) => sum + Number(o.total), 0),
  }));

  // eslint-disable-next-line react-hooks/purity -- server component, computed once per request
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  let filtered = withSpend;
  if (segment === "meilleurs") {
    filtered = [...withSpend].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 20);
  } else if (segment === "inactifs") {
    filtered = withSpend
      .filter((c) => !c.lastOrderAt || c.lastOrderAt < ninetyDaysAgo)
      .sort((a, b) => (a.lastOrderAt?.getTime() ?? 0) - (b.lastOrderAt?.getTime() ?? 0));
  } else {
    filtered = [...withSpend].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Clients fidélité</h1>
          <p className="text-sm text-muted">
            Comptes créés en boutique : prénom, nom, date de naissance,
            téléphone.
          </p>
        </div>
        <Link href="/admin/clients/nouveau">
          <Button>+ Nouveau client</Button>
        </Link>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {SEGMENTS.map((s) => (
            <Link
              key={s.key}
              href={s.key === "tous" ? "/admin/clients" : `/admin/clients?segment=${s.key}`}
              className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                segment === s.key
                  ? "bg-brand text-white"
                  : "bg-white text-muted border border-border hover:bg-gray-50"
              }`}
            >
              {s.label}
            </Link>
          ))}
        </div>
        <form className="max-w-sm">
          <Input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Rechercher (nom, téléphone)..."
          />
        </form>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3 text-left">Client</th>
              <th className="px-4 py-3 text-left">Téléphone</th>
              <th className="px-4 py-3 text-left">Palier</th>
              <th className="px-4 py-3 text-right">Points</th>
              <th className="px-4 py-3 text-right">Total dépensé</th>
              <th className="px-4 py-3 text-left">Dernière commande</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => {
              const tier = resolveTier(tiers, c.lifetimePoints);
              return (
                <tr key={c.id} className="border-t border-border hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/clients/${c.id}`}
                      className="font-medium hover:text-brand"
                    >
                      {c.firstName} {c.lastName}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{c.phone}</td>
                  <td className="px-4 py-3">
                    <Badge tone="muted">{tier.current.label}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Badge tone="brand">{c.points} pts</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">{c.totalSpent.toFixed(2)}€</td>
                  <td className="px-4 py-3 text-muted">
                    {c.lastOrderAt ? formatDateOnly(c.lastOrderAt) : "Jamais"}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted">
                  Aucun client trouvé.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
