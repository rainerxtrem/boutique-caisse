import Link from "next/link";
import { createCustomer } from "../actions";
import { CustomerForm } from "../client-form";

export default function NouveauClientPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/clients" className="text-sm text-muted hover:text-foreground">
          ← Retour aux clients
        </Link>
        <h1 className="mt-1 text-2xl font-semibold">Nouveau compte fidélité</h1>
        <p className="text-sm text-muted">
          À créer uniquement pour un client présent en boutique.
        </p>
      </div>
      <CustomerForm action={createCustomer} submitLabel="Créer le compte" />
    </div>
  );
}
