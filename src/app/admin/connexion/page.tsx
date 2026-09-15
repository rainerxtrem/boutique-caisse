"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button, Card, FieldError, Input, Label } from "@/components/ui";
import { loginStaff, type StaffLoginState } from "./actions";

const initialState: StaffLoginState = {};

export default function AdminConnexionPage() {
  const [state, formAction, pending] = useActionState(
    loginStaff,
    initialState
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0f1115] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <span className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-brand text-lg font-bold text-white">
            B
          </span>
          <h1 className="text-xl font-semibold text-white">Back-office</h1>
          <p className="mt-1 text-sm text-white/50">
            Connexion réservée au personnel
          </p>
        </div>
        <Card className="p-6">
          <form action={formAction} className="flex flex-col gap-4">
            <div>
              <Label htmlFor="username">Identifiant</Label>
              <Input id="username" name="username" autoFocus required />
            </div>
            <div>
              <Label htmlFor="password">Mot de passe</Label>
              <Input id="password" name="password" type="password" required />
              <FieldError>{state.error}</FieldError>
            </div>
            <Button type="submit" disabled={pending}>
              {pending ? "Connexion..." : "Se connecter"}
            </Button>
          </form>
        </Card>
        <Link
          href="/"
          className="mt-4 block text-center text-sm text-white/50 hover:text-white"
        >
          ← Retour au site
        </Link>
      </div>
    </div>
  );
}
