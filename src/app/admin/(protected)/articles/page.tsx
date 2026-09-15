import { Suspense } from "react";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { Badge, Button, Card, Input } from "@/components/ui";
import { LiveSearchInput } from "@/components/live-search-input";
import { Pagination } from "@/components/pagination";
import { EmptyState } from "@/components/empty-state";
import { formatPrice } from "@/lib/format";
import { parsePage, paginationSkipTake, totalPages } from "@/lib/pagination";
import { createCategory } from "./actions";
import { StockQuickEdit } from "./stock-quick-edit";

export default async function ArticlesPage({
  searchParams,
}: PageProps<"/admin/articles">) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const page = parsePage(params.page);

  const where = q ? { name: { contains: q, mode: "insensitive" as const } } : undefined;

  const [products, count, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: true },
      orderBy: { name: "asc" },
      ...paginationSkipTake(page),
    }),
    prisma.product.count({ where }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Articles</h1>
          <p className="text-sm text-muted">Catalogue, prix et stock.</p>
        </div>
        <Link href="/admin/articles/nouveau">
          <Button>+ Nouvel article</Button>
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
        <div className="flex flex-col gap-4">
          <Suspense fallback={<Input placeholder="Rechercher un article..." disabled />}>
            <div className="max-w-sm">
              <LiveSearchInput placeholder="Rechercher un article..." />
            </div>
          </Suspense>

          {products.length === 0 ? (
            <EmptyState
              icon="search"
              title="Aucun article trouvé"
              description={q ? `Aucun résultat pour "${q}".` : "Ajoutez votre premier article."}
            />
          ) : (
            <>
              <Card className="overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs uppercase text-muted">
                    <tr>
                      <th className="px-4 py-3 text-left">Article</th>
                      <th className="px-4 py-3 text-left">Catégorie</th>
                      <th className="px-4 py-3 text-right">Prix</th>
                      <th className="px-4 py-3 text-right">Stock</th>
                      <th className="px-4 py-3 text-center">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => (
                      <tr key={p.id} className="border-t border-border hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <Link
                            href={`/admin/articles/${p.id}`}
                            className="font-medium hover:text-brand"
                          >
                            {p.name}
                          </Link>
                          <p className="text-xs text-muted">{p.sku}</p>
                        </td>
                        <td className="px-4 py-3 text-muted">
                          {p.category?.name ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {formatPrice(Number(p.price))}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <StockQuickEdit productId={p.id} initialStock={p.stock} />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge tone={p.active ? "brand" : "muted"}>
                            {p.active ? "Actif" : "Désactivé"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
              <Pagination
                page={page}
                totalPages={totalPages(count)}
                searchParams={params}
                basePath="/admin/articles"
              />
            </>
          )}
        </div>

        <Card className="h-fit p-4">
          <h2 className="mb-3 text-sm font-semibold">Catégories</h2>
          <ul className="mb-4 flex flex-col gap-1 text-sm">
            {categories.map((c) => (
              <li key={c.id} className="text-muted">
                {c.name}
              </li>
            ))}
            {categories.length === 0 && (
              <li className="text-muted">Aucune catégorie.</li>
            )}
          </ul>
          <form action={createCategory} className="flex gap-2">
            <Input name="categoryName" placeholder="Nouvelle catégorie" required />
            <Button type="submit" variant="secondary" className="!px-3">
              +
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
