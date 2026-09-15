"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input, Label, Textarea } from "@/components/ui";
import { useToast } from "@/components/toast-provider";
import { useConfirm } from "@/components/confirm-provider";
import { formatPrice } from "@/lib/format";
import { processRefund } from "../actions";

export function RefundForm({
  orderId,
  items,
}: {
  orderId: string;
  items: { id: string; productName: string; remaining: number; unitAmount: number }[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const confirm = useConfirm();
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const total = items.reduce(
    (sum, item) => sum + (quantities[item.id] ?? 0) * item.unitAmount,
    0
  );

  async function handleSubmit() {
    setError(null);
    const lines = items
      .map((item) => ({ orderItemId: item.id, qty: quantities[item.id] ?? 0 }))
      .filter((l) => l.qty > 0);

    if (lines.length === 0) {
      setError("Sélectionnez au moins un article.");
      return;
    }

    if (!(await confirm(`Rembourser ${formatPrice(total)} ? Cette action est irréversible.`))) {
      return;
    }

    startTransition(async () => {
      try {
        await processRefund(orderId, lines, reason);
        showToast("Remboursement enregistré.");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur lors du remboursement.");
      }
    });
  }

  return (
    <Card className="p-6">
      <h2 className="mb-3 font-semibold">Retour / remboursement</h2>
      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex-1">{item.productName}</span>
            <span className="text-xs text-muted">max {item.remaining}</span>
            <Input
              type="number"
              min={0}
              max={item.remaining}
              value={quantities[item.id] ?? 0}
              onChange={(e) =>
                setQuantities((prev) => ({
                  ...prev,
                  [item.id]: Math.min(item.remaining, Math.max(0, Number(e.target.value))),
                }))
              }
              className="w-20"
            />
          </div>
        ))}
      </div>
      <div className="mt-4">
        <Label htmlFor="reason">Motif (optionnel)</Label>
        <Textarea id="reason" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
      </div>
      <div className="mt-3 flex items-center justify-between font-semibold">
        <span>Montant à rembourser</span>
        <span>{formatPrice(total)}</span>
      </div>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
      <Button variant="danger" className="mt-3 w-full" onClick={handleSubmit} disabled={pending}>
        {pending ? "Traitement..." : "Valider le remboursement"}
      </Button>
    </Card>
  );
}
