import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentCustomer } from "@/lib/auth-customer";
import { prisma } from "@/lib/db";
import { Badge, Button, Card } from "@/components/ui";
import { formatDate, formatDateOnly, formatPrice } from "@/lib/format";
import {
  getLoyaltyTiers,
  resolveTier,
  isBirthdayPeriod,
  BIRTHDAY_DISCOUNT_PERCENT,
} from "@/lib/loyalty";
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

  const [orders, referralCount, tiers] = await Promise.all([
    prisma.order.findMany({
      where: { customerId: customer.id },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.customer.count({ where: { referredById: customer.id } }),
    getLoyaltyTiers(),
  ]);

  const tier = resolveTier(tiers, customer.lifetimePoints);
  const birthdayActive = isBirthdayPeriod(customer.birthDate);

  const progressPercent = tier.next
    ? Math.min(
        100,
        Math.round(
          ((customer.lifetimePoints - tier.current.minPoints) /
            (tier.next.minPoints - tier.current.minPoints)) *
            100
        )
      )
    : 100;

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

      {/* Loyalty hero */}
      <Card className="overflow-hidden bg-gradient-to-br from-brand to-brand-dark text-white">
        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm text-white/80">Solde de points fidélité</p>
              <p className="text-4xl font-bold">{customer.points} pts</p>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-white/15 px-4 py-2">
              <span className="text-lg">🏆</span>
              <span className="text-lg font-semibold">Palier {tier.current.label}</span>
            </div>
          </div>

          <div className="mt-6">
            <div className="h-3 w-full overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-white transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="mt-2 text-sm text-white/85">
              {tier.next
                ? `Plus que ${tier.pointsToNext} pts pour atteindre le palier ${tier.next.label} !`
                : "Vous avez atteint le plus haut palier fidélité 🎉"}
            </p>
          </div>
        </div>
      </Card>

      {/* Tier ladder */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Paliers & avantages</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tiers.map((t, i) => {
            const isCurrent = t.id === tier.current.id;
            const isUnlocked = customer.lifetimePoints >= t.minPoints;
            return (
              <Card
                key={t.id}
                className={`flex flex-col gap-2 p-5 ${
                  isCurrent ? "border-2 border-brand ring-2 ring-brand/20" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                        isUnlocked
                          ? "bg-brand text-white"
                          : "bg-gray-100 text-muted"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <span className="font-semibold">{t.label}</span>
                  </div>
                  {isCurrent && <Badge tone="brand">Palier actuel</Badge>}
                  {!isCurrent && isUnlocked && <Badge tone="muted">Débloqué</Badge>}
                </div>
                <p className="text-xs text-muted">
                  Dès {t.minPoints} pts cumulés
                </p>
                <p className="text-sm">{t.perk}</p>
              </Card>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-muted">
          1 point est crédité pour chaque euro dépensé, en boutique comme en
          ligne. Les paliers se calculent sur le total de points jamais
          gagnés (ils ne redescendent pas si vous utilisez vos points).
        </p>
      </div>

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
