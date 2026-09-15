"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useToast } from "@/components/toast-provider";

const MESSAGES: Record<string, string> = {
  created: "Créé avec succès.",
  updated: "Enregistré avec succès.",
  deleted: "Supprimé avec succès.",
  "customer-created": "Compte fidélité créé.",
  "customer-updated": "Client mis à jour.",
  "customer-deleted": "Compte fidélité supprimé.",
  "product-created": "Article créé.",
  "product-updated": "Article enregistré.",
  "product-duplicated": "Article dupliqué.",
  "product-deactivated": "Article désactivé.",
  "supplier-created": "Fournisseur créé.",
  "supplier-updated": "Fournisseur enregistré.",
  "supplier-deleted": "Fournisseur supprimé.",
  "promo-created": "Code promo créé.",
  "promo-deleted": "Code promo supprimé.",
  "user-created": "Utilisateur créé.",
  "user-updated": "Utilisateur enregistré.",
  "user-deleted": "Utilisateur supprimé.",
  "tier-deleted": "Palier supprimé.",
  "order-cancelled": "Commande annulée.",
  "order-updated": "Statut mis à jour.",
  "refund-done": "Remboursement enregistré.",
  "banner-created": "Bannière créée.",
  "banner-updated": "Bannière enregistrée.",
  "banner-deleted": "Bannière supprimée.",
  "reward-created": "Récompense créée.",
  "reward-updated": "Récompense enregistrée.",
  "reward-deleted": "Récompense supprimée.",
  "reward-fulfilled": "Récompense marquée comme remise.",
};

/** Reads a `?toast=<key>` query param on mount, shows the matching toast, then strips it from the URL. */
export function ToastFromQuery() {
  const { showToast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const key = searchParams.get("toast");
    if (!key) return;
    showToast(MESSAGES[key] ?? "Fait.");
    const next = new URLSearchParams(searchParams);
    next.delete("toast");
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return null;
}
