"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth-staff";
import { logAudit } from "@/lib/audit";

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
  supplierId: z.string().optional(),
  imageUrl: z.string().optional(),
  active: z.coerce.boolean().optional(),
  ingredients: z.string().optional(),
  allergens: z.string().optional(),
  prepTimeMinutes: z.coerce.number().int().min(0).optional().or(z.nan().transform(() => undefined)),
  temporarilyUnavailable: z.coerce.boolean().optional(),
  featured: z.coerce.boolean().optional(),
  flashPrice: z.coerce.number().min(0).optional().or(z.nan().transform(() => undefined)),
  flashPriceEndsAt: z.string().optional(),
  vatRate: z.coerce.number().min(0).max(100).optional().or(z.nan().transform(() => undefined)),
});

function readProductForm(formData: FormData) {
  return productSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    price: formData.get("price"),
    stock: formData.get("stock"),
    sku: formData.get("sku"),
    categoryId: formData.get("categoryId") || undefined,
    supplierId: formData.get("supplierId") || undefined,
    imageUrl: formData.get("imageUrl") || undefined,
    active: formData.get("active") === "on",
    ingredients: formData.get("ingredients") || undefined,
    allergens: formData.get("allergens") || undefined,
    prepTimeMinutes: formData.get("prepTimeMinutes") || undefined,
    temporarilyUnavailable: formData.get("temporarilyUnavailable") === "on",
    featured: formData.get("featured") === "on",
    flashPrice: formData.get("flashPrice") || undefined,
    flashPriceEndsAt: formData.get("flashPriceEndsAt") || undefined,
    vatRate: formData.get("vatRate") || undefined,
  });
}

export type ProductFormState = { error?: string };

export async function createProduct(
  _prevState: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  await requireStaff();

  const parsed = readProductForm(formData);
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

  const product = await prisma.product.create({
    data: {
      name: parsed.data.name,
      slug,
      description: parsed.data.description,
      price: parsed.data.price,
      stock: parsed.data.stock,
      sku: parsed.data.sku,
      categoryId: parsed.data.categoryId || null,
      supplierId: parsed.data.supplierId || null,
      imageUrl: parsed.data.imageUrl || null,
      active: parsed.data.active ?? true,
      ingredients: parsed.data.ingredients || null,
      allergens: parsed.data.allergens || null,
      prepTimeMinutes: parsed.data.prepTimeMinutes ?? null,
      temporarilyUnavailable: parsed.data.temporarilyUnavailable ?? false,
      featured: parsed.data.featured ?? false,
      flashPrice: parsed.data.flashPrice ?? null,
      flashPriceEndsAt: parsed.data.flashPriceEndsAt
        ? new Date(parsed.data.flashPriceEndsAt)
        : null,
      vatRate: parsed.data.vatRate ?? 20,
    },
  });

  await syncRelatedProducts(product.id, formData.getAll("relatedProductIds") as string[]);
  await syncProductImages(product.id, String(formData.get("imageUrls") ?? ""));

  revalidatePath("/admin/articles");
  redirect("/admin/articles?toast=product-created");
}

