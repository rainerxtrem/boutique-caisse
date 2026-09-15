"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth-staff";
import { logAudit } from "@/lib/audit";

const supplierSchema = z.object({
  name: z.string().min(1, "Nom requis"),
  contactName: z.string().optional(),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

export type SupplierFormState = { error?: string };

function readSupplierForm(formData: FormData) {
  return supplierSchema.safeParse({
    name: formData.get("name"),
    contactName: formData.get("contactName") || undefined,
    email: formData.get("email") || "",
    phone: formData.get("phone") || undefined,
    address: formData.get("address") || undefined,
    notes: formData.get("notes") || undefined,
  });
}

export async function createSupplier(
  _prevState: SupplierFormState,
  formData: FormData
): Promise<SupplierFormState> {
  await requireStaff();
  const parsed = readSupplierForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  await prisma.supplier.create({
    data: {
      name: parsed.data.name,
      contactName: parsed.data.contactName || null,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      address: parsed.data.address || null,
      notes: parsed.data.notes || null,
    },
  });

  revalidatePath("/admin/fournisseurs");
  redirect("/admin/fournisseurs?toast=supplier-created");
}

export async function updateSupplier(
  supplierId: string,
  _prevState: SupplierFormState,
  formData: FormData
): Promise<SupplierFormState> {
  await requireStaff();
  const parsed = readSupplierForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  await prisma.supplier.update({
    where: { id: supplierId },
    data: {
      name: parsed.data.name,
      contactName: parsed.data.contactName || null,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      address: parsed.data.address || null,
      notes: parsed.data.notes || null,
    },
  });

  revalidatePath("/admin/fournisseurs");
  revalidatePath(`/admin/fournisseurs/${supplierId}`);
  redirect("/admin/fournisseurs?toast=supplier-updated");
}

export async function deleteSupplier(supplierId: string) {
  const session = await requireStaff();
  const supplier = await prisma.supplier.findUnique({ where: { id: supplierId } });
  await prisma.product.updateMany({
    where: { supplierId },
    data: { supplierId: null },
  });
  await prisma.supplier.delete({ where: { id: supplierId } });
  if (supplier) {
    await logAudit(prisma, {
      actorId: session.userId,
      actorName: session.name,
      action: "supplier.deleted",
      entityType: "Supplier",
      entityId: supplierId,
      summary: `Fournisseur supprimé : ${supplier.name}`,
    });
  }
  revalidatePath("/admin/fournisseurs");
  redirect("/admin/fournisseurs?toast=supplier-deleted");
}
