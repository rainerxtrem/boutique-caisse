"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth-staff";
import { generateUniqueReferralCode } from "@/lib/referral";

const customerSchema = z.object({
  firstName: z.string().min(1, "Prénom requis"),
  lastName: z.string().min(1, "Nom requis"),
  birthDate: z.string().min(1, "Date de naissance requise"),
  phone: z.string().min(6, "Numéro de téléphone invalide"),
});

export type CustomerFormState = { error?: string };

export async function createCustomer(
  _prevState: CustomerFormState,
  formData: FormData
): Promise<CustomerFormState> {
  await requireStaff();

  const parsed = customerSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    birthDate: formData.get("birthDate"),
    phone: formData.get("phone"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
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
      birthDate: new Date(parsed.data.birthDate),
      phone: parsed.data.phone,
      referralCode,
      referredById,
    },
  });

  revalidatePath("/admin/clients");
  redirect("/admin/clients");
}

export async function updateCustomer(
  customerId: string,
  _prevState: CustomerFormState,
  formData: FormData
): Promise<CustomerFormState> {
  await requireStaff();

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
      birthDate: new Date(parsed.data.birthDate),
      phone: parsed.data.phone,
      permanentDiscountPercent,
    },
  });

  revalidatePath("/admin/clients");
  revalidatePath(`/admin/clients/${customerId}`);
  redirect("/admin/clients");
}

export async function deleteCustomer(customerId: string) {
  await requireStaff();
  await prisma.customer.delete({ where: { id: customerId } });
  revalidatePath("/admin/clients");
  redirect("/admin/clients");
}
