"use client";

import { useActionState } from "react";
import { Button, Card, FieldError, Input, Label, Select } from "@/components/ui";
import type { UserFormState } from "./actions";

const initialState: UserFormState = {};

export function UserForm({
  action,
  roles,
  defaultValues,
  submitLabel,
  passwordRequired,
}: {
  action: (prevState: UserFormState, formData: FormData) => Promise<UserFormState>;
  roles: { id: string; name: string }[];
  defaultValues?: { name: string; username: string; roleId: string };
  submitLabel: string;
  passwordRequired: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <Card className="max-w-md p-6">
      <form action={formAction} className="flex flex-col gap-4">
        <div>
          <Label htmlFor="name">Nom complet</Label>
          <Input id="name" name="name" defaultValue={defaultValues?.name} required />
        </div>
        <div>
          <Label htmlFor="username">Identifiant</Label>
          <Input id="username" name="username" defaultValue={defaultValues?.username} required />
        </div>
        <div>
          <Label htmlFor="password">
            Mot de passe {!passwordRequired && "(laisser vide pour ne pas changer)"}
          </Label>
          <Input id="password" name="password" type="password" required={passwordRequired} />
        </div>
        <div>
          <Label htmlFor="roleId">Rôle</Label>
          <Select id="roleId" name="roleId" defaultValue={defaultValues?.roleId} required>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </Select>
        </div>
        <FieldError>{state.error}</FieldError>
        <Button type="submit" disabled={pending}>
          {pending ? "Enregistrement..." : submitLabel}
        </Button>
      </form>
    </Card>
  );
}
