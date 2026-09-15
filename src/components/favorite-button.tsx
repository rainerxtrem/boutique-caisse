"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleFavorite } from "@/app/(site)/favoris/actions";

export function FavoriteButton({
  productId,
  initialFavorite,
  isLoggedIn,
  className,
}: {
  productId: string;
  initialFavorite: boolean;
  isLoggedIn: boolean;
  className?: string;
}) {
  const [isFavorite, setIsFavorite] = useState(initialFavorite);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      type="button"
      aria-label={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
      disabled={pending}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isLoggedIn) {
          router.push("/connexion");
          return;
        }
        setIsFavorite((prev) => !prev);
        startTransition(async () => {
          const result = await toggleFavorite(productId);
          if (result.favorite !== undefined) setIsFavorite(result.favorite);
        });
      }}
      className={`flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-lg shadow-sm transition hover:bg-white ${className ?? ""}`}
    >
      <span className={isFavorite ? "text-danger" : "text-muted"}>
        {isFavorite ? "♥" : "♡"}
      </span>
    </button>
  );
}
