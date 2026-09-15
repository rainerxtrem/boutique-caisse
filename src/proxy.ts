import { NextRequest, NextResponse } from "next/server";
import { verifySession, type StaffSessionPayload } from "@/lib/session";

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

    if (
      (pathname.startsWith("/admin/utilisateurs") ||
        pathname.startsWith("/admin/fidelite") ||
        pathname.startsWith("/admin/audit")) &&
      payload.role !== "ADMIN"
    ) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
