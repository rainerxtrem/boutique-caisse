"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui";

export function PrintButton() {
  useEffect(() => {
    const timer = setTimeout(() => window.print(), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Button onClick={() => window.print()} className="w-full">
      Imprimer le ticket
    </Button>
  );
}
