"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";

const tierSchema = z.object({
  label: z.string().min(1, "Nom requis"),
  minPoints: z.coerce.number().int().min(0, "Seuil invalide"),
  perk: z.string().min(1, "Description de l'avantage requise"),
});

export type TierFormState = { error?: string; success?: boolean };

export async function createTier(
  _prevState: TierFormState,
  formData: FormData
): Promise<TierFormState> {
  await requirePermission("fidelite.manage_tiers");

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
  return { success: true };
}

export async function updateTier(tierId: string, formData: FormData) {
  await requirePermission("fidelite.manage_tiers");

  const parsed = tierSchema.safeParse({
    label: formData.get("label"),
    minPoints: formData.get("minPoints"),
    perk: formData.get("perk"),
  });
  if (!parsed.success) return;

  await prisma.loyaltyTier.update({ where: { id: tierId }, data: parsed.data });
  revalidatePath("/admin/fidelite");
  revalidatePath("/fidelite");
  redirect("/admin/fidelite?toast=updated");
}

export async function deleteTier(tierId: string) {
  const session = await requirePermission("fidelite.manage_tiers");
  const tier = await prisma.loyaltyTier.findUnique({ where: { id: tierId } });
  await prisma.loyaltyTier.delete({ where: { id: tierId } });
  if (tier) {
    await logAudit(prisma, {
      actorId: session.userId,
      actorName: session.name,
      action: "tier.deleted",
      entityType: "LoyaltyTier",
      entityId: tierId,
      summary: `Palier fidélité supprimé : ${tier.label} (${tier.minPoints} pts)`,
    });
  }
  revalidatePath("/admin/fidelite");
  revalidatePath("/fidelite");
  redirect("/admin/fidelite?toast=tier-deleted");
}
