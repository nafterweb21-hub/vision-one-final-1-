import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/authz";


export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireRole("ADMIN");
  if (error) return error;
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      employeeId: true,
      employee: { select: { id: true, code: true, name: true } },
    },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(user);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireRole("ADMIN");
  if (error) return error;
  const { id } = await params;

  const body = await req.json();
  const data: Record<string, unknown> = {};

  if (typeof body.name === "string") data.name = body.name.trim() || null;
  if (typeof body.email === "string") {
    const email = body.email.trim().toLowerCase();
    if (!email) return NextResponse.json({ error: "Email required." }, { status: 400 });
    data.email = email;
  }
  if (typeof body.role === "string") {
    const validRole = await prisma.roleProfile.findUnique({ where: { name: body.role } });
    if (!validRole) {
      return NextResponse.json({ error: "Invalid role." }, { status: 400 });
    }
    // prevent admins from demoting themselves
    if (session!.user.id === id && body.role !== "ADMIN") {
      return NextResponse.json(
        { error: "You cannot change your own role." },
        { status: 400 },
      );
    }
    data.role = body.role;
  }
  if (typeof body.isActive === "boolean") {
    if (session!.user.id === id && !body.isActive) {
      return NextResponse.json(
        { error: "You cannot deactivate your own account." },
        { status: 400 },
      );
    }
    data.isActive = body.isActive;
  }
  if (body.employeeId === null || typeof body.employeeId === "string") {
    data.employeeId = body.employeeId || null;
  }
  if (typeof body.password === "string" && body.password.length > 0) {
    if (body.password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 },
      );
    }
    data.passwordHash = await bcrypt.hash(body.password, 10);
  }

  try {
    const user = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, name: true, email: true, role: true, isActive: true, employeeId: true },
    });
    return NextResponse.json(user);
  } catch (e) {
    const err = e as { code?: string };
    if (err.code === "P2002") {
      return NextResponse.json({ error: "Email already in use." }, { status: 409 });
    }
    if (err.code === "P2025") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    throw e;
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireRole("ADMIN");
  if (error) return error;
  const { id } = await params;

  if (session!.user.id === id) {
    return NextResponse.json(
      { error: "You cannot delete your own account." },
      { status: 400 },
    );
  }

  try {
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const err = e as { code?: string };
    if (err.code === "P2025") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    throw e;
  }
}
