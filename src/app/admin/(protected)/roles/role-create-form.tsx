"use client";

import { useActionState } from "react";
import { Button, FieldError, Input, Label } from "@/components/ui";
import { createRole, type RoleFormState } from "./actions";
import { PermissionCheckboxes } from "./permission-checkboxes";

const initialState: RoleFormState = {};

export function RoleCreateForm() {
  const [state, formAction, pending] = useActionState(createRole, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <Label htmlFor="name">Nom du rôle</Label>
        <Input id="name" name="name" placeholder="Manageur" required />
      </div>
      <PermissionCheckboxes />
      <FieldError>{state.error}</FieldError>
      <Button type="submit" disabled={pending}>
        {pending ? "Création..." : "Créer le rôle"}
      </Button>
    </form>
  );
}
