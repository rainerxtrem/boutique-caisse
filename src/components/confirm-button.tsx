"use client";

import { Button } from "@/components/ui";
import { useConfirm } from "@/components/confirm-provider";
import type { ComponentProps } from "react";

/**
 * A submit button (or formAction override button) that asks for confirmation
 * via a real dialog before letting the form submission through. Drop-in
 * replacement for `<Button type="submit">` on destructive actions.
 */
export function ConfirmSubmitButton({
  confirmMessage,
  ...props
}: ComponentProps<typeof Button> & { confirmMessage: string }) {
  const confirm = useConfirm();

  return (
    <Button
      {...props}
      onClick={async (e) => {
        e.preventDefault();
        const button = e.currentTarget;
        const ok = await confirm(confirmMessage);
        if (!ok) return;
        button.form?.requestSubmit(button);
      }}
    />
  );
}
