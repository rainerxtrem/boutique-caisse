import { Suspense } from "react";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { Badge, Button, Card, Input } from "@/components/ui";
import { LiveSearchInput } from "@/components/live-search-input";
import { EmptyState } from "@/components/empty-state";
import { requirePermission } from "@/lib/permissions";

export default async function FournisseursPage({
  searchParams,
}: PageProps<"/admin/fournisseurs">) {
  await requirePermission("fournisseurs.manage");
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";

  const suppliers = await prisma.supplier.findMany({
    where: q ? { name: { contains: q, mode: "insensitive" } } : undefined,
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Fournisseurs</h1>
          <p className="text-sm text-muted">Carnet de contacts pour le réapprovisionnement.</p>
        </div>
        <Link href="/admin/fournisseurs/nouveau">
          <Button>+ Nouveau fournisseur</Button>
        </Link>
      </div>

      <Suspense fallback={<Input placeholder="Rechercher un fournisseur..." disabled />}>
        <div className="max-w-sm">
          <LiveSearchInput placeholder="Rechercher un fournisseur..." />
        </div>
      </Suspense>

      {suppliers.length === 0 ? (
        <EmptyState
          icon="box"
          title="Aucun fournisseur"
          description={q ? `Aucun résultat pour "${q}".` : "Ajoutez votre premier fournisseur."}
        />
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3 text-left">Nom</th>
                <th className="px-4 py-3 text-left">Contact</th>
                <th className="px-4 py-3 text-left">Téléphone</th>
                <th className="px-4 py-3 text-right">Articles liés</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((s) => (
                <tr key={s.id} className="border-t border-border hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/fournisseurs/${s.id}`} className="font-medium hover:text-brand">
                      {s.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted">{s.contactName ?? "—"}</td>
                  <td className="px-4 py-3 text-muted">{s.phone ?? "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <Badge tone="muted">{s._count.products}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
