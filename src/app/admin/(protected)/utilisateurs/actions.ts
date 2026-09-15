"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";

const userSchema = z.object({
  username: z.string().min(3, "3 caractères minimum"),
  name: z.string().min(1, "Nom requis"),
  password: z.string().min(6, "6 caractères minimum").optional().or(z.literal("")),
  roleId: z.string().min(1, "Rôle requis"),
});

export type UserFormState = { error?: string };

export async function createStaffUser(
  _prevState: UserFormState,
  formData: FormData
): Promise<UserFormState> {
  const session = await requirePermission("utilisateurs.manage");

  const parsed = userSchema.safeParse({
    username: formData.get("username"),
    name: formData.get("name"),
    password: formData.get("password"),
    roleId: formData.get("roleId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }
  if (!parsed.data.password) {
    return { error: "Mot de passe requis." };
  }

  const existing = await prisma.user.findUnique({
    where: { username: parsed.data.username },
  });
  if (existing) {
    return { error: "Cet identifiant est déjà utilisé." };
  }

  const role = await prisma.role.findUnique({ where: { id: parsed.data.roleId } });
  if (!role) return { error: "Rôle introuvable." };

  const user = await prisma.user.create({
    data: {
      username: parsed.data.username,
      name: parsed.data.name,
      roleId: parsed.data.roleId,
      passwordHash: await bcrypt.hash(parsed.data.password, 10),
    },
  });

  await logAudit(prisma, {
    actorId: session.userId,
    actorName: session.name,
    action: "user.created",
    entityType: "User",
    entityId: user.id,
    summary: `Utilisateur créé : ${user.name} (${user.username}, ${role.name})`,
  });

  revalidatePath("/admin/utilisateurs");
  redirect("/admin/utilisateurs?toast=user-created");
}

export async function updateStaffUser(
  userId: string,
  _prevState: UserFormState,
  formData: FormData
): Promise<UserFormState> {
  const session = await requirePermission("utilisateurs.manage");

  const parsed = userSchema.safeParse({
    username: formData.get("username"),
    name: formData.get("name"),
    password: formData.get("password") || "",
    roleId: formData.get("roleId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const existing = await prisma.user.findUnique({ where: { username: parsed.data.username } });
  if (existing && existing.id !== userId) {
    return { error: "Cet identifiant est déjà utilisé." };
  }

  const role = await prisma.role.findUnique({ where: { id: parsed.data.roleId } });
  if (!role) return { error: "Rôle introuvable." };

  await prisma.user.update({
    where: { id: userId },
    data: {
      username: parsed.data.username,
      name: parsed.data.name,
      roleId: parsed.data.roleId,
      ...(parsed.data.password ? { passwordHash: await bcrypt.hash(parsed.data.password, 10) } : {}),
    },
  });

  await logAudit(prisma, {
    actorId: session.userId,
    actorName: session.name,
    action: "user.updated",
    entityType: "User",
    entityId: userId,
    summary: `Utilisateur modifié : ${parsed.data.name} (rôle ${role.name})`,
  });

  revalidatePath("/admin/utilisateurs");
  redirect("/admin/utilisateurs?toast=user-updated");
}

export async function deleteStaffUser(userId: string) {
  const session = await requirePermission("utilisateurs.manage");
  if (session.userId === userId) {
    return;
  }
  const user = await prisma.user.findUnique({ where: { id: userId } });
  await prisma.user.delete({ where: { id: userId } });
  if (user) {
    await logAudit(prisma, {
      actorId: session.userId,
      actorName: session.name,
      action: "user.deleted",
      entityType: "User",
      entityId: userId,
      summary: `Utilisateur supprimé : ${user.name} (${user.username})`,
    });
  }
  revalidatePath("/admin/utilisateurs");
  redirect("/admin/utilisateurs?toast=user-deleted");
}
