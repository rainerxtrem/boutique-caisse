"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth-staff";

export async function createCashClosing(formData: FormData) {
  const session = await requireStaff();

  const periodStart = new Date(String(formData.get("periodStart")));
  const periodEnd = new Date(String(formData.get("periodEnd")));
  const expectedCash = Number(formData.get("expectedCash"));
  const expectedCard = Number(formData.get("expectedCard"));
  const declaredCash = Number(formData.get("declaredCash"));
  const declaredCard = Number(formData.get("declaredCard"));
  const notes = String(formData.get("notes") ?? "").trim() || null;

  const difference =
    Math.round((declaredCash + declaredCard - (expectedCash + expectedCard)) * 100) / 100;

  await prisma.cashClosing.create({
    data: {
      periodStart,
      periodEnd,
      closedById: session.userId,
      expectedCash,
      expectedCard,
      declaredCash,
      declaredCard,
      difference,
      notes,
    },
  });

  revalidatePath("/admin/caisse/cloture");
  redirect("/admin/caisse/cloture");
}
