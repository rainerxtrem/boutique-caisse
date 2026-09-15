import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Badge, Button, Card } from "@/components/ui";
import { Breadcrumb } from "@/components/breadcrumb";
import { ConfirmSubmitButton } from "@/components/confirm-button";
import { formatDate, formatPrice } from "@/lib/format";
import { requirePermission } from "@/lib/permissions";
import { deleteProduct, duplicateProduct, updateProduct } from "../actions";
import { ProductForm } from "../product-form";

export default async function ArticleDetailPage({
  params,
}: PageProps<"/admin/articles/[id]">) {
  await requirePermission("articles.view");
  const { id } = await params;
  const [product, categories, suppliers, relatedOptions, relations, priceHistory, images] =
    await Promise.all([
      prisma.product.findUnique({ where: { id } }),
      prisma.category.findMany({ orderBy: { name: "asc" } }),
      prisma.supplier.findMany({ orderBy: { name: "asc" } }),
      prisma.product.findMany({
        where: { id: { not: id } },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
      prisma.productRelation.findMany({ where: { productId: id } }),
      prisma.priceHistory.findMany({
        where: { productId: id },
        include: { changedBy: true },
        orderBy: { changedAt: "desc" },
        take: 10,
      }),
      prisma.productImage.findMany({ where: { productId: id }, orderBy: { order: "asc" } }),
    ]);

  if (!product) notFound();

  const boundUpdate = updateProduct.bind(null, product.id);
  const boundDelete = deleteProduct.bind(null, product.id);
  const boundDuplicate = duplicateProduct.bind(null, product.id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Breadcrumb
          items={[{ label: "Articles", href: "/admin/articles" }, { label: product.name }]}
        />
        <div className="mt-1 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">{product.name}</h1>
          <form action={boundDuplicate}>
            <Button variant="secondary" type="submit" className="!py-1.5 text-xs">
              Dupliquer
            </Button>
          </form>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <ProductForm
          action={boundUpdate}
          categories={categories}
          suppliers={suppliers}
          relatedOptions={relatedOptions}
          submitLabel="Enregistrer"
          defaultValues={{
            name: product.name,
            description: product.description ?? "",
            price: Number(product.price),
            stock: product.stock,
            vatRate: Number(product.vatRate),
            sku: product.sku,
            categoryId: product.categoryId ?? "",
            supplierId: product.supplierId ?? "",
            imageUrl: product.imageUrl ?? "",
            active: product.active,
            ingredients: product.ingredients ?? "",
            allergens: product.allergens ?? "",
            prepTimeMinutes: product.prepTimeMinutes,
            temporarilyUnavailable: product.temporarilyUnavailable,
            featured: product.featured,
            flashPrice: product.flashPrice ? Number(product.flashPrice) : null,
            flashPriceEndsAt: product.flashPriceEndsAt
              ? product.flashPriceEndsAt.toISOString().slice(0, 16)
              : "",
            relatedIds: relations.map((r) => r.relatedProductId),
            imageUrls: images.map((i) => i.url).join("\n"),
          }}
        />

        <Card className="h-fit p-4">
          <h2 className="mb-3 text-sm font-semibold">Historique des prix</h2>
          {priceHistory.length === 0 ? (
            <p className="text-sm text-muted">Aucune modification enregistrée.</p>
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {priceHistory.map((h) => (
                <li key={h.id} className="border-b border-border pb-2">
                  <div className="flex items-center justify-between">
                    <span>
                      {formatPrice(Number(h.oldPrice))} → {formatPrice(Number(h.newPrice))}
                    </span>
                    <Badge tone={Number(h.newPrice) > Number(h.oldPrice) ? "warning" : "brand"}>
                      {Number(h.newPrice) > Number(h.oldPrice) ? "+" : ""}
                      {(Number(h.newPrice) - Number(h.oldPrice)).toFixed(2)}€
                    </Badge>
                  </div>
                  <p className="text-xs text-muted">
                    {formatDate(h.changedAt)} {h.changedBy ? `· ${h.changedBy.name}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {product.active && (
        <form action={boundDelete} className="w-fit">
          <ConfirmSubmitButton
            variant="danger"
            type="submit"
            confirmMessage={`Désactiver "${product.name}" ? Il ne sera plus visible ni vendable.`}
          >
            Désactiver cet article
          </ConfirmSubmitButton>
        </form>
      )}
    </div>
  );
}
