import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Host-based surface routing (Next.js 16 proxy, formerly middleware).
 *
 * One deployment serves three surfaces; the URL path the user sees never
 * includes the internal folder prefix:
 *
 *   fruitionhr.com/*        → (marketing) routes, served as-is
 *   app.fruitionhr.com/*    → rewritten to /app/*      (tenant dashboard)
 *   admin.fruitionhr.com/*  → rewritten to /admin/*    (super admin)
 *
 * Local dev (browsers resolve *.localhost automatically, no hosts file):
 *   localhost:3000          → marketing website
 *   app.localhost:3000      → tenant app
 *   admin.localhost:3000    → super admin
 */
export function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const hostname = host.split(":")[0];
  const { pathname } = request.nextUrl;

  const surface = hostname.startsWith("admin.")
    ? "admin"
    : hostname.startsWith("app.")
      ? "app"
      : null;

  if (surface && !pathname.startsWith(`/${surface}`)) {
    const url = request.nextUrl.clone();
    url.pathname = `/${surface}${pathname}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
