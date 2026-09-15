import Link from "next/link";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { Badge, Button, Card } from "@/components/ui";
import { ConfirmSubmitButton } from "@/components/confirm-button";
import { formatDateOnly } from "@/lib/format";
import { deleteStaffUser } from "./actions";

export default async function UtilisateursPage() {
  const session = await requirePermission("utilisateurs.manage");
  const users = await prisma.user.findMany({
    include: { role: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Utilisateurs</h1>
          <p className="text-sm text-muted">Comptes staff et rôle assigné.</p>
        </div>
        <Link href="/admin/utilisateurs/nouveau">
          <Button>+ Nouvel utilisateur</Button>
        </Link>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3 text-left">Nom</th>
              <th className="px-4 py-3 text-left">Identifiant</th>
              <th className="px-4 py-3 text-left">Rôle</th>
              <th className="px-4 py-3 text-left">Créé le</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-border hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">
                  <Link href={`/admin/utilisateurs/${u.id}`} className="hover:text-brand">
                    {u.name}
                  </Link>
                </td>
                <td className="px-4 py-3">{u.username}</td>
                <td className="px-4 py-3">
                  <Badge tone={u.role.name === "Administrateur" ? "brand" : "default"}>
                    {u.role.name}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-muted">
                  {formatDateOnly(u.createdAt)}
                </td>
                <td className="px-4 py-3 text-right">
                  {u.id !== session.userId && (
                    <form action={deleteStaffUser.bind(null, u.id)}>
                      <ConfirmSubmitButton
                        variant="danger"
                        type="submit"
                        className="!py-1 text-xs"
                        confirmMessage={`Supprimer l'utilisateur ${u.name} ?`}
                      >
                        Supprimer
                      </ConfirmSubmitButton>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
