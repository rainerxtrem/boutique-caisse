"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button, FieldError, Input, Label, Textarea } from "@/components/ui";
import { useToast } from "@/components/toast-provider";
import { createTier, type TierFormState } from "./actions";

const initialState: TierFormState = {};

export function TierCreateForm() {
  const [state, formAction, pending] = useActionState(createTier, initialState);
  const { showToast } = useToast();
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && state.success) {
      showToast("Palier créé.");
    }
    wasPending.current = pending;
  }, [pending, state, showToast]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <Label htmlFor="label">Nom du palier</Label>
        <Input id="label" name="label" placeholder="Platine" required />
      </div>
      <div>
        <Label htmlFor="minPoints">Seuil (points cumulés)</Label>
        <Input id="minPoints" name="minPoints" type="number" min={0} required />
      </div>
      <div>
        <Label htmlFor="perk">Avantage(s)</Label>
        <Textarea
          id="perk"
          name="perk"
          rows={2}
          placeholder="Ex: livraison offerte, cadeau anniversaire..."
          required
        />
      </div>
      <FieldError>{state.error}</FieldError>
      <Button type="submit" disabled={pending}>
        {pending ? "Création..." : "Ajouter le palier"}
      </Button>
    </form>
  );
}
