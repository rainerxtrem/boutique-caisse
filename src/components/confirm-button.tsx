"use client";

import { Button } from "@/components/ui";
import type { ComponentProps } from "react";

/**
 * A submit button (or formAction override button) that asks for confirmation
 * before letting the form submission through. Drop-in replacement for
 * `<Button type="submit">` on destructive actions.
 */
export function ConfirmSubmitButton({
  confirmMessage,
  onClick,
  ...props
}: ComponentProps<typeof Button> & { confirmMessage: string }) {
  return (
    <Button
      {...props}
      onClick={(e) => {
        if (!window.confirm(confirmMessage)) {
          e.preventDefault();
          return;
        }
        onClick?.(e);
      }}
    />
  );
}
