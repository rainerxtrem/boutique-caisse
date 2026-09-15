"use client";

import { useActionState, useState } from "react";
import { Button, FieldError, Input, Label, Select, Textarea } from "@/components/ui";
import type { RewardFormState } from "./actions";

const initialState: RewardFormState = {};

type RewardType = "PHYSICAL" | "PERCENT" | "FIXED";

export function RewardForm({
  action,
  defaultValues,
  submitLabel,
}: {
  action: (prevState: RewardFormState, formData: FormData) => Promise<RewardFormState>;
  defaultValues?: {
    name: string;
    description: string;
    pointsCost: number;
    imageUrl: string;
    active: boolean;
    type: RewardType;
    value: number | null;
  };
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [type, setType] = useState<RewardType>(defaultValues?.type ?? "PHYSICAL");

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <Label htmlFor="name">Nom de la récompense</Label>
        <Input id="name" name="name" defaultValue={defaultValues?.name} required />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" rows={2} defaultValue={defaultValues?.description} />
      </div>
      <div>
        <Label htmlFor="pointsCost">Coût en points</Label>
        <Input
          id="pointsCost"
          name="pointsCost"
          type="number"
          min={1}
          defaultValue={defaultValues?.pointsCost}
          required
        />
      </div>
      <div>
        <Label htmlFor="type">Type de récompense</Label>
        <Select
          id="type"
          name="type"
          value={type}
          onChange={(e) => setType(e.target.value as RewardType)}
        >
          <option value="PHYSICAL">Récompense physique (à remettre en boutique)</option>
          <option value="PERCENT">Réduction en pourcentage</option>
          <option value="FIXED">Réduction en montant fixe</option>
        </Select>
        <p className="mt-1 text-xs text-muted">
          {type === "PHYSICAL"
            ? "Le client présente son code d'échange en boutique, un membre du personnel la remet manuellement."
            : "Applicable directement en caisse lorsque le vendeur sélectionne le client."}
        </p>
      </div>
      {type !== "PHYSICAL" && (
        <div>
          <Label htmlFor="value">
            {type === "PERCENT" ? "Pourcentage de réduction (%)" : "Montant de la réduction (€)"}
          </Label>
          <Input
            id="value"
            name="value"
            type="number"
            min={0.01}
            max={type === "PERCENT" ? 100 : undefined}
            step="0.01"
            defaultValue={defaultValues?.value ?? undefined}
            required
          />
        </div>
      )}
      <div>
        <Label htmlFor="imageUrl">Image (URL, optionnel)</Label>
        <Input id="imageUrl" name="imageUrl" defaultValue={defaultValues?.imageUrl} placeholder="https://..." />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="active" defaultChecked={defaultValues?.active ?? true} />
        Disponible à l&apos;échange
      </label>
      <FieldError>{state.error}</FieldError>
      <Button type="submit" disabled={pending}>
        {pending ? "Enregistrement..." : submitLabel}
      </Button>
    </form>
  );
}
