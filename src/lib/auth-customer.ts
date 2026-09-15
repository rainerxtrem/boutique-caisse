import "server-only";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import {
  signSession,
  verifySession,
  type CustomerSessionPayload,
} from "@/lib/session";

const COOKIE_NAME = "client_session";

export async function createCustomerSession(customerId: string) {
  const token = await signSession(
    { kind: "customer", customerId },
    "30d"
  );
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function destroyCustomerSession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getCustomerSession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = await verifySession<CustomerSessionPayload>(token);
  if (!payload || payload.kind !== "customer") return null;
  return payload;
}

export async function getCurrentCustomer() {
  const session = await getCustomerSession();
  if (!session) return null;
  return prisma.customer.findUnique({ where: { id: session.customerId } });
}
