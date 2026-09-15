import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui";
import { deleteProduct, updateProduct } from "../actions";
import { ProductForm } from "../product-form";

export default async function ArticleDetailPage({
  params,
}: PageProps<"/admin/articles/[id]">) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    prisma.product.findUnique({ where: { id } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!product) notFound();

  const boundUpdate = updateProduct.bind(null, product.id);
  const boundDelete = deleteProduct.bind(null, product.id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/articles" className="text-sm text-muted hover:text-foreground">
          ← Retour aux articles
        </Link>
        <h1 className="mt-1 text-2xl font-semibold">{product.name}</h1>
      </div>

      <ProductForm
        action={boundUpdate}
        categories={categories}
        submitLabel="Enregistrer"
        defaultValues={{
          name: product.name,
          description: product.description ?? "",
          price: Number(product.price),
          stock: product.stock,
          sku: product.sku,
          categoryId: product.categoryId ?? "",
          imageUrl: product.imageUrl ?? "",
          active: product.active,
        }}
      />

      {product.active && (
        <form action={boundDelete} className="w-fit">
          <Button variant="danger" type="submit">
            Désactiver cet article
          </Button>
        </form>
      )}
    </div>
  );
}
