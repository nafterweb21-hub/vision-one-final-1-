"use server";

import { prisma } from "@/lib/prisma";

/** Active roles, for role-assignment dropdowns (employees, process gating). */
export async function getActiveRoleProfiles() {
  return prisma.roleProfile.findMany({
    where: { status: "Active" },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}
