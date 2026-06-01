import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/authz";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireRole("ADMIN");
  if (error) return error;

  const { id } = await params;
  const role = await prisma.roleProfile.findUnique({ where: { id } });

  if (!role) {
    return NextResponse.json({ error: "Role not found." }, { status: 404 });
  }

  return NextResponse.json(role);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireRole("ADMIN");
  if (error) return error;

  const { id } = await params;
  const body = await req.json();

  const data: Record<string, unknown> = {};

  if (typeof body.name === "string") {
    const name = body.name.trim().toUpperCase();
    if (!name) return NextResponse.json({ error: "Name is required." }, { status: 400 });
    
    // Check name collision
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
    data.status = body.status;
  }

  try {
    const role = await prisma.roleProfile.update({
      where: { id },
      data,
    });
    return NextResponse.json(role);
  } catch (err: any) {
    console.error("PUT /api/admin/roles/[id] error:", err);
    return NextResponse.json({ error: err.message || "Failed to update role." }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireRole("ADMIN");
  if (error) return error;

  const { id } = await params;

  try {
    const role = await prisma.roleProfile.findUnique({ where: { id } });
    if (!role) {
      return NextResponse.json({ error: "Role not found." }, { status: 404 });
    }

    const builtInRoles = ["ADMIN", "SALES", "PRODUCTION", "PURCHASING", "QC", "PLANNER", "VIEWER"];
    if (builtInRoles.includes(role.name)) {
      return NextResponse.json({ error: "Cannot delete built-in role." }, { status: 400 });
    }

    await prisma.roleProfile.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Failed to delete role." }, { status: 500 });
  }
}
