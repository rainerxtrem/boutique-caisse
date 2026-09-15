"use server";

import { redirect } from "next/navigation";
import { destroyStaffSession } from "@/lib/auth-staff";

export async function logoutStaff() {
  await destroyStaffSession();
  redirect("/admin/connexion");
}
