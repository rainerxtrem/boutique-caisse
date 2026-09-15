import Link from "next/link";
import { prisma } from "@/lib/db";
import { Badge, Button, Card } from "@/components/ui";

export default async function FournisseursPage() {
  const suppliers = await prisma.supplier.findMany({
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
            {suppliers.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-muted">
                  Aucun fournisseur enregistré.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
