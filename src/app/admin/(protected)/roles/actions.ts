"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";

const roleSchema = z.object({
  name: z.string().min(1, "Nom requis"),
});

export type RoleFormState = { error?: string };

export async function createRole(
  _prevState: RoleFormState,
  formData: FormData
): Promise<RoleFormState> {
  const session = await requirePermission("roles.manage");

  const parsed = roleSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const existing = await prisma.role.findUnique({ where: { name: parsed.data.name } });
  if (existing) return { error: "Un rôle porte déjà ce nom." };

  const permissionKeys = formData.getAll("permissions") as string[];

  const role = await prisma.role.create({
    data: {
      name: parsed.data.name,
      permissions: {
        create: permissionKeys.map((permissionKey) => ({ permissionKey })),
      },
    },
  });

  await logAudit(prisma, {
    actorId: session.userId,
    actorName: session.name,
    action: "role.created",
    entityType: "Role",
    entityId: role.id,
    summary: `Rôle créé : ${role.name} (${permissionKeys.length} permission(s))`,
  });

  revalidatePath("/admin/roles");
  redirect(`/admin/roles/${role.id}?toast=created`);
}

export async function updateRole(roleId: string, formData: FormData) {
  const session = await requirePermission("roles.manage");

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const existing = await prisma.role.findUnique({ where: { name } });
  if (existing && existing.id !== roleId) return;

  const permissionKeys = formData.getAll("permissions") as string[];

  await prisma.$transaction(async (tx) => {
    await tx.role.update({ where: { id: roleId }, data: { name } });
    await tx.rolePermission.deleteMany({ where: { roleId } });
    if (permissionKeys.length > 0) {
      await tx.rolePermission.createMany({
        data: permissionKeys.map((permissionKey) => ({ roleId, permissionKey })),
      });
    }
  });

  await logAudit(prisma, {
    actorId: session.userId,
    actorName: session.name,
    action: "role.updated",
    entityType: "Role",
    entityId: roleId,
    summary: `Rôle modifié : ${name} (${permissionKeys.length} permission(s))`,
  });

  revalidatePath("/admin/roles");
  revalidatePath(`/admin/roles/${roleId}`);
  redirect("/admin/roles?toast=updated");
}

export async function deleteRole(roleId: string): Promise<{ error?: string }> {
  const session = await requirePermission("roles.manage");

  const usersWithRole = await prisma.user.count({ where: { roleId } });
  if (usersWithRole > 0) {
    return {
      error: `Impossible de supprimer ce rôle : ${usersWithRole} utilisateur(s) l'utilisent encore.`,
    };
  }

  const role = await prisma.role.findUnique({ where: { id: roleId } });
  await prisma.role.delete({ where: { id: roleId } });

  if (role) {
    await logAudit(prisma, {
      actorId: session.userId,
      actorName: session.name,
      action: "role.deleted",
      entityType: "Role",
      entityId: roleId,
      summary: `Rôle supprimé : ${role.name}`,
    });
  }

  revalidatePath("/admin/roles");
  return {};
}
