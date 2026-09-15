"use client";

import { useActionState } from "react";
import { Button, Card, FieldError, Input, Label, Textarea } from "@/components/ui";
import type { SupplierFormState } from "./actions";

const initialState: SupplierFormState = {};

export function SupplierForm({
  action,
  defaultValues,
  submitLabel,
}: {
  action: (
    prevState: SupplierFormState,
    formData: FormData
  ) => Promise<SupplierFormState>;
  defaultValues?: {
    name: string;
    contactName: string;
    email: string;
    phone: string;
    address: string;
    notes: string;
  };
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <Card className="max-w-lg p-6">
      <form action={formAction} className="flex flex-col gap-4">
        <div>
          <Label htmlFor="name">Nom du fournisseur</Label>
          <Input id="name" name="name" defaultValue={defaultValues?.name} required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="contactName">Contact</Label>
            <Input id="contactName" name="contactName" defaultValue={defaultValues?.contactName} />
          </div>
          <div>
            <Label htmlFor="phone">Téléphone</Label>
            <Input id="phone" name="phone" defaultValue={defaultValues?.phone} />
          </div>
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" defaultValue={defaultValues?.email} />
        </div>
        <div>
          <Label htmlFor="address">Adresse</Label>
          <Input id="address" name="address" defaultValue={defaultValues?.address} />
        </div>
        <div>
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" name="notes" rows={3} defaultValue={defaultValues?.notes} />
        </div>
        <FieldError>{state.error}</FieldError>
        <Button type="submit" disabled={pending}>
          {pending ? "Enregistrement..." : submitLabel}
        </Button>
      </form>
    </Card>
  );
}
