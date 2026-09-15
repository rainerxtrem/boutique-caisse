"use client";

import { useActionState } from "react";
import { Button, Card, FieldError, Input, Label } from "@/components/ui";
import type { CustomerFormState } from "./actions";

const initialState: CustomerFormState = {};

export function CustomerForm({
  action,
  defaultValues,
  submitLabel,
}: {
  action: (
    prevState: CustomerFormState,
    formData: FormData
  ) => Promise<CustomerFormState>;
  defaultValues?: {
    firstName: string;
    lastName: string;
    birthDate: string;
    phone: string;
  };
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <Card className="max-w-lg p-6">
      <form action={formAction} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName">Prénom</Label>
            <Input
              id="firstName"
              name="firstName"
              defaultValue={defaultValues?.firstName}
              required
            />
          </div>
          <div>
            <Label htmlFor="lastName">Nom</Label>
            <Input
              id="lastName"
              name="lastName"
              defaultValue={defaultValues?.lastName}
              required
            />
          </div>
        </div>
        <div>
          <Label htmlFor="birthDate">Date de naissance</Label>
          <Input
            id="birthDate"
            name="birthDate"
            type="date"
            defaultValue={defaultValues?.birthDate}
            required
          />
        </div>
        <div>
          <Label htmlFor="phone">Numéro de téléphone</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={defaultValues?.phone}
            placeholder="06 12 34 56 78"
            required
          />
        </div>
        <FieldError>{state.error}</FieldError>
        <Button type="submit" disabled={pending}>
          {pending ? "Enregistrement..." : submitLabel}
        </Button>
      </form>
    </Card>
  );
}
