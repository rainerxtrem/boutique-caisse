import { prisma } from "@/lib/db";
import { Badge, Button, Card } from "@/components/ui";
import { ConfirmSubmitButton } from "@/components/confirm-button";
import { EmptyState } from "@/components/empty-state";
import { formatDateOnly, formatPrice } from "@/lib/format";
import { deletePromoCode, togglePromoCode } from "./actions";
import { PromoForm } from "./promo-form";

export default async function PromotionsPage() {
  const promos = await prisma.promoCode.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Codes promo</h1>
        <p className="text-sm text-muted">
          Utilisables au panier (site) et en caisse.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {promos.length === 0 ? (
          <EmptyState
            icon="box"
            title="Aucun code promo"
            description="Créez votre premier code promo à droite."
          />
        ) : (
          <Card className="overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-muted">
                <tr>
                  <th className="px-4 py-3 text-left">Code</th>
                  <th className="px-4 py-3 text-left">Réduction</th>
                  <th className="px-4 py-3 text-left">Validité</th>
                  <th className="px-4 py-3 text-right">Utilisations</th>
                  <th className="px-4 py-3 text-center">Statut</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {promos.map((p) => (
                  <tr key={p.id} className="border-t border-border hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono font-medium">{p.code}</td>
                    <td className="px-4 py-3">
                      {p.type === "PERCENT" ? `${p.value}%` : formatPrice(Number(p.value))}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {p.startsAt ? formatDateOnly(p.startsAt) : "—"} →{" "}
                      {p.endsAt ? formatDateOnly(p.endsAt) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {p.usageCount}
                      {p.usageLimit ? ` / ${p.usageLimit}` : ""}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge tone={p.active ? "brand" : "muted"}>
                        {p.active ? "Actif" : "Inactif"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <form action={togglePromoCode.bind(null, p.id, !p.active)}>
                          <Button variant="secondary" type="submit" className="!py-1 text-xs">
                            {p.active ? "Désactiver" : "Activer"}
                          </Button>
                        </form>
                        {p.usageCount === 0 && (
                          <form action={deletePromoCode.bind(null, p.id)}>
                            <ConfirmSubmitButton
                              variant="danger"
                              type="submit"
                              className="!py-1 text-xs"
                              confirmMessage={`Supprimer le code "${p.code}" ?`}
                            >
                              Suppr.
                            </ConfirmSubmitButton>
                          </form>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}

        <Card className="h-fit p-6">
          <h2 className="mb-3 font-semibold">Nouveau code</h2>
          <PromoForm />
        </Card>
      </div>
    </div>
  );
}
