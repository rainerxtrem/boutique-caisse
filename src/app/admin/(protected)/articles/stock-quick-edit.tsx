"use client";

import { useState, useTransition } from "react";
import { updateProductStock } from "./actions";

export function StockQuickEdit({
  productId,
  initialStock,
}: {
  productId: string;
  initialStock: number;
}) {
  const [stock, setStock] = useState(initialStock);
  const [pending, startTransition] = useTransition();

  function commit(value: number) {
    if (Number.isNaN(value) || value < 0) return;
    startTransition(() => {
      const fd = new FormData();
      fd.set("stock", String(value));
      updateProductStock(productId, fd);
    });
  }

  return (
    <input
      type="number"
      min={0}
      value={stock}
      onChange={(e) => setStock(Number(e.target.value))}
      onBlur={(e) => commit(Number(e.target.value))}
      disabled={pending}
      className="w-16 rounded-lg border border-border px-2 py-1 text-right text-sm focus:border-brand focus:ring-2 focus:ring-brand/20"
    />
  );
}
