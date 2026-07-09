import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authz";

export async function GET() {
  const { error } = await requirePermission("ROLES", "v");
  if (error) return error;

  const modules = await prisma.appModule.findMany({
    orderBy: [{ group: "asc" }, { name: "asc" }],
  });

  return NextResponse.json(modules);
}
