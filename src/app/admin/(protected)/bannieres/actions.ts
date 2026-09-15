"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";

const bannerSchema = z.object({
  title: z.string().min(1, "Titre requis"),
  subtitle: z.string().optional(),
  imageUrl: z.string().optional(),
  ctaLabel: z.string().optional(),
  ctaHref: z.string().optional(),
  active: z.coerce.boolean().optional(),
  order: z.coerce.number().int().optional(),
});

export type BannerFormState = { error?: string };

function readBannerForm(formData: FormData) {
  return bannerSchema.safeParse({
    title: formData.get("title"),
    subtitle: formData.get("subtitle") || undefined,
    imageUrl: formData.get("imageUrl") || undefined,
    ctaLabel: formData.get("ctaLabel") || undefined,
    ctaHref: formData.get("ctaHref") || undefined,
    active: formData.get("active") === "on",
    order: formData.get("order") || undefined,
  });
}

export async function createBanner(
  _prevState: BannerFormState,
  formData: FormData
): Promise<BannerFormState> {
  await requirePermission("bannieres.manage");
  const parsed = readBannerForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  await prisma.banner.create({
    data: {
      title: parsed.data.title,
      subtitle: parsed.data.subtitle || null,
      imageUrl: parsed.data.imageUrl || null,
      ctaLabel: parsed.data.ctaLabel || null,
      ctaHref: parsed.data.ctaHref || null,
      active: parsed.data.active ?? true,
      order: parsed.data.order ?? 0,
    },
  });

  revalidatePath("/admin/bannieres");
  revalidatePath("/");
  redirect("/admin/bannieres?toast=banner-created");
}

export async function updateBanner(
  bannerId: string,
  _prevState: BannerFormState,
  formData: FormData
): Promise<BannerFormState> {
  await requirePermission("bannieres.manage");
  const parsed = readBannerForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  await prisma.banner.update({
    where: { id: bannerId },
    data: {
      title: parsed.data.title,
      subtitle: parsed.data.subtitle || null,
      imageUrl: parsed.data.imageUrl || null,
      ctaLabel: parsed.data.ctaLabel || null,
      ctaHref: parsed.data.ctaHref || null,
      active: parsed.data.active ?? true,
      order: parsed.data.order ?? 0,
    },
  });

  revalidatePath("/admin/bannieres");
  revalidatePath("/");
  redirect("/admin/bannieres?toast=banner-updated");
}

export async function deleteBanner(bannerId: string) {
  const session = await requirePermission("bannieres.manage");
  const banner = await prisma.banner.findUnique({ where: { id: bannerId } });
  await prisma.banner.delete({ where: { id: bannerId } });
  if (banner) {
    await logAudit(prisma, {
      actorId: session.userId,
      actorName: session.name,
      action: "banner.deleted",
      entityType: "Banner",
      entityId: bannerId,
      summary: `Bannière supprimée : ${banner.title}`,
    });
  }
  revalidatePath("/admin/bannieres");
  revalidatePath("/");
  redirect("/admin/bannieres?toast=banner-deleted");
}
