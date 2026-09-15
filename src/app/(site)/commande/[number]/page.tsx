import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentCustomer } from "@/lib/auth-customer";
import { Badge, Card } from "@/components/ui";
import { formatDate, formatPrice } from "@/lib/format";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "En attente de préparation",
  READY: "Prête à être retirée",
  COMPLETED: "Retirée / terminée",
  CANCELLED: "Annulée",
};

export default async function OrderConfirmationPage({
  params,
}: PageProps<"/commande/[number]">) {
  const { number } = await params;
  const customer = await getCurrentCustomer();
  if (!customer) notFound();

  const order = await prisma.order.findUnique({
    where: { number },
    include: { items: true },
  });

  if (!order || order.customerId !== customer.id) notFound();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div className="text-center">
        <p className="text-sm font-medium text-brand">Commande confirmée</p>
        <h1 className="mt-1 text-2xl font-semibold">{order.number}</h1>
        <p className="mt-1 text-sm text-muted">{formatDate(order.createdAt)}</p>
      </div>

      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <span className="font-medium">Statut</span>
          <Badge tone="brand">{STATUS_LABEL[order.status]}</Badge>
        </div>
        <div className="flex flex-col divide-y divide-border">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium">{item.productName}</p>
                <p className="text-sm text-muted">
                  {item.qty} × {formatPrice(Number(item.unitPrice))}
                </p>
              </div>
              <span className="font-medium">
                {formatPrice(Number(item.lineTotal))}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-border pt-4 text-lg font-semibold">
          <span>Total à régler en boutique</span>
          <span>{formatPrice(Number(order.total))}</span>
        </div>
      </Card>

      <p className="text-center text-sm text-muted">
        Rendez-vous en boutique pour récupérer et régler votre commande.
      </p>

      <div className="flex justify-center gap-4 text-sm">
        <Link href="/fidelite" className="text-brand hover:underline">
          Mes commandes
        </Link>
        <Link href="/" className="text-muted hover:text-foreground">
          Retour au catalogue
        </Link>
      </div>
    </div>
  );
}
