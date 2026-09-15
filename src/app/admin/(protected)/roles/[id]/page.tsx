import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/breadcrumb";
import { Button, Card, Input, Label } from "@/components/ui";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { updateRole } from "../actions";
import { PermissionCheckboxes } from "../permission-checkboxes";
import { DeleteRoleButton } from "../delete-role-button";

export default async function RoleDetailPage({
  params,
}: PageProps<"/admin/roles/[id]">) {
  await requirePermission("roles.manage");
  const { id } = await params;
  const role = await prisma.role.findUnique({
    where: { id },
    include: { permissions: true, users: true },
  });
  if (!role) notFound();

  const boundUpdate = updateRole.bind(null, role.id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Breadcrumb items={[{ label: "Rôles", href: "/admin/roles" }, { label: role.name }]} />
        <h1 className="mt-1 text-2xl font-semibold">{role.name}</h1>
        {role.users.length > 0 && (
          <p className="mt-1 text-sm text-muted">
            Assigné à : {role.users.map((u) => u.name).join(", ")}
          </p>
        )}
      </div>

      <Card className="max-w-xl p-6">
        <form action={boundUpdate} className="flex flex-col gap-4">
          <div>
            <Label htmlFor="name">Nom du rôle</Label>
            <Input id="name" name="name" defaultValue={role.name} required />
          </div>
          <PermissionCheckboxes selected={role.permissions.map((p) => p.permissionKey)} />
          <Button type="submit">Enregistrer</Button>
        </form>
      </Card>

      <DeleteRoleButton roleId={role.id} roleName={role.name} />
    </div>
  );
}
