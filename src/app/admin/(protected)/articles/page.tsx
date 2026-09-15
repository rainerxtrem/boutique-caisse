import Link from "next/link";
import { prisma } from "@/lib/db";
import { Badge, Button, Card, Input } from "@/components/ui";
import { formatPrice } from "@/lib/format";
import { createCategory } from "./actions";

export default async function ArticlesPage({
  searchParams,
}: PageProps<"/admin/articles">) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: q ? { name: { contains: q, mode: "insensitive" } } : undefined,
      include: { category: true },
      orderBy: { name: "asc" },
    }),
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
          <form className="max-w-sm">
            <Input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Rechercher un article..."
            />
          </form>

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
                      <Badge tone={p.stock === 0 ? "danger" : p.stock <= 5 ? "warning" : "brand"}>
                        {p.stock}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge tone={p.active ? "brand" : "muted"}>
                        {p.active ? "Actif" : "Désactivé"}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-muted">
                      Aucun article trouvé.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Card>
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
