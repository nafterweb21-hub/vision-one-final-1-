import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import type { Perms } from "./role-form";

export async function isAdmin() {
  const session = await auth();
  return session?.user?.role === "ADMIN";
}

export function getModules() {
  return prisma.appModule.findMany({
    orderBy: [{ group: "asc" }, { name: "asc" }],
    select: { id: true, code: true, name: true, group: true },
  });
}

export function getRoles() {
  return prisma.roleProfile.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, remark: true, status: true },
  });
}

export function getRole(id: string) {
  return prisma.roleProfile.findUnique({
    where: { id },
    include: { rolePermissions: { include: { module: true } } },
  });
}

type RoleWithPermissions = NonNullable<Awaited<ReturnType<typeof getRole>>>;

/** Keyed by module code — the id is a per-database cuid, the code is stable. */
export function toPermissionMap(role: RoleWithPermissions): Record<string, Perms> {
  const perms: Record<string, Perms> = {};
  for (const p of role.rolePermissions) {
    perms[p.module.code] = {
      v: p.canView,
      c: p.canCreate,
      e: p.canEdit,
      d: p.canDelete,
      a: p.canApprove,
      x: p.canExport,
    };
  }
  return perms;
}
