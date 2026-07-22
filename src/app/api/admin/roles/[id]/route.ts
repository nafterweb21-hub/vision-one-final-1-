import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authz";
import { invalidatePermissionsCache } from "@/lib/permissions";
import { SUPER_ROLE } from "@/lib/access";
import { resolveModuleIds, type PermissionPayload } from "@/lib/role-permissions";

const BUILT_IN_ROLES = ["ADMIN", "SALES", "PRODUCTION", "PURCHASING", "QC", "PLANNER", "VIEWER"];

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requirePermission("ROLES", "v");
  if (error) return error;

  const { id } = await params;
  const role = await prisma.roleProfile.findUnique({
    where: { id },
    include: { rolePermissions: { include: { module: true } } },
  });

  if (!role) {
    return NextResponse.json({ error: "Role not found." }, { status: 404 });
  }

  return NextResponse.json(role);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requirePermission("ROLES", "e");
  if (error) return error;

  const { id } = await params;
  const body = await req.json();

  const current = await prisma.roleProfile.findUnique({ where: { id } });
  if (!current) {
    return NextResponse.json({ error: "Role not found." }, { status: 404 });
  }

  const data: Record<string, unknown> = {};

  if (typeof body.name === "string") {
    const name = body.name.trim().toUpperCase();
    if (!name) return NextResponse.json({ error: "Name is required." }, { status: 400 });

    if (name !== current.name && current.name === SUPER_ROLE) {
      return NextResponse.json({ error: `Cannot rename the ${SUPER_ROLE} role.` }, { status: 400 });
    }

    const existing = await prisma.roleProfile.findUnique({ where: { name } });
    if (existing && existing.id !== id) {
      return NextResponse.json({ error: "Role name already exists." }, { status: 400 });
    }
    data.name = name;
  }
  if (typeof body.remark === "string" || body.remark === null) {
    data.remark = body.remark;
  }
  if (body.status === "Active" || body.status === "Inactive") {
    if (body.status === "Inactive" && current.name === SUPER_ROLE) {
      return NextResponse.json(
        { error: `Cannot deactivate the ${SUPER_ROLE} role.` },
        { status: 400 },
      );
    }
    data.status = body.status;
  }

  try {
    const rows = body.permissions
      ? await resolveModuleIds(body.permissions as PermissionPayload)
      : null;

    const updatedRole = await prisma.$transaction(async (tx) => {
      await tx.roleProfile.update({ where: { id }, data });

      if (rows) {
        await tx.rolePermission.deleteMany({ where: { roleId: id } });
        if (rows.length > 0) {
          await tx.rolePermission.createMany({
            data: rows.map((r) => ({ ...r, roleId: id })),
          });
        }
      }

      return tx.roleProfile.findUnique({
        where: { id },
        include: { rolePermissions: { include: { module: true } } },
      });
    });

    // A rename moves the cache key, so clear both the old and the new name.
    invalidatePermissionsCache(current.name);
    if (updatedRole) invalidatePermissionsCache(updatedRole.name);

    return NextResponse.json(updatedRole);
  } catch (err) {
    console.error("PUT /api/admin/roles/[id] error:", err);
    const message = err instanceof Error ? err.message : "Failed to update role.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requirePermission("ROLES", "d");
  if (error) return error;

  const { id } = await params;

  try {
    const role = await prisma.roleProfile.findUnique({ where: { id } });
    if (!role) {
      return NextResponse.json({ error: "Role not found." }, { status: 404 });
    }

    if (BUILT_IN_ROLES.includes(role.name)) {
      return NextResponse.json({ error: "Cannot delete built-in role." }, { status: 400 });
    }

    const assigned = await prisma.user.count({ where: { role: role.name } });
    if (assigned > 0) {
      return NextResponse.json(
        { error: `Cannot delete: ${assigned} user(s) still assigned to this role.` },
        { status: 400 },
      );
    }

    await prisma.roleProfile.delete({ where: { id } });
    invalidatePermissionsCache(role.name);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/admin/roles/[id] error:", err);
    return NextResponse.json({ error: "Failed to delete role." }, { status: 500 });
  }
}
