import { prisma } from "@/lib/prisma";

export type PermissionPayload = Record<
  string,
  { v?: boolean; c?: boolean; e?: boolean; d?: boolean; a?: boolean; x?: boolean }
>;

export type RolePermissionRow = {
  moduleId: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canApprove: boolean;
  canExport: boolean;
};

/**
 * Accepts a permission map keyed by either AppModule id or module code, and
 * returns rows keyed by id. Unknown keys are rejected rather than silently
 * dropped, so a stale client cannot quietly save a role with missing grants.
 */
export async function resolveModuleIds(
  permissions: PermissionPayload,
): Promise<RolePermissionRow[]> {
  const keys = Object.keys(permissions);
  if (keys.length === 0) return [];

  const modules = await prisma.appModule.findMany({
    where: { OR: [{ id: { in: keys } }, { code: { in: keys } }] },
    select: { id: true, code: true },
  });

  const byKey = new Map<string, string>();
  for (const m of modules) {
    byKey.set(m.id, m.id);
    byKey.set(m.code, m.id);
  }

  const rows: RolePermissionRow[] = [];
  const seen = new Set<string>();

  for (const key of keys) {
    const moduleId = byKey.get(key);
    if (!moduleId) {
      throw new Error(`Unknown module: ${key}. Run "npx tsx scripts/sync-modules.ts".`);
    }
    if (seen.has(moduleId)) continue;
    seen.add(moduleId);

    const p = permissions[key];
    rows.push({
      moduleId,
      canView: !!p.v,
      canCreate: !!p.c,
      canEdit: !!p.e,
      canDelete: !!p.d,
      canApprove: !!p.a,
      canExport: !!p.x,
    });
  }

  return rows;
}
