import Link from "next/link";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { Badge, Card } from "@/components/ui";
import { RoleCreateForm } from "./role-create-form";

export default async function RolesPage() {
  await requirePermission("roles.manage");
  const roles = await prisma.role.findMany({
    include: { permissions: true, _count: { select: { users: true } } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Rôles & permissions</h1>
        <p className="text-sm text-muted">
          Créez des rôles (vendeur, manageur, directeur...) et choisissez
          précisément à quoi chacun a accès.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-3">
          {roles.map((role) => (
            <Card key={role.id} className="p-4">
              <div className="flex items-center justify-between">
                <Link href={`/admin/roles/${role.id}`} className="font-medium hover:text-brand">
                  {role.name}
                </Link>
                <div className="flex items-center gap-2">
                  <Badge tone="muted">{role.permissions.length} permission(s)</Badge>
                  <Badge tone="brand">{role._count.users} utilisateur(s)</Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Card className="h-fit p-6">
          <h2 className="mb-3 font-semibold">Nouveau rôle</h2>
          <RoleCreateForm />
        </Card>
      </div>
    </div>
  );
}
