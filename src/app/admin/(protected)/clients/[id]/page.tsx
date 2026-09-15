import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Badge, Card } from "@/components/ui";
import { Breadcrumb } from "@/components/breadcrumb";
import { ConfirmSubmitButton } from "@/components/confirm-button";
import { formatDate, formatDateOnly, formatPrice } from "@/lib/format";
import { getLoyaltyTier } from "@/lib/loyalty";
import { requirePermission } from "@/lib/permissions";
import { deleteCustomer, updateCustomer } from "../actions";
import { CustomerForm } from "../client-form";

export default async function ClientDetailPage({
  params,
}: PageProps<"/admin/clients/[id]">) {
  await requirePermission("clients.view");
  const { id } = await params;
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      orders: { orderBy: { createdAt: "desc" } },
      referredBy: true,
      referrals: true,
    },
  });

  if (!customer) notFound();

  const boundUpdate = updateCustomer.bind(null, customer.id);
  const boundDelete = deleteCustomer.bind(null, customer.id);
  const tier = await getLoyaltyTier(customer.lifetimePoints);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Breadcrumb
          items={[
            { label: "Clients fidélité", href: "/admin/clients" },
            { label: `${customer.firstName} ${customer.lastName}` },
          ]}
        />
        <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-2xl font-semibold">
            {customer.firstName} {customer.lastName}
          </h1>
          <div className="flex items-center gap-2">
            <Badge tone="muted">Palier {tier.current.label}</Badge>
            <Badge tone="brand">{customer.points} pts</Badge>
          </div>
        </div>
        {!customer.birthDate && (
          <p className="mt-1 text-xs text-amber-700">
            Compte créé rapidement en caisse — pensez à compléter la date de
            naissance ci-dessous.
          </p>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          <CustomerForm
            action={boundUpdate}
            mode="edit"
            submitLabel="Enregistrer"
            defaultValues={{
              firstName: customer.firstName,
              lastName: customer.lastName,
              birthDate: customer.birthDate ? customer.birthDate.toISOString().slice(0, 10) : "",
              phone: customer.phone,
              permanentDiscountPercent: Number(customer.permanentDiscountPercent),
            }}
          />

          <Card className="p-6">
            <h2 className="mb-3 font-semibold">Parrainage</h2>
            <p className="text-sm text-muted">
              Code personnel : <span className="font-mono font-medium text-foreground">{customer.referralCode}</span>
            </p>
            {customer.referredBy && (
              <p className="mt-1 text-sm text-muted">
                Parrainé par{" "}
                <Link href={`/admin/clients/${customer.referredBy.id}`} className="text-brand hover:underline">
                  {customer.referredBy.firstName} {customer.referredBy.lastName}
                </Link>
                {customer.referralBonusGranted ? (
                  <Badge tone="brand" className="ml-2">Bonus crédité</Badge>
                ) : (
                  <Badge tone="warning" className="ml-2">Bonus en attente (1ère commande)</Badge>
                )}
              </p>
            )}
            {customer.referrals.length === 0 ? (
              <p className="mt-3 text-sm text-muted">Aucun filleul pour l&apos;instant.</p>
            ) : (
              <div className="mt-3">
                <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted">
                  {customer.referrals.length} filleul(s)
                </p>
                <ul className="flex flex-col gap-1.5">
                  {customer.referrals.map((r) => (
                    <li key={r.id} className="flex items-center justify-between text-sm">
                      <Link href={`/admin/clients/${r.id}`} className="hover:text-brand">
                        {r.firstName} {r.lastName}
                      </Link>
                      {r.referralBonusGranted ? (
                        <Badge tone="brand">Bonus crédité</Badge>
                      ) : (
                        <Badge tone="warning">En attente</Badge>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        </div>

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
          {customer.lastOrderAt && (
            <p className="mt-3 text-xs text-muted">
              Dernière commande le {formatDateOnly(customer.lastOrderAt)}
            </p>
          )}
        </Card>
      </div>

      <form action={boundDelete} className="w-fit">
        <ConfirmSubmitButton
          variant="danger"
          type="submit"
          confirmMessage={`Supprimer définitivement le compte de ${customer.firstName} ${customer.lastName} ? Cette action est irréversible.`}
        >
          Supprimer ce compte fidélité
        </ConfirmSubmitButton>
      </form>
    </div>
  );
}
