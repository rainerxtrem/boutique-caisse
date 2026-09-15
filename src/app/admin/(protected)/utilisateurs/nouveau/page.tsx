import Link from "next/link";
import { prisma } from "@/lib/db";
import { createStaffUser } from "../actions";
import { UserForm } from "../user-form";

export default async function NouvelUtilisateurPage() {
  const roles = await prisma.role.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/admin/utilisateurs"
          className="text-sm text-muted hover:text-foreground"
        >
          ← Retour aux utilisateurs
        </Link>
        <h1 className="mt-1 text-2xl font-semibold">Nouvel utilisateur</h1>
      </div>

      <UserForm
        action={createStaffUser}
        roles={roles}
        submitLabel="Créer l'utilisateur"
        passwordRequired
      />
    </div>
  );
}
