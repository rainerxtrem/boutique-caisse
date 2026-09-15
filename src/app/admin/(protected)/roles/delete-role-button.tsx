"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { deleteRole } from "./actions";

export function DeleteRoleButton({ roleId, roleName }: { roleId: string; roleName: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleClick() {
    if (!window.confirm(`Supprimer le rôle "${roleName}" ?`)) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteRole(roleId);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push("/admin/roles?toast=deleted");
    });
  }

  return (
    <div>
      <Button variant="danger" onClick={handleClick} disabled={pending}>
        {pending ? "..." : "Supprimer ce rôle"}
      </Button>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  );
}
