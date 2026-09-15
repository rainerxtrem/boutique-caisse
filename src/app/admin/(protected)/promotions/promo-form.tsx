"use client";

import { useActionState } from "react";
import { Button, FieldError, Input, Label, Select } from "@/components/ui";
import { createPromoCode, type PromoFormState } from "./actions";

const initialState: PromoFormState = {};

export function PromoForm() {
  const [state, formAction, pending] = useActionState(createPromoCode, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <Label htmlFor="code">Code</Label>
        <Input id="code" name="code" placeholder="BIENVENUE10" required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="type">Type</Label>
          <Select id="type" name="type" defaultValue="PERCENT">
            <option value="PERCENT">Pourcentage</option>
            <option value="FIXED">Montant fixe</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="value">Valeur</Label>
          <Input id="value" name="value" type="number" step="0.01" min="0.01" required />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="startsAt">Début (optionnel)</Label>
          <Input id="startsAt" name="startsAt" type="datetime-local" />
        </div>
        <div>
          <Label htmlFor="endsAt">Fin (optionnel)</Label>
          <Input id="endsAt" name="endsAt" type="datetime-local" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="usageLimit">Limite d&apos;utilisations</Label>
          <Input id="usageLimit" name="usageLimit" type="number" min="1" />
        </div>
        <div>
          <Label htmlFor="minOrderAmount">Panier minimum (€)</Label>
          <Input id="minOrderAmount" name="minOrderAmount" type="number" step="0.01" min="0" />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="active" defaultChecked />
        Actif immédiatement
      </label>
      <FieldError>{state.error}</FieldError>
      <Button type="submit" disabled={pending}>
        {pending ? "Création..." : "Créer le code"}
      </Button>
    </form>
  );
}
