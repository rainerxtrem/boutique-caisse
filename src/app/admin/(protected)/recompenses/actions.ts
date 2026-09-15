"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";

const rewardSchema = z.object({
  name: z.string().min(1, "Nom requis"),
  description: z.string().optional(),
  pointsCost: z.coerce.number().int().min(1, "Coût invalide"),
  imageUrl: z.string().optional(),
  active: z.coerce.boolean().optional(),
});

export type RewardFormState = { error?: string };

function readRewardForm(formData: FormData) {
  return rewardSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    pointsCost: formData.get("pointsCost"),
    imageUrl: formData.get("imageUrl") || undefined,
    active: formData.get("active") === "on",
  });
}

export async function createReward(
  _prevState: RewardFormState,
  formData: FormData
): Promise<RewardFormState> {
  await requirePermission("recompenses.manage");
  const parsed = readRewardForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  await prisma.reward.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description || null,
      pointsCost: parsed.data.pointsCost,
      imageUrl: parsed.data.imageUrl || null,
      active: parsed.data.active ?? true,
    },
  });

  revalidatePath("/admin/recompenses");
  revalidatePath("/fidelite");
  redirect("/admin/recompenses?toast=reward-created");
}

export async function updateReward(
  rewardId: string,
  _prevState: RewardFormState,
  formData: FormData
): Promise<RewardFormState> {
  await requirePermission("recompenses.manage");
  const parsed = readRewardForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  await prisma.reward.update({
    where: { id: rewardId },
    data: {
      name: parsed.data.name,
      description: parsed.data.description || null,
      pointsCost: parsed.data.pointsCost,
      imageUrl: parsed.data.imageUrl || null,
      active: parsed.data.active ?? true,
    },
  });

  revalidatePath("/admin/recompenses");
  revalidatePath("/fidelite");
  redirect("/admin/recompenses?toast=reward-updated");
}

export async function deleteReward(rewardId: string) {
  const session = await requirePermission("recompenses.manage");
  const reward = await prisma.reward.findUnique({ where: { id: rewardId } });
  await prisma.reward.delete({ where: { id: rewardId } });
  if (reward) {
    await logAudit(prisma, {
      actorId: session.userId,
      actorName: session.name,
      action: "reward.deleted",
      entityType: "Reward",
      entityId: rewardId,
      summary: `Récompense supprimée : ${reward.name}`,
    });
  }
  revalidatePath("/admin/recompenses");
  revalidatePath("/fidelite");
  redirect("/admin/recompenses?toast=reward-deleted");
}

export async function fulfillRedemption(code: string) {
  const session = await requirePermission("recompenses.fulfill");
  const redemption = await prisma.rewardRedemption.findUnique({
    where: { code: code.trim().toUpperCase() },
    include: { reward: true, customer: true },
  });
  if (!redemption) throw new Error("Code introuvable.");
  if (redemption.status === "FULFILLED") {
    throw new Error("Cette récompense a déjà été remise.");
  }

  await prisma.rewardRedemption.update({
    where: { id: redemption.id },
    data: { status: "FULFILLED", fulfilledAt: new Date(), fulfilledById: session.userId },
  });

  await logAudit(prisma, {
    actorId: session.userId,
    actorName: session.name,
    action: "reward.fulfilled",
    entityType: "RewardRedemption",
    entityId: redemption.id,
    summary: `Récompense "${redemption.reward.name}" remise à ${redemption.customer.firstName} ${redemption.customer.lastName}`,
  });

  revalidatePath("/admin/recompenses");
  return { rewardName: redemption.reward.name, customerName: `${redemption.customer.firstName} ${redemption.customer.lastName}` };
}
