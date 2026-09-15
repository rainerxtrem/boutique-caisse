import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatDate, formatPrice } from "@/lib/format";
import { PrintButton } from "./print-button";

const PAYMENT_LABEL: Record<string, string> = {
  CASH: "Espèces",
  CARD: "Carte bancaire",
  MIXED: "Paiement mixte",
};

export default async function ReceiptPage({
  params,
}: PageProps<"/admin/caisse/recu/[number]">) {
  const { number } = await params;
  const order = await prisma.order.findUnique({
    where: { number },
    include: { items: true, customer: true, user: true },
  });

  if (!order || order.source !== "CAISSE") notFound();

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-4">
      <div className="no-print flex flex-col gap-2">
        <PrintButton />
        <Link
          href={`/admin/commandes/${order.id}`}
          className="text-center text-sm text-muted hover:text-foreground"
        >
          Voir le détail / rembourser
        </Link>
      </div>

      <div className="rounded-xl border border-border bg-white p-6 font-mono text-sm">
        <div className="text-center">
          <p className="text-base font-semibold">La Boutique</p>
          <p className="text-xs text-muted">Ticket de caisse</p>
        </div>
        <div className="my-3 border-t border-dashed border-border" />
        <p>N° {order.number}</p>
        <p>{formatDate(order.createdAt)}</p>
        <p>Vendeur : {order.user?.name ?? "—"}</p>
        {order.registerLabel && <p>Poste : {order.registerLabel}</p>}
        {order.customer && (
          <p>
            Client : {order.customer.firstName} {order.customer.lastName}
          </p>
        )}
        <div className="my-3 border-t border-dashed border-border" />
        <div className="flex flex-col gap-1">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between gap-2">
              <span>
                {item.qty} x {item.productName}
                {Number(item.discountPercent) > 0 && ` (-${item.discountPercent}%)`}
              </span>
              <span>{formatPrice(Number(item.lineTotal))}</span>
            </div>
          ))}
        </div>
        <div className="my-3 border-t border-dashed border-border" />
        <div className="flex justify-between">
          <span>Sous-total</span>
          <span>{formatPrice(Number(order.subtotal))}</span>
        </div>
        {Number(order.discountTotal) > 0 && (
          <div className="flex justify-between">
            <span>Remises</span>
            <span>-{formatPrice(Number(order.discountTotal))}</span>
          </div>
        )}
        <div className="flex justify-between text-base font-semibold">
          <span>Total</span>
          <span>{formatPrice(Number(order.total))}</span>
        </div>
        <div className="my-3 border-t border-dashed border-border" />
        <p>Paiement : {order.paymentMethod ? PAYMENT_LABEL[order.paymentMethod] : "—"}</p>
        {order.paymentMethod !== "CARD" && order.amountPaid != null && (
          <div className="flex justify-between">
            <span>Reçu</span>
            <span>{formatPrice(Number(order.amountPaid))}</span>
          </div>
        )}
        {Number(order.changeGiven) > 0 && (
          <div className="flex justify-between">
            <span>Rendu</span>
            <span>{formatPrice(Number(order.changeGiven))}</span>
          </div>
        )}
        <div className="my-3 border-t border-dashed border-border" />
        <p className="text-center text-xs text-muted">Merci de votre visite !</p>
      </div>
    </div>
  );
}
