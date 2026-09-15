"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-staff";

const tierSchema = z.object({
  label: z.string().min(1, "Nom requis"),
  minPoints: z.coerce.number().int().min(0, "Seuil invalide"),
  perk: z.string().min(1, "Description de l'avantage requise"),
});

export type TierFormState = { error?: string };

export async function createTier(
  _prevState: TierFormState,
  formData: FormData
): Promise<TierFormState> {
  await requireAdmin();

  const parsed = tierSchema.safeParse({
    label: formData.get("label"),
    minPoints: formData.get("minPoints"),
    perk: formData.get("perk"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  await prisma.loyaltyTier.create({ data: parsed.data });
  revalidatePath("/admin/fidelite");
  revalidatePath("/fidelite");
  return {};
}

export async function updateTier(tierId: string, formData: FormData) {
  await requireAdmin();

  const parsed = tierSchema.safeParse({
    label: formData.get("label"),
    minPoints: formData.get("minPoints"),
    perk: formData.get("perk"),
  });
  if (!parsed.success) return;

  await prisma.loyaltyTier.update({ where: { id: tierId }, data: parsed.data });
  revalidatePath("/admin/fidelite");
  revalidatePath("/fidelite");
}

export async function deleteTier(tierId: string) {
  await requireAdmin();
  await prisma.loyaltyTier.delete({ where: { id: tierId } });
  revalidatePath("/admin/fidelite");
  revalidatePath("/fidelite");
}
