import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentCustomer } from "@/lib/auth-customer";
import { prisma } from "@/lib/db";
import { Badge, Button, Card } from "@/components/ui";
import { formatDate, formatDateOnly, formatPrice } from "@/lib/format";
import { getLoyaltyTier, isBirthdayPeriod, BIRTHDAY_DISCOUNT_PERCENT } from "@/lib/loyalty";
import { logoutCustomer } from "./actions";
import { ReorderButton } from "./reorder-button";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "En attente",
  READY: "Prête",
  COMPLETED: "Terminée",
  CANCELLED: "Annulée",
  REFUNDED: "Remboursée",
  PARTIALLY_REFUNDED: "Partiellement remboursée",
};

const STATUS_TONE: Record<string, "default" | "brand" | "warning" | "danger" | "muted"> = {
  PENDING: "warning",
  READY: "brand",
  COMPLETED: "muted",
  CANCELLED: "danger",
  REFUNDED: "danger",
  PARTIALLY_REFUNDED: "warning",
};

export default async function FidelitePage() {
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/connexion");

  const [orders, referralCount] = await Promise.all([
    prisma.order.findMany({
      where: { customerId: customer.id },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.customer.count({ where: { referredById: customer.id } }),
  ]);

  const tier = getLoyaltyTier(customer.lifetimePoints);
  const birthdayActive = isBirthdayPeriod(customer.birthDate);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">
            Bonjour {customer.firstName}
          </h1>
          <p className="mt-1 text-sm text-muted">
            Membre depuis le {formatDateOnly(customer.createdAt)}
          </p>
        </div>
        <form action={logoutCustomer}>
          <Button variant="secondary" type="submit">
            Se déconnecter
          </Button>
        </form>
      </div>

      {birthdayActive && (
        <Card className="border-brand/40 bg-brand-light p-4 text-brand-dark">
          🎂 Joyeux anniversaire ! Profitez de -{BIRTHDAY_DISCOUNT_PERCENT}% automatiquement
          appliqués sur vos achats cette semaine, en boutique comme en ligne.
        </Card>
      )}

      <Card className="flex flex-col items-start gap-1 bg-gradient-to-br from-brand to-brand-dark p-6 text-white sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-white/80">Solde de points fidélité</p>
          <p className="text-3xl font-semibold">{customer.points} pts</p>
          <p className="mt-1 text-sm text-white/80">
            Palier {tier.current.label}
            {tier.next &&
              ` · ${tier.pointsToNext} pts avant le palier ${tier.next.label}`}
          </p>
        </div>
        <p className="max-w-sm text-sm text-white/80">
          1 point est crédité pour chaque euro dépensé, en boutique comme en
          ligne. {tier.current.perk}.
        </p>
      </Card>

      <Card className="p-6">
        <h2 className="mb-2 font-semibold">Parrainez vos proches</h2>
        <p className="text-sm text-muted">
          Partagez votre code lors de la création d&apos;un compte fidélité en
          boutique : vous et votre filleul recevez des points bonus à sa
          première commande.
        </p>
        <div className="mt-3 flex items-center gap-3">
          <span className="rounded-lg bg-brand-light px-3 py-2 font-mono text-lg font-semibold text-brand-dark">
            {customer.referralCode}
          </span>
          <span className="text-sm text-muted">{referralCount} filleul(s)</span>
        </div>
      </Card>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Mes commandes</h2>
        {orders.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-white py-12 text-center text-muted">
            Vous n&apos;avez pas encore passé de commande.{" "}
            <Link href="/" className="text-brand hover:underline">
              Voir le catalogue
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {orders.map((order) => (
              <Card key={order.id} className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <Link
                      href={`/commande/${order.number}`}
                      className="font-medium hover:text-brand"
                    >
                      {order.number}
                    </Link>
                    <p className="text-xs text-muted">
                      {formatDate(order.createdAt)} ·{" "}
                      {order.source === "WEB" ? "Commande web" : "Vente en caisse"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge tone={STATUS_TONE[order.status]}>
                      {STATUS_LABEL[order.status]}
                    </Badge>
                    <span className="font-semibold">
                      {formatPrice(Number(order.total))}
                    </span>
                    <ReorderButton
                      items={order.items.map((i) => ({
                        productId: i.productId,
                        name: i.productName,
                        price: Number(i.unitPrice),
                      }))}
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
