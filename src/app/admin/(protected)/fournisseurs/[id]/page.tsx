import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui";
import { Breadcrumb } from "@/components/breadcrumb";
import { ConfirmSubmitButton } from "@/components/confirm-button";
import { requirePermission } from "@/lib/permissions";
import { deleteSupplier, updateSupplier } from "../actions";
import { SupplierForm } from "../supplier-form";

export default async function FournisseurDetailPage({
  params,
}: PageProps<"/admin/fournisseurs/[id]">) {
  await requirePermission("fournisseurs.manage");
  const { id } = await params;
  const supplier = await prisma.supplier.findUnique({
    where: { id },
    include: { products: { orderBy: { name: "asc" } } },
  });

  if (!supplier) notFound();

  const boundUpdate = updateSupplier.bind(null, supplier.id);
  const boundDelete = deleteSupplier.bind(null, supplier.id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Breadcrumb
          items={[
            { label: "Fournisseurs", href: "/admin/fournisseurs" },
            { label: supplier.name },
          ]}
        />
        <h1 className="mt-1 text-2xl font-semibold">{supplier.name}</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SupplierForm
          action={boundUpdate}
          submitLabel="Enregistrer"
          defaultValues={{
            name: supplier.name,
            contactName: supplier.contactName ?? "",
            email: supplier.email ?? "",
            phone: supplier.phone ?? "",
            address: supplier.address ?? "",
            notes: supplier.notes ?? "",
          }}
        />

        <Card className="p-6">
          <h2 className="mb-3 font-semibold">Articles liés</h2>
          {supplier.products.length === 0 ? (
            <p className="text-sm text-muted">Aucun article associé.</p>
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {supplier.products.map((p) => (
                <li key={p.id}>
                  <Link href={`/admin/articles/${p.id}`} className="hover:text-brand">
                    {p.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <form action={boundDelete} className="w-fit">
        <ConfirmSubmitButton
          variant="danger"
          type="submit"
          confirmMessage={`Supprimer le fournisseur "${supplier.name}" ?`}
        >
          Supprimer ce fournisseur
        </ConfirmSubmitButton>
      </form>
    </div>
  );
}
