import Link from "next/link";
import { prisma } from "@/lib/db";
import { createProduct } from "../actions";
import { ProductForm } from "../product-form";

export default async function NouvelArticlePage() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });

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
        submitLabel="Créer l'article"
      />
    </div>
  );
}
