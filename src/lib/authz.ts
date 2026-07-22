import type { Session } from "next-auth";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { hasAction, isSuperRole, type Role } from "@/lib/access";
import type { PermissionAction } from "@/lib/modules.config";

type Result =
  | { session: Session; error: null }
  | { session: Session | null; error: NextResponse };

const unauthorized = () =>
  NextResponse.json({ error: "Unauthorized" }, { status: 401 });
const forbidden = () => NextResponse.json({ error: "Forbidden" }, { status: 403 });

export async function requireAuth(): Promise<Result> {
  const session = await auth();
  if (!session?.user) return { session: null, error: unauthorized() };
  return { session, error: null };
}

/**
 * Authoritative check for a route handler. Proxy already screened the request,
 * but the Next.js docs warn against relying on Proxy alone, so handlers that
 * mutate data should call this directly.
 */
export async function requirePermission(
  moduleCode: string,
  action: PermissionAction,
): Promise<Result> {
  const session = await auth();
  if (!session?.user) return { session: null, error: unauthorized() };

  const { role, permissions } = session.user;
  if (!hasAction(permissions, moduleCode, action, role)) {
    return { session, error: forbidden() };
  }
  return { session, error: null };
}

/**
 * Legacy role-name check. Prefer `requirePermission` — this exists for the few
 * places where a capability is tied to the super role itself.
 */
export async function requireRole(...roles: Role[]): Promise<Result> {
  const session = await auth();
  if (!session?.user) return { session: null, error: unauthorized() };

  if (!roles.includes(session.user.role) && !isSuperRole(session.user.role)) {
    return { session, error: forbidden() };
  }
  return { session, error: null };
}
