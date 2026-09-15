import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/breadcrumb";
import { ConfirmSubmitButton } from "@/components/confirm-button";
import { Card } from "@/components/ui";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { deleteReward, updateReward } from "../actions";
import { RewardForm } from "../reward-form";

export default async function RewardDetailPage({
  params,
}: PageProps<"/admin/recompenses/[id]">) {
  await requirePermission("recompenses.manage");
  const { id } = await params;
  const reward = await prisma.reward.findUnique({ where: { id } });
  if (!reward) notFound();

  const boundUpdate = updateReward.bind(null, reward.id);
  const boundDelete = deleteReward.bind(null, reward.id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Breadcrumb
          items={[{ label: "Récompenses", href: "/admin/recompenses" }, { label: reward.name }]}
        />
        <h1 className="mt-1 text-2xl font-semibold">{reward.name}</h1>
      </div>

      <Card className="max-w-xl p-6">
        <RewardForm
          action={boundUpdate}
          submitLabel="Enregistrer"
          defaultValues={{
            name: reward.name,
            description: reward.description ?? "",
            pointsCost: reward.pointsCost,
            imageUrl: reward.imageUrl ?? "",
            active: reward.active,
            type: reward.type,
            value: reward.value != null ? Number(reward.value) : null,
          }}
        />
      </Card>

      <form action={boundDelete} className="w-fit">
        <ConfirmSubmitButton
          variant="danger"
          type="submit"
          confirmMessage={`Supprimer la récompense "${reward.name}" ?`}
        >
          Supprimer cette récompense
        </ConfirmSubmitButton>
      </form>
    </div>
  );
}
