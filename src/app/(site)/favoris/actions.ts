"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentCustomer } from "@/lib/auth-customer";

export async function toggleFavorite(productId: string) {
  const customer = await getCurrentCustomer();
  if (!customer) return { error: "Connectez-vous pour ajouter des favoris." };

  const existing = await prisma.favorite.findUnique({
    where: { customerId_productId: { customerId: customer.id, productId } },
  });

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
  } else {
    await prisma.favorite.create({ data: { customerId: customer.id, productId } });
  }

  revalidatePath("/");
  revalidatePath("/favoris");
  revalidatePath("/produits/[slug]", "page");
  return { favorite: !existing };
}
