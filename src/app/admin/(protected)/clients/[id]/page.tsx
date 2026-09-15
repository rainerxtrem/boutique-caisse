import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Badge, Button, Card } from "@/components/ui";
import { formatDate, formatPrice } from "@/lib/format";
import { deleteCustomer, updateCustomer } from "../actions";
import { CustomerForm } from "../client-form";

export default async function ClientDetailPage({
  params,
}: PageProps<"/admin/clients/[id]">) {
  const { id } = await params;
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: { orders: { orderBy: { createdAt: "desc" } } },
  });

  if (!customer) notFound();

  const boundUpdate = updateCustomer.bind(null, customer.id);
  const boundDelete = deleteCustomer.bind(null, customer.id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/clients" className="text-sm text-muted hover:text-foreground">
          ← Retour aux clients
        </Link>
        <div className="mt-1 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">
            {customer.firstName} {customer.lastName}
          </h1>
          <Badge tone="brand">{customer.points} pts</Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <CustomerForm
          action={boundUpdate}
          submitLabel="Enregistrer"
          defaultValues={{
            firstName: customer.firstName,
            lastName: customer.lastName,
            birthDate: customer.birthDate.toISOString().slice(0, 10),
            phone: customer.phone,
          }}
        />

        <Card className="p-6">
          <h2 className="mb-3 font-semibold">Historique des commandes</h2>
          {customer.orders.length === 0 ? (
            <p className="text-sm text-muted">Aucune commande enregistrée.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {customer.orders.map((order) => (
                <li
                  key={order.id}
                  className="flex items-center justify-between border-b border-border pb-2 text-sm"
                >
                  <div>
                    <p className="font-medium">{order.number}</p>
                    <p className="text-xs text-muted">
                      {formatDate(order.createdAt)} ·{" "}
                      {order.source === "WEB" ? "Web" : "Caisse"}
                    </p>
                  </div>
                  <span className="font-semibold">
                    {formatPrice(Number(order.total))}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <form action={boundDelete} className="w-fit">
        <Button variant="danger" type="submit">
          Supprimer ce compte fidélité
        </Button>
      </form>
    </div>
  );
}
