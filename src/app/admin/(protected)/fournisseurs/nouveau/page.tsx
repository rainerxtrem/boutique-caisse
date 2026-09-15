import Link from "next/link";
import { createSupplier } from "../actions";
import { SupplierForm } from "../supplier-form";

export default function NouveauFournisseurPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/fournisseurs" className="text-sm text-muted hover:text-foreground">
          ← Retour aux fournisseurs
        </Link>
        <h1 className="mt-1 text-2xl font-semibold">Nouveau fournisseur</h1>
      </div>
      <SupplierForm action={createSupplier} submitLabel="Créer le fournisseur" />
    </div>
  );
}
