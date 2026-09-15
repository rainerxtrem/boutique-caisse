"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input } from "@/components/ui";
import { fulfillRedemption } from "./actions";

export function FulfillLookup() {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit() {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      try {
        const result = await fulfillRedemption(code);
        setSuccess(`${result.rewardName} remise à ${result.customerName}.`);
        setCode("");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur.");
      }
    });
  }

  return (
    <Card className="p-6">
      <h2 className="mb-3 font-semibold">Remettre une récompense</h2>
      <p className="mb-3 text-sm text-muted">
        Le client présente son code d&apos;échange (visible dans son espace
        fidélité) : saisissez-le ici pour valider la remise.
      </p>
      <div className="flex gap-2">
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Code d'échange"
          className="font-mono uppercase"
        />
        <Button onClick={handleSubmit} disabled={pending || !code}>
          {pending ? "..." : "Valider"}
        </Button>
      </div>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
      {success && <p className="mt-2 text-sm text-brand-dark">{success}</p>}
    </Card>
  );
}
