"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button, Card, FieldError, Input, Label } from "@/components/ui";
import { loginWithPhone, type LoginState } from "./actions";

const initialState: LoginState = {};

export default function ConnexionPage() {
  const [state, formAction, pending] = useActionState(
    loginWithPhone,
    initialState
  );

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Espace fidélité</h1>
        <p className="mt-1 text-sm text-muted">
          Connectez-vous avec le numéro de téléphone de votre compte
          fidélité pour accéder à vos points et passer commande.
        </p>
      </div>
      <Card className="p-6">
        <form action={formAction} className="flex flex-col gap-4">
          <div>
            <Label htmlFor="phone">Numéro de téléphone</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="06 12 34 56 78"
              required
            />
            <FieldError>{state.error}</FieldError>
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Connexion..." : "Se connecter"}
          </Button>
        </form>
      </Card>
      <p className="text-center text-sm text-muted">
        Pas encore de compte fidélité ?{" "}
        <span className="text-foreground">
          Créez-le directement en boutique.
        </span>
      </p>
      <Link
        href="/"
        className="text-center text-sm text-muted hover:text-foreground"
      >
        ← Retour au catalogue
      </Link>
    </div>
  );
}
