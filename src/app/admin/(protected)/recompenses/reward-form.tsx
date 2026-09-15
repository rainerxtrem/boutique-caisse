"use client";

import { useActionState } from "react";
import { Button, FieldError, Input, Label, Textarea } from "@/components/ui";
import type { RewardFormState } from "./actions";

const initialState: RewardFormState = {};

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
  };
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

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
