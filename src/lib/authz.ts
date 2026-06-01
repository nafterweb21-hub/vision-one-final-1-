import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { Role } from "@/lib/access";

export async function requireRole(...roles: Role[]) {
  const session = await auth();
  if (!session?.user) {
    return {
      session: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  if (!roles.includes(session.user.role)) {
    return {
      session,
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return { session, error: null };
}
