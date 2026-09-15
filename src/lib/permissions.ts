import "server-only";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth-staff";

export { PERMISSIONS, type PermissionCategory, type PermissionDef } from "@/lib/permission-catalog";

export type SessionWithPermissions = {
  userId: string;
  name: string;
  roleName: string;
  permissions: Set<string>;
};

export async function getSessionWithPermissions(): Promise<SessionWithPermissions> {
  const session = await requireStaff();
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { role: { include: { permissions: true } } },
  });
  if (!user) redirect("/admin/connexion");

  return {
    userId: user.id,
    name: user.name,
    roleName: user.role.name,
    permissions: new Set(user.role.permissions.map((p) => p.permissionKey)),
  };
}

export function hasPermission(session: SessionWithPermissions, key: string) {
  return session.permissions.has(key);
}

export function hasAnyPermission(session: SessionWithPermissions, keys: string[]) {
  return keys.some((key) => session.permissions.has(key));
}

/** Guard for server actions/pages: redirects home if the current staff member's role lacks `key`. */
export async function requirePermission(key: string): Promise<SessionWithPermissions> {
  const session = await getSessionWithPermissions();
  if (!session.permissions.has(key)) {
    redirect("/admin");
  }
  return session;
}

/** Same as requirePermission, but passes if the role has at least one of `keys`. */
export async function requireAnyPermission(keys: string[]): Promise<SessionWithPermissions> {
  const session = await getSessionWithPermissions();
  if (!keys.some((key) => session.permissions.has(key))) {
    redirect("/admin");
  }
  return session;
}
