import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/authz";

export async function GET() {
  const { error } = await requireRole("ADMIN");
  if (error) return error;

  const roles = await prisma.roleProfile.findMany({
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(roles);
}

export async function POST(req: NextRequest) {
  try {
    const { error } = await requireRole("ADMIN");
    if (error) return error;

    const body = await req.json();
    const name = String(body.name ?? "").trim().toUpperCase();
    const remark = body.remark ? String(body.remark) : null;
    const status = body.status === "Inactive" ? "Inactive" : "Active";

    if (!name) {
      return NextResponse.json({ error: "Role name is required." }, { status: 400 });
    }

    const existing = await prisma.roleProfile.findUnique({ where: { name } });
    if (existing) {
      return NextResponse.json({ error: "Role already exists." }, { status: 400 });
    }

    const role = await prisma.roleProfile.create({
      data: {
        name,
        remark,
        status,
        permissions: [],
      },
    });

    return NextResponse.json(role);
  } catch (err: any) {
    console.error("POST /api/admin/roles error:", err);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}
