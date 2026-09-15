"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { redeemReward } from "./actions";

export function RewardRedeemButton({
  rewardId,
  rewardName,
  canAfford,
}: {
  rewardId: string;
  rewardName: string;
  canAfford: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleRedeem() {
    if (!window.confirm(`Échanger vos points contre "${rewardName}" ?`)) return;
    setError(null);
    startTransition(async () => {
      const result = await redeemReward(rewardId);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.code) {
        setCode(result.code);
        router.refresh();
      }
    });
  }

  if (code) {
    return (
      <div className="rounded-lg bg-brand-light p-3 text-center">
        <p className="text-xs text-brand-dark">Présentez ce code en boutique :</p>
        <p className="font-mono text-lg font-semibold text-brand-dark">{code}</p>
      </div>
    );
  }

  return (
    <div>
      <Button
        variant="secondary"
        className="w-full"
        onClick={handleRedeem}
        disabled={pending || !canAfford}
      >
        {pending ? "..." : canAfford ? "Échanger" : "Points insuffisants"}
      </Button>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}
