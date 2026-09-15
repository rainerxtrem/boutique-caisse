"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth-staff";

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const productSchema = z.object({
  name: z.string().min(1, "Nom requis"),
  description: z.string().optional(),
  price: z.coerce.number().min(0, "Prix invalide"),
  stock: z.coerce.number().int().min(0, "Stock invalide"),
  sku: z.string().min(1, "Référence requise"),
  categoryId: z.string().optional(),
  imageUrl: z.string().optional(),
  active: z.coerce.boolean().optional(),
});

export type ProductFormState = { error?: string };

export async function createProduct(
  _prevState: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  await requireStaff();

  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    price: formData.get("price"),
    stock: formData.get("stock"),
    sku: formData.get("sku"),
    categoryId: formData.get("categoryId") || undefined,
    imageUrl: formData.get("imageUrl") || undefined,
    active: formData.get("active") === "on",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const baseSlug = slugify(parsed.data.name);
  let slug = baseSlug;
  let i = 1;
  while (await prisma.product.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${i++}`;
  }

  const existingSku = await prisma.product.findUnique({
    where: { sku: parsed.data.sku },
  });
  if (existingSku) {
    return { error: "Cette référence (SKU) existe déjà." };
  }

  await prisma.product.create({
    data: {
      name: parsed.data.name,
      slug,
      description: parsed.data.description,
      price: parsed.data.price,
      stock: parsed.data.stock,
      sku: parsed.data.sku,
      categoryId: parsed.data.categoryId || null,
      imageUrl: parsed.data.imageUrl || null,
      active: parsed.data.active ?? true,
    },
  });

  revalidatePath("/admin/articles");
  redirect("/admin/articles");
}

export async function updateProduct(
  productId: string,
  _prevState: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  await requireStaff();

  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    price: formData.get("price"),
    stock: formData.get("stock"),
    sku: formData.get("sku"),
    categoryId: formData.get("categoryId") || undefined,
    imageUrl: formData.get("imageUrl") || undefined,
    active: formData.get("active") === "on",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const existingSku = await prisma.product.findUnique({
    where: { sku: parsed.data.sku },
  });
  if (existingSku && existingSku.id !== productId) {
    return { error: "Cette référence (SKU) est déjà utilisée." };
  }

  await prisma.product.update({
    where: { id: productId },
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      price: parsed.data.price,
      stock: parsed.data.stock,
      sku: parsed.data.sku,
      categoryId: parsed.data.categoryId || null,
      imageUrl: parsed.data.imageUrl || null,
      active: parsed.data.active ?? true,
    },
  });

  revalidatePath("/admin/articles");
  revalidatePath(`/admin/articles/${productId}`);
  redirect("/admin/articles");
}

export async function deleteProduct(productId: string) {
  await requireStaff();
  await prisma.product.update({
    where: { id: productId },
    data: { active: false },
  });
  revalidatePath("/admin/articles");
  redirect("/admin/articles");
}

export async function createCategory(formData: FormData) {
  await requireStaff();
  const name = String(formData.get("categoryName") ?? "").trim();
  if (!name) return;

  const baseSlug = slugify(name);
  let slug = baseSlug;
  let i = 1;
  while (await prisma.category.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${i++}`;
  }

  await prisma.category.create({ data: { name, slug } });
  revalidatePath("/admin/articles");
}
