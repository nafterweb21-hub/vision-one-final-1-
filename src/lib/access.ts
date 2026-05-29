// Shared role-to-path access policy. Imported by proxy.ts (edge) and Sidebar
// (client) — keep this file dependency-free (no Prisma, no Node-only APIs).

export type Role =
  | "ADMIN"
  | "SALES"
  | "PRODUCTION"
  | "PURCHASING"
  | "QC"
  | "PLANNER"
  | "VIEWER";

export const ALL_ROLES: Role[] = [
  "ADMIN",
  "SALES",
  "PRODUCTION",
  "PURCHASING",
  "QC",
  "PLANNER",
  "VIEWER",
];

// Ordered most-specific-first. The first matching prefix wins.
// A request to /dashboard/admin/users matches /dashboard/admin before /dashboard.
export const ACCESS_RULES: Array<{ prefix: string; roles: Role[] }> = [
  { prefix: "/dashboard/admin", roles: ["ADMIN"] },
  { prefix: "/dashboard/purchasing/purchase-order-approval", roles: ALL_ROLES },
  { prefix: "/dashboard/sales", roles: ["ADMIN", "SALES"] },
  { prefix: "/dashboard/production", roles: ["ADMIN", "PRODUCTION", "PLANNER", "QC"] },
  { prefix: "/dashboard/purchasing", roles: ["ADMIN", "PURCHASING"] },
  { prefix: "/dashboard/qc", roles: ["ADMIN", "QC", "PRODUCTION"] },
  { prefix: "/dashboard/profiles", roles: ["ADMIN"] },
  { prefix: "/dashboard/master-profile", roles: ["ADMIN"] },
  // Root /dashboard is reachable by any authenticated role.
  { prefix: "/dashboard", roles: ALL_ROLES },
];

export function allowedRolesForPath(pathname: string): Role[] | null {
  for (const rule of ACCESS_RULES) {
    if (pathname === rule.prefix || pathname.startsWith(rule.prefix + "/")) {
      return rule.roles;
    }
  }
  return null;
}

export function canAccess(pathname: string, role: Role | null | undefined): boolean {
  const allowed = allowedRolesForPath(pathname);
  if (!allowed) return true; // path not under access rules
  if (!role) return false;
  return allowed.includes(role);
}
