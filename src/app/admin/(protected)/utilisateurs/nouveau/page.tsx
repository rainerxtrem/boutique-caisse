"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button, Card, FieldError, Input, Label, Select } from "@/components/ui";
import { createStaffUser, type UserFormState } from "../actions";

const initialState: UserFormState = {};

export default function NouvelUtilisateurPage() {
  const [state, formAction, pending] = useActionState(
    createStaffUser,
    initialState
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/admin/utilisateurs"
          className="text-sm text-muted hover:text-foreground"
        >
          ← Retour aux utilisateurs
        </Link>
        <h1 className="mt-1 text-2xl font-semibold">Nouvel utilisateur</h1>
      </div>

      <Card className="max-w-md p-6">
        <form action={formAction} className="flex flex-col gap-4">
          <div>
            <Label htmlFor="name">Nom complet</Label>
            <Input id="name" name="name" required />
          </div>
          <div>
            <Label htmlFor="username">Identifiant</Label>
            <Input id="username" name="username" required />
          </div>
          <div>
            <Label htmlFor="password">Mot de passe</Label>
            <Input id="password" name="password" type="password" required />
          </div>
          <div>
            <Label htmlFor="role">Rôle</Label>
            <Select id="role" name="role" defaultValue="VENDEUR">
              <option value="VENDEUR">Vendeur</option>
              <option value="ADMIN">Administrateur</option>
            </Select>
          </div>
          <FieldError>{state.error}</FieldError>
          <Button type="submit" disabled={pending}>
            {pending ? "Création..." : "Créer l'utilisateur"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
