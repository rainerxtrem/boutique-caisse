import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/breadcrumb";
import { ConfirmSubmitButton } from "@/components/confirm-button";
import { Card } from "@/components/ui";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { deleteBanner, updateBanner } from "../actions";
import { BannerForm } from "../banner-form";

export default async function BannerDetailPage({
  params,
}: PageProps<"/admin/bannieres/[id]">) {
  await requirePermission("bannieres.manage");
  const { id } = await params;
  const banner = await prisma.banner.findUnique({ where: { id } });
  if (!banner) notFound();

  const boundUpdate = updateBanner.bind(null, banner.id);
  const boundDelete = deleteBanner.bind(null, banner.id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Breadcrumb
          items={[{ label: "Bannières", href: "/admin/bannieres" }, { label: banner.title }]}
        />
        <h1 className="mt-1 text-2xl font-semibold">{banner.title}</h1>
      </div>

      <Card className="max-w-xl p-6">
        <BannerForm
          action={boundUpdate}
          submitLabel="Enregistrer"
          defaultValues={{
            title: banner.title,
            subtitle: banner.subtitle ?? "",
            imageUrl: banner.imageUrl ?? "",
            ctaLabel: banner.ctaLabel ?? "",
            ctaHref: banner.ctaHref ?? "",
            active: banner.active,
            order: banner.order,
          }}
        />
      </Card>

      <form action={boundDelete} className="w-fit">
        <ConfirmSubmitButton
          variant="danger"
          type="submit"
          confirmMessage={`Supprimer la bannière "${banner.title}" ?`}
        >
          Supprimer cette bannière
        </ConfirmSubmitButton>
      </form>
    </div>
  );
}
