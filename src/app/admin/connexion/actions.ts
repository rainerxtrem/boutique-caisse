"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createStaffSession } from "@/lib/auth-staff";

export type StaffLoginState = { error?: string };

export async function loginStaff(
  _prevState: StaffLoginState,
  formData: FormData
): Promise<StaffLoginState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!username || !password) {
    return { error: "Identifiant et mot de passe requis." };
  }

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    return { error: "Identifiants incorrects." };
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return { error: "Identifiants incorrects." };
  }

  await createStaffSession({ id: user.id, name: user.name });
  redirect("/admin");
}
