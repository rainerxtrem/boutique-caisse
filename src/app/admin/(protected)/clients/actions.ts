"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { generateUniqueReferralCode } from "@/lib/referral";
import { logAudit } from "@/lib/audit";

const customerSchema = z.object({
  firstName: z.string().min(1, "Prénom requis"),
  lastName: z.string().min(1, "Nom requis"),
  birthDate: z.string().optional(),
  phone: z.string().min(6, "Numéro de téléphone invalide"),
});

export type CustomerFormState = { error?: string };

export async function createCustomer(
  _prevState: CustomerFormState,
  formData: FormData
): Promise<CustomerFormState> {
  await requirePermission("clients.manage");

  const parsed = customerSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    birthDate: formData.get("birthDate"),
    phone: formData.get("phone"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }
  if (!parsed.data.birthDate) {
    return { error: "Date de naissance requise." };
  }

  const existing = await prisma.customer.findUnique({
    where: { phone: parsed.data.phone },
  });
  if (existing) {
    return { error: "Un compte fidélité existe déjà avec ce numéro." };
  }

  let referredById: string | null = null;
  const referredByCodeRaw = String(formData.get("referredByCode") ?? "").trim();
  if (referredByCodeRaw) {
    const referrer = await prisma.customer.findUnique({
      where: { referralCode: referredByCodeRaw.toUpperCase() },
    });
    if (!referrer) {
      return { error: "Code de parrainage introuvable." };
    }
    referredById = referrer.id;
  }

  const referralCode = await generateUniqueReferralCode();

  await prisma.customer.create({
    data: {
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      birthDate: new Date(parsed.data.birthDate as string),
      phone: parsed.data.phone,
      referralCode,
      referredById,
    },
  });

  revalidatePath("/admin/clients");
  redirect(
    referredById
      ? "/admin/clients?toast=customer-created-referral"
      : "/admin/clients?toast=customer-created"
  );
}

export async function updateCustomer(
  customerId: string,
  _prevState: CustomerFormState,
  formData: FormData
): Promise<CustomerFormState> {
  const session = await requirePermission("clients.manage");

  const parsed = customerSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    birthDate: formData.get("birthDate"),
    phone: formData.get("phone"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const discountRaw = formData.get("permanentDiscountPercent");
  const permanentDiscountPercent = discountRaw ? Number(discountRaw) : 0;
  if (Number.isNaN(permanentDiscountPercent) || permanentDiscountPercent < 0 || permanentDiscountPercent > 100) {
    return { error: "Remise permanente invalide (0 à 100)." };
  }

  const current = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!current) return { error: "Client introuvable." };

  const existing = await prisma.customer.findUnique({
    where: { phone: parsed.data.phone },
  });
  if (existing && existing.id !== customerId) {
    return { error: "Un autre compte utilise déjà ce numéro." };
  }

  await prisma.customer.update({
    where: { id: customerId },
    data: {
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      birthDate: parsed.data.birthDate ? new Date(parsed.data.birthDate) : null,
      phone: parsed.data.phone,
      permanentDiscountPercent,
    },
  });

  if (Number(current.permanentDiscountPercent) !== permanentDiscountPercent) {
    await logAudit(prisma, {
      actorId: session.userId,
      actorName: session.name,
      action: "customer.discount_changed",
      entityType: "Customer",
      entityId: customerId,
      summary: `Remise permanente de ${current.firstName} ${current.lastName} : ${Number(current.permanentDiscountPercent)}% → ${permanentDiscountPercent}%`,
    });
  }

  revalidatePath("/admin/clients");
  revalidatePath(`/admin/clients/${customerId}`);
  redirect("/admin/clients?toast=customer-updated");
}

export async function deleteCustomer(customerId: string) {
  const session = await requirePermission("clients.manage");
  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  await prisma.customer.delete({ where: { id: customerId } });
  if (customer) {
    await logAudit(prisma, {
      actorId: session.userId,
      actorName: session.name,
      action: "customer.deleted",
      entityType: "Customer",
      entityId: customerId,
      summary: `Compte fidélité supprimé : ${customer.firstName} ${customer.lastName} (${customer.phone})`,
    });
  }
  revalidatePath("/admin/clients");
  redirect("/admin/clients?toast=customer-deleted");
}
