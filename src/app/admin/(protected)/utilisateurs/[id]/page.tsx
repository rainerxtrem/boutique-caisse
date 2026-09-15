import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/breadcrumb";
import { prisma } from "@/lib/db";
import { updateStaffUser } from "../actions";
import { UserForm } from "../user-form";

export default async function UserDetailPage({
  params,
}: PageProps<"/admin/utilisateurs/[id]">) {
  const { id } = await params;
  const [user, roles] = await Promise.all([
    prisma.user.findUnique({ where: { id } }),
    prisma.role.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!user) notFound();

  const boundUpdate = updateStaffUser.bind(null, user.id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Breadcrumb
          items={[{ label: "Utilisateurs", href: "/admin/utilisateurs" }, { label: user.name }]}
        />
        <h1 className="mt-1 text-2xl font-semibold">{user.name}</h1>
      </div>

      <UserForm
        action={boundUpdate}
        roles={roles}
        submitLabel="Enregistrer"
        passwordRequired={false}
        defaultValues={{ name: user.name, username: user.username, roleId: user.roleId }}
      />
    </div>
  );
}
