import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";
import {
  canAccess,
  canAccessApi,
  landingPathFor,
  type PermissionsMap,
} from "@/lib/access";

const { auth } = NextAuth(authConfig);

/**
 * First line of defence only. Next.js documents Proxy as unsuitable as the sole
 * authorization layer, so route handlers re-check with `requirePermission`.
 */
export default auth((req) => {
  const { pathname, search } = req.nextUrl;
  const isApi = pathname.startsWith("/api");

  if (!req.auth) {
    if (isApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const signInUrl = new URL("/auth/signin", req.nextUrl);
    signInUrl.searchParams.set("callbackUrl", pathname + search);
    return NextResponse.redirect(signInUrl);
  }

  const user = req.auth.user as
    | { role?: string | null; permissions?: PermissionsMap | null }
    | undefined;
  const permissions = user?.permissions ?? null;
  const role = user?.role ?? null;

  if (isApi) {
    if (!canAccessApi(pathname, req.method, permissions, role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.next();
  }

  // Sign-in defaults to /dashboard, which is open to every authenticated user.
  // Shop-floor-only roles would find it empty, so send them to their terminal.
  if (pathname === "/dashboard") {
    const landing = landingPathFor(permissions, role);
    if (landing !== "/dashboard") {
      return NextResponse.redirect(new URL(landing, req.nextUrl));
    }
  }

  if (!canAccess(pathname, permissions, role)) {
    const forbiddenUrl = new URL("/forbidden", req.nextUrl);
    forbiddenUrl.searchParams.set("from", pathname);
    return NextResponse.rewrite(forbiddenUrl);
  }

  return NextResponse.next();
});

export const config = {
  // `/api/auth/*` must stay open so sign-in itself can work.
  matcher: [
    "/dashboard/:path*",
    "/print/:path*",
    "/terminal/:path*",
    "/qc/:path*",
    "/uploads/:path*",
    "/api/((?!auth/).*)",
  ],
};
