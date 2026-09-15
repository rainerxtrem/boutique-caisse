import { Suspense } from "react";
import { getSessionWithPermissions } from "@/lib/permissions";
import { AdminSidebar } from "@/components/admin-sidebar";
import { Button } from "@/components/ui";
import { ToastFromQuery } from "@/components/toast-from-query";
import { logoutStaff } from "./logout-actions";

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSessionWithPermissions();

  return (
    <div className="flex min-h-screen bg-background">
      <div className="no-print contents">
        <AdminSidebar staffName={session.name} permissions={session.permissions} />
      </div>
      <div className="flex flex-1 flex-col">
        <header className="no-print flex items-center justify-between border-b border-border bg-surface px-6 py-3">
          <p className="text-sm text-muted">
            Connecté en tant que{" "}
            <span className="font-medium text-foreground">
              {session.name}
            </span>{" "}
            · {session.roleName}
          </p>
          <form action={logoutStaff}>
            <Button variant="secondary" type="submit" className="!py-1.5 text-xs">
              Déconnexion
            </Button>
          </form>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Suspense fallback={null}>
            <ToastFromQuery />
          </Suspense>
          {children}
        </main>
      </div>
    </div>
  );
}
