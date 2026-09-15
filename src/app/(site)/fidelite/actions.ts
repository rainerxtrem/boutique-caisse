"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { destroyCustomerSession, getCurrentCustomer } from "@/lib/auth-customer";
import { generateUniqueRedemptionCode } from "@/lib/rewards";

export async function logoutCustomer() {
  await destroyCustomerSession();
  redirect("/");
}

export type RedeemResult = { error?: string; code?: string };

export async function redeemReward(rewardId: string): Promise<RedeemResult> {
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/connexion");

  const reward = await prisma.reward.findUnique({ where: { id: rewardId } });
  if (!reward || !reward.active) {
    return { error: "Cette récompense n'est plus disponible." };
  }
  if (customer.points < reward.pointsCost) {
    return { error: "Vous n'avez pas assez de points pour cette récompense." };
  }

  const code = await generateUniqueRedemptionCode();

  await prisma.$transaction(async (tx) => {
    await tx.customer.update({
      where: { id: customer.id },
      data: { points: { decrement: reward.pointsCost } },
    });
    await tx.rewardRedemption.create({
      data: {
        rewardId: reward.id,
        customerId: customer.id,
        pointsCost: reward.pointsCost,
        code,
      },
    });
  });

  revalidatePath("/fidelite");
  return { code };
}