export async function updateProduct(
  productId: string,
  _prevState: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  const session = await requireStaff();

  const parsed = readProductForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const existingSku = await prisma.product.findUnique({
    where: { sku: parsed.data.sku },
  });
  if (existingSku && existingSku.id !== productId) {
    return { error: "Cette référence (SKU) est déjà utilisée." };
  }

  const current = await prisma.product.findUnique({ where: { id: productId } });
  if (!current) return { error: "Article introuvable." };

  await prisma.$transaction(async (tx) => {
    if (Number(current.price) !== parsed.data.price) {
      await tx.priceHistory.create({
        data: {
          productId,
          oldPrice: current.price,
          newPrice: parsed.data.price,
          changedById: session.userId,
        },
      });
    }

    await tx.product.update({
      where: { id: productId },
      data: {
        name: parsed.data.name,
        description: parsed.data.description,
        price: parsed.data.price,
        stock: parsed.data.stock,
        sku: parsed.data.sku,
        categoryId: parsed.data.categoryId || null,
        supplierId: parsed.data.supplierId || null,
        imageUrl: parsed.data.imageUrl || null,
        active: parsed.data.active ?? true,
        ingredients: parsed.data.ingredients || null,
        allergens: parsed.data.allergens || null,
        prepTimeMinutes: parsed.data.prepTimeMinutes ?? null,
        temporarilyUnavailable: parsed.data.temporarilyUnavailable ?? false,
        featured: parsed.data.featured ?? false,
        flashPrice: parsed.data.flashPrice ?? null,
        flashPriceEndsAt: parsed.data.flashPriceEndsAt
          ? new Date(parsed.data.flashPriceEndsAt)
          : null,
        vatRate: parsed.data.vatRate ?? 20,
      },
    });
  });

  await syncRelatedProducts(productId, formData.getAll("relatedProductIds") as string[]);
  await syncProductImages(productId, String(formData.get("imageUrls") ?? ""));

  revalidatePath("/admin/articles");
  revalidatePath(`/admin/articles/${productId}`);
  redirect("/admin/articles?toast=product-updated");
}

async function syncRelatedProducts(productId: string, relatedIds: string[]) {
  const ids = relatedIds.filter((id) => id && id !== productId);
  await prisma.productRelation.deleteMany({ where: { productId } });
  if (ids.length > 0) {
    await prisma.productRelation.createMany({
      data: ids.map((relatedProductId) => ({ productId, relatedProductId })),
      skipDuplicates: true,
    });
  }
}

async function syncProductImages(productId: string, imageUrlsRaw: string) {
  const urls = imageUrlsRaw
    .split("\n")
    .map((u) => u.trim())
    .filter(Boolean);
  await prisma.productImage.deleteMany({ where: { productId } });
  if (urls.length > 0) {
    await prisma.productImage.createMany({
      data: urls.map((url, order) => ({ productId, url, order })),
    });
  }
}

export async function duplicateProduct(productId: string) {
  const session = await requireStaff();
  const original = await prisma.product.findUnique({ where: { id: productId } });
  if (!original) redirect("/admin/articles");

  const baseSlug = `${original.slug}-copie`;
  let slug = baseSlug;
  let i = 1;
  while (await prisma.product.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${i++}`;
  }

  const baseSku = `${original.sku}-COPIE`;
  let sku = baseSku;
  let j = 1;
  while (await prisma.product.findUnique({ where: { sku } })) {
    sku = `${baseSku}-${j++}`;
  }

  const copy = await prisma.product.create({
    data: {
      name: `${original.name} (copie)`,
      slug,
      sku,
      description: original.description,
      price: original.price,
      stock: 0,
      imageUrl: original.imageUrl,
      active: false,
      ingredients: original.ingredients,
      allergens: original.allergens,
      prepTimeMinutes: original.prepTimeMinutes,
      categoryId: original.categoryId,
      supplierId: original.supplierId,
      vatRate: original.vatRate,
    },
  });

  await logAudit(prisma, {
    actorId: session.userId,
    actorName: session.name,
    action: "product.duplicated",
    entityType: "Product",
    entityId: copy.id,
    summary: `Article dupliqué depuis "${original.name}"`,
  });

  redirect(`/admin/articles/${copy.id}?toast=product-duplicated`);
}

export async function deleteProduct(productId: string) {
  const session = await requireStaff();
  const product = await prisma.product.update({
    where: { id: productId },
    data: { active: false },
  });
  await logAudit(prisma, {
    actorId: session.userId,
    actorName: session.name,
    action: "product.deactivated",
    entityType: "Product",
    entityId: productId,
    summary: `Article désactivé : ${product.name}`,
  });
  revalidatePath("/admin/articles");
  redirect("/admin/articles?toast=product-deactivated");
}

export async function updateProductStock(productId: string, formData: FormData) {
  await requireStaff();
  const stock = Number(formData.get("stock"));
  if (!Number.isFinite(stock) || stock < 0) return;
  await prisma.product.update({ where: { id: productId }, data: { stock: Math.floor(stock) } });
  revalidatePath("/admin/articles");
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
