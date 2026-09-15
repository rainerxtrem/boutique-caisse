import Link from "next/link";
import { prisma } from "@/lib/db";
import { createProduct } from "../actions";
import { ProductForm } from "../product-form";

export default async function NouvelArticlePage() {
  const [categories, suppliers, relatedOptions] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.supplier.findMany({ orderBy: { name: "asc" } }),
    prisma.product.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/articles" className="text-sm text-muted hover:text-foreground">
          ← Retour aux articles
        </Link>
        <h1 className="mt-1 text-2xl font-semibold">Nouvel article</h1>
      </div>
      <ProductForm
        action={createProduct}
        categories={categories}
        suppliers={suppliers}
        relatedOptions={relatedOptions}
        submitLabel="Créer l'article"
      />
    </div>
  );
}
