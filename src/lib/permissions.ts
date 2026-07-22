import { prisma } from '@/lib/prisma';
import { ALL_ACTIONS, isSuperRole, type PermissionsMap } from '@/lib/access';
import { APP_MODULES } from '@/lib/modules.config';

/**
 * Permissions are resolved from the database on demand rather than baked into
 * the session token, so revoking a role takes effect without waiting for the
 * user to sign out. The cache keeps that from costing a query per request.
 */
const CACHE_TTL_MS = 15_000;

type CacheEntry = { value: PermissionsMap; expiresAt: number };

const globalForPerms = globalThis as unknown as {
  __rolePermissionCache?: Map<string, CacheEntry>;
};

const cache = (globalForPerms.__rolePermissionCache ??= new Map<string, CacheEntry>());

function allPermissions(): PermissionsMap {
  const map: PermissionsMap = {};
  for (const mod of APP_MODULES) {
    map[mod.code] = Object.fromEntries(
      ALL_ACTIONS.map((a) => [a, true]),
    ) as PermissionsMap[string];
  }
  return map;
}

/** Drop cached entries so an edited role applies on the next request. */
export function invalidatePermissionsCache(roleName?: string) {
  if (roleName) cache.delete(roleName);
  else cache.clear();
}

type UserState = { role: string | null; isActive: boolean };

const userCache = ((globalThis as unknown as { __userAuthCache?: Map<string, { value: UserState; expiresAt: number }> })
  .__userAuthCache ??= new Map());

export function invalidateUserCache(userId?: string) {
  if (userId) userCache.delete(userId);
  else userCache.clear();
}

/**
 * The JWT records the role held at sign-in. Re-reading it means reassigning or
 * deactivating a user takes effect without waiting for their token to expire.
 */
export async function getUserAuthState(userId: string): Promise<UserState> {
  const now = Date.now();
  const cached = userCache.get(userId);
  if (cached && cached.expiresAt > now) return cached.value;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, isActive: true },
  });

  const value: UserState = user
    ? { role: user.role, isActive: user.isActive }
    : { role: null, isActive: false };

  userCache.set(userId, { value, expiresAt: now + CACHE_TTL_MS });
  return value;
}

export async function getPermissionsForRole(
  roleName: string | null | undefined,
): Promise<PermissionsMap> {
  if (!roleName) return {};

  // The super role is authoritative in code, not in data — a misconfigured
  // ADMIN row must never be able to lock every administrator out.
  if (isSuperRole(roleName)) return allPermissions();

  const now = Date.now();
  const cached = cache.get(roleName);
  if (cached && cached.expiresAt > now) return cached.value;

  const role = await prisma.roleProfile.findUnique({
    where: { name: roleName },
    include: { rolePermissions: { include: { module: true } } },
  });

  const permissions: PermissionsMap = {};

  // An inactive role grants nothing.
  if (role && role.status === 'Active') {
    for (const rp of role.rolePermissions) {
      if (!rp.module?.code) continue;
      permissions[rp.module.code] = {
        v: rp.canView,
        c: rp.canCreate,
        e: rp.canEdit,
        d: rp.canDelete,
        a: rp.canApprove,
        x: rp.canExport,
      };
    }
  }

  cache.set(roleName, { value: permissions, expiresAt: now + CACHE_TTL_MS });
  return permissions;
}
