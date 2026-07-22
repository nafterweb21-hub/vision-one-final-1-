import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authz";
import { invalidatePermissionsCache } from "@/lib/permissions";
import { resolveModuleIds, type PermissionPayload } from "@/lib/role-permissions";

export async function GET() {
  const { error } = await requirePermission("ROLES", "v");
  if (error) return error;

  const roles = await prisma.roleProfile.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      rolePermissions: {
        include: { module: true },
      },
    },
  });

  return NextResponse.json(roles);
}

export async function POST(req: NextRequest) {
  try {
    const { error } = await requirePermission("ROLES", "c");
    if (error) return error;

    const body = await req.json();
    const name = String(body.name ?? "").trim().toUpperCase();
    const remark = body.remark ? String(body.remark) : null;
    const status = body.status === "Inactive" ? "Inactive" : "Active";
    const permissions = (body.permissions ?? {}) as PermissionPayload;

    if (!name) {
      return NextResponse.json({ error: "Role name is required." }, { status: 400 });
    }

    const existing = await prisma.roleProfile.findUnique({ where: { name } });
    if (existing) {
      return NextResponse.json({ error: "Role already exists." }, { status: 400 });
    }

    const rows = await resolveModuleIds(permissions);

    const role = await prisma.roleProfile.create({
      data: {
        name,
        remark,
        status,
        permissions: [],
        rolePermissions: { create: rows },
      },
      include: { rolePermissions: { include: { module: true } } },
    });

    invalidatePermissionsCache(name);

    return NextResponse.json(role);
  } catch (err) {
    console.error("POST /api/admin/roles error:", err);
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
