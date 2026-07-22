import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authz";


export async function GET() {
  const { error } = await requirePermission("USERS", "v");
  if (error) return error;

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      employeeId: true,
      createdAt: true,
      updatedAt: true,
      employee: { select: { id: true, code: true, name: true } },
    },
  });
  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const { error } = await requirePermission("USERS", "c");
  if (error) return error;

  const body = await req.json();
  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const role = body.role as string;
  const isActive = body.isActive !== false;
  const employeeId = body.employeeId ? String(body.employeeId) : null;

  if (!email || !password || password.length < 8) {
    return NextResponse.json(
      { error: "Email and password (min 8 chars) are required." },
      { status: 400 },
    );
  }
  const validRole = await prisma.roleProfile.findUnique({ where: { name: role } });
  if (!validRole) {
    return NextResponse.json({ error: "Invalid role." }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email already in use." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name: name || null, email, passwordHash, role, isActive, employeeId },
    select: { id: true, name: true, email: true, role: true, isActive: true, employeeId: true },
  });
  return NextResponse.json(user, { status: 201 });
}
