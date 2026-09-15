import { prisma } from "@/lib/db";
import { Button, Card, Input, Textarea } from "@/components/ui";
import { ConfirmSubmitButton } from "@/components/confirm-button";
import { requirePermission } from "@/lib/permissions";
import { deleteTier, updateTier } from "./actions";
import { TierCreateForm } from "./tier-create-form";

export default async function FidelitePaliersPage() {
  await requirePermission("fidelite.manage_tiers");
  const tiers = await prisma.loyaltyTier.findMany({ orderBy: { minPoints: "asc" } });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Paliers fidélité</h1>
        <p className="text-sm text-muted">
          Définissez les seuils de points et les avantages affichés aux
          clients dans leur espace fidélité.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-4">
          {tiers.map((tier) => (
            <Card key={tier.id} className="p-5">
              <form action={updateTier.bind(null, tier.id)} className="flex flex-col gap-3">
                <div className="grid grid-cols-[1fr_140px_140px] gap-3">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">Nom du palier</label>
                    <Input name="label" defaultValue={tier.label} required />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">
                      Seuil (points)
                    </label>
                    <Input
                      name="minPoints"
                      type="number"
                      min={0}
                      defaultValue={tier.minPoints}
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">
                      Remise perm. (%)
                    </label>
                    <Input
                      name="discountPercent"
                      type="number"
                      min={0}
                      max={100}
                      step="0.01"
                      defaultValue={Number(tier.discountPercent)}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Avantage(s)</label>
                  <Textarea name="perk" rows={2} defaultValue={tier.perk} required />
                </div>
                <div className="flex justify-between gap-2">
                  <Button type="submit" variant="secondary" className="!py-1.5 text-xs">
                    Enregistrer
                  </Button>
                  <ConfirmSubmitButton
                    formAction={deleteTier.bind(null, tier.id)}
                    variant="danger"
                    className="!py-1.5 text-xs"
                    confirmMessage={`Supprimer le palier "${tier.label}" ?`}
                  >
                    Supprimer
                  </ConfirmSubmitButton>
                </div>
              </form>
            </Card>
          ))}
          {tiers.length === 0 && (
            <div className="rounded-xl border border-dashed border-border bg-white py-12 text-center text-muted">
              Aucun palier configuré — les clients seront tous affichés sous
              un palier générique par défaut.
            </div>
          )}
        </div>

        <Card className="h-fit p-6">
          <h2 className="mb-3 font-semibold">Nouveau palier</h2>
          <TierCreateForm />
        </Card>
      </div>
    </div>
  );
}
