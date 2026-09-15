import Link from "next/link";
import { prisma } from "@/lib/db";
import { Badge, Card } from "@/components/ui";
import { EmptyState } from "@/components/empty-state";
import { formatDate } from "@/lib/format";
import { requireAnyPermission } from "@/lib/permissions";
import { RewardForm } from "./reward-form";
import { FulfillLookup } from "./fulfill-lookup";
import { createReward } from "./actions";

export default async function RecompensesPage() {
  await requireAnyPermission(["recompenses.manage", "recompenses.fulfill"]);
  const [rewards, pendingRedemptions] = await Promise.all([
    prisma.reward.findMany({ orderBy: { pointsCost: "asc" } }),
    prisma.rewardRedemption.findMany({
      where: { status: "PENDING" },
      include: { reward: true, customer: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Boutique de récompenses</h1>
        <p className="text-sm text-muted">
          Récompenses échangeables contre des points fidélité.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-6">
          <div>
            <h2 className="mb-3 text-lg font-semibold">Récompenses</h2>
            {rewards.length === 0 ? (
              <EmptyState
                icon="box"
                title="Aucune récompense"
                description="Créez-en une à droite pour l'espace fidélité."
              />
            ) : (
              <div className="flex flex-col gap-3">
                {rewards.map((r) => (
                  <Card key={r.id} className="flex items-center justify-between p-4">
                    <div>
                      <Link href={`/admin/recompenses/${r.id}`} className="font-medium hover:text-brand">
                        {r.name}
                      </Link>
                      <p className="text-sm text-muted">{r.pointsCost} pts</p>
                    </div>
                    <Badge tone={r.active ? "brand" : "muted"}>
                      {r.active ? "Disponible" : "Indisponible"}
                    </Badge>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="mb-3 text-lg font-semibold">Échanges en attente</h2>
            {pendingRedemptions.length === 0 ? (
              <p className="text-sm text-muted">Aucun échange en attente de remise.</p>
            ) : (
              <Card className="overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs uppercase text-muted">
                    <tr>
                      <th className="px-4 py-3 text-left">Code</th>
                      <th className="px-4 py-3 text-left">Récompense</th>
                      <th className="px-4 py-3 text-left">Client</th>
                      <th className="px-4 py-3 text-left">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingRedemptions.map((r) => (
                      <tr key={r.id} className="border-t border-border">
                        <td className="px-4 py-3 font-mono">{r.code}</td>
                        <td className="px-4 py-3">{r.reward.name}</td>
                        <td className="px-4 py-3">
                          {r.customer.firstName} {r.customer.lastName}
                        </td>
                        <td className="px-4 py-3 text-muted">{formatDate(r.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <FulfillLookup />
          <Card className="p-6">
            <h2 className="mb-3 font-semibold">Nouvelle récompense</h2>
            <RewardForm action={createReward} submitLabel="Créer la récompense" />
          </Card>
        </div>
      </div>
    </div>
  );
}
