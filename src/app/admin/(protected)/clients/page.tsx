import Link from "next/link";
import { prisma } from "@/lib/db";
import { Badge, Button, Card, Input } from "@/components/ui";
import { formatDateOnly } from "@/lib/format";

export default async function ClientsPage({
  searchParams,
}: PageProps<"/admin/clients">) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";

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
    orderBy: { createdAt: "desc" },
  });

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

      <form className="max-w-sm">
        <Input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Rechercher (nom, téléphone)..."
        />
      </form>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3 text-left">Client</th>
              <th className="px-4 py-3 text-left">Téléphone</th>
              <th className="px-4 py-3 text-left">Naissance</th>
              <th className="px-4 py-3 text-right">Points</th>
              <th className="px-4 py-3 text-left">Membre depuis</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
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
                <td className="px-4 py-3">{formatDateOnly(c.birthDate)}</td>
                <td className="px-4 py-3 text-right">
                  <Badge tone="brand">{c.points} pts</Badge>
                </td>
                <td className="px-4 py-3 text-muted">
                  {formatDateOnly(c.createdAt)}
                </td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted">
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
