import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  signSession,
  verifySession,
  type StaffSessionPayload,
} from "@/lib/session";

const COOKIE_NAME = "staff_session";

export async function createStaffSession(user: {
  id: string;
  role: "ADMIN" | "VENDEUR";
  name: string;
}) {
  const token = await signSession(
    { kind: "staff", userId: user.id, role: user.role, name: user.name },
    "12h"
  );
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function destroyStaffSession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getStaffSession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = await verifySession<StaffSessionPayload>(token);
  if (!payload || payload.kind !== "staff") return null;
  return payload;
}

export async function requireStaff() {
  const session = await getStaffSession();
  if (!session) redirect("/admin/connexion");
  return session;
}

export async function requireAdmin() {
  const session = await requireStaff();
  if (session.role !== "ADMIN") redirect("/admin");
  return session;
}

export async function getCurrentStaffUser() {
  const session = await getStaffSession();
  if (!session) return null;
  return prisma.user.findUnique({ where: { id: session.userId } });
}
