import { NextRequest, NextResponse } from "next/server";
import { verifySession, type StaffSessionPayload } from "@/lib/session";

// Only checks that a staff session exists. Fine-grained authorization by
// permission happens server-side in each page/action via requirePermission()
// (src/lib/permissions.ts), since that needs a Postgres round-trip the pg
// adapter can't make from the edge runtime this proxy runs in.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin") && pathname !== "/admin/connexion") {
    const token = request.cookies.get("staff_session")?.value;
    const payload = token
      ? await verifySession<StaffSessionPayload>(token)
      : null;

    if (!payload || payload.kind !== "staff") {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/connexion";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
