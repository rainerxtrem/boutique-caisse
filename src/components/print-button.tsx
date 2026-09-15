"use client";

import { Button } from "@/components/ui";

export function PrintButton({ label = "Imprimer" }: { label?: string }) {
  return (
    <Button onClick={() => window.print()} className="w-full">
      {label}
    </Button>
  );
}
