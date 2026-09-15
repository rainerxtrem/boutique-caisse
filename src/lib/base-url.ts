import "server-only";
import { headers } from "next/headers";

/** Derives the current request's origin (works locally and in production) for building absolute links, e.g. QR codes. */
export async function getBaseUrl() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
