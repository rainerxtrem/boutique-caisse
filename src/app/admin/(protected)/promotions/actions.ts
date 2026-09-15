"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth-staff";

const promoSchema = z.object({
  code: z.string().min(3, "3 caractères minimum"),
  type: z.enum(["PERCENT", "FIXED"]),
  value: z.coerce.number().min(0.01, "Valeur invalide"),
  active: z.coerce.boolean().optional(),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
  usageLimit: z.coerce.number().int().min(1).optional().or(z.nan().transform(() => undefined)),
  minOrderAmount: z.coerce.number().min(0).optional().or(z.nan().transform(() => undefined)),
});

export type PromoFormState = { error?: string };

function readPromoForm(formData: FormData) {
  return promoSchema.safeParse({
    code: formData.get("code"),
    type: formData.get("type"),
    value: formData.get("value"),
    active: formData.get("active") === "on",
    startsAt: formData.get("startsAt") || undefined,
    endsAt: formData.get("endsAt") || undefined,
    usageLimit: formData.get("usageLimit") || undefined,
    minOrderAmount: formData.get("minOrderAmount") || undefined,
  });
}

export async function createPromoCode(
  _prevState: PromoFormState,
  formData: FormData
): Promise<PromoFormState> {
  await requireStaff();
  const parsed = readPromoForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const code = parsed.data.code.trim().toUpperCase();
  const existing = await prisma.promoCode.findUnique({ where: { code } });
  if (existing) return { error: "Ce code existe déjà." };

  await prisma.promoCode.create({
    data: {
      code,
      type: parsed.data.type,
      value: parsed.data.value,
      active: parsed.data.active ?? true,
      startsAt: parsed.data.startsAt ? new Date(parsed.data.startsAt) : null,
      endsAt: parsed.data.endsAt ? new Date(parsed.data.endsAt) : null,
      usageLimit: parsed.data.usageLimit ?? null,
      minOrderAmount: parsed.data.minOrderAmount ?? null,
    },
  });

  revalidatePath("/admin/promotions");
  redirect("/admin/promotions");
}

export async function togglePromoCode(promoId: string, active: boolean) {
  await requireStaff();
  await prisma.promoCode.update({ where: { id: promoId }, data: { active } });
  revalidatePath("/admin/promotions");
}

export async function deletePromoCode(promoId: string) {
  await requireStaff();
  await prisma.promoCode.delete({ where: { id: promoId } });
  revalidatePath("/admin/promotions");
}
