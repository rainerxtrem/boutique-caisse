"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth-staff";

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

  await prisma.customer.create({
    data: {
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      birthDate: new Date(parsed.data.birthDate),
      phone: parsed.data.phone,
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
