import {
  APP_MODULES,
  PUBLIC_AUTHED_API_PATHS,
  PUBLIC_AUTHED_PATHS,
  PUBLIC_AUTHED_PATH_PREFIXES,
  type PermissionAction,
} from './modules.config';

export type Role = string;

export type ModulePermissions = {
  v: boolean;
  c: boolean;
  e: boolean;
  d: boolean;
  a: boolean;
  x: boolean;
};

export type PermissionsMap = Record<string, ModulePermissions>;

/** The role that bypasses all permission checks. Cannot be locked out. */
export const SUPER_ROLE = 'ADMIN';

export const ALL_ACTIONS: PermissionAction[] = ['v', 'c', 'e', 'd', 'a', 'x'];

export function isSuperRole(role?: string | null): boolean {
  return role === SUPER_ROLE;
}

/**
 * A path belongs to a prefix only on a segment boundary, so
 * `/dashboard/production/work-order-costing-report` never matches the
 * `/dashboard/production/work-order` module.
 */
function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(prefix + '/');
}

/** Longest matching prefix wins, so `/dashboard/inventory/report` beats `/dashboard/inventory`. */
function resolve(pathname: string, prefixesOf: (m: (typeof APP_MODULES)[number]) => string[]): string | null {
  let bestCode: string | null = null;
  let bestLength = -1;

  for (const mod of APP_MODULES) {
    for (const prefix of prefixesOf(mod)) {
      if (matchesPrefix(pathname, prefix) && prefix.length > bestLength) {
        bestLength = prefix.length;
        bestCode = mod.code;
      }
    }
  }

  return bestCode;
}

export function resolvePageModule(pathname: string): string | null {
  return resolve(pathname, (m) => m.pathPrefixes);
}

/** Print views expose a module's data, so they consume the export permission. */
export function resolveExportModule(pathname: string): string | null {
  return resolve(pathname, (m) => m.exportPrefixes ?? []);
}

export function resolveApiModule(pathname: string): string | null {
  return resolve(pathname, (m) => m.apiPrefixes ?? []);
}

export function isPublicAuthedPath(pathname: string): boolean {
  return (
    PUBLIC_AUTHED_PATHS.includes(pathname) ||
    PUBLIC_AUTHED_PATH_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix))
  );
}

export function isPublicAuthedApiPath(pathname: string): boolean {
  return PUBLIC_AUTHED_API_PATHS.some((prefix) => matchesPrefix(pathname, prefix));
}

/**
 * Some endpoints act on an existing document rather than creating one, so the
 * verb alone describes them wrongly. `POST .../approve` is an approval, not a
 * creation; `POST .../transition` (submit, void, revise) is an edit.
 */
const SEGMENT_ACTIONS: Record<string, PermissionAction> = {
  approve: 'a',
  check: 'a',
  transition: 'e',
  submit: 'e',
};

function actionForSegment(pathname: string): PermissionAction | null {
  const last = pathname.split('/').filter(Boolean).pop();
  if (!last) return null;
  return SEGMENT_ACTIONS[last] ?? null;
}

/** A read is a view; a write is create/edit/delete depending on the verb. */
export function actionForMethod(method: string): PermissionAction {
  switch (method.toUpperCase()) {
    case 'GET':
    case 'HEAD':
    case 'OPTIONS':
      return 'v';
    case 'POST':
      return 'c';
    case 'PUT':
    case 'PATCH':
      return 'e';
    case 'DELETE':
      return 'd';
    default:
      return 'e';
  }
}

export function hasAction(
  permissions: PermissionsMap | null | undefined,
  moduleCode: string,
  action: PermissionAction,
  role?: string | null,
): boolean {
  if (isSuperRole(role)) return true;
  if (!permissions) return false;
  return permissions[moduleCode]?.[action] === true;
}

/**
 * Page authorization. Denies unless the path resolves to a module the role can
 * view. Unregistered paths are denied — register the feature in
 * `modules.config.ts` rather than relaxing this.
 */
export function canAccess(
  pathname: string,
  permissions: PermissionsMap | null | undefined,
  role?: string | null,
): boolean {
  if (isSuperRole(role)) return true;
  if (isPublicAuthedPath(pathname)) return true;

  const exportModule = resolveExportModule(pathname);
  if (exportModule) return hasAction(permissions, exportModule, 'x', role);

  const moduleCode = resolvePageModule(pathname);
  if (!moduleCode) return false;

  return hasAction(permissions, moduleCode, 'v', role);
}

/** API authorization, keyed off the HTTP verb. */
export function canAccessApi(
  pathname: string,
  method: string,
  permissions: PermissionsMap | null | undefined,
  role?: string | null,
): boolean {
  if (isSuperRole(role)) return true;
  if (isPublicAuthedApiPath(pathname)) return true;

  const moduleCode = resolveApiModule(pathname);
  if (!moduleCode) return false;

  const verb = method.toUpperCase();
  const isRead = verb === 'GET' || verb === 'HEAD';
  const action = (!isRead && actionForSegment(pathname)) || actionForMethod(method);

  return hasAction(permissions, moduleCode, action, role);
}

// Granular helpers for UI gating.
export const canView = (p: PermissionsMap | null | undefined, m: string, role?: string | null) => hasAction(p, m, 'v', role);
export const canCreate = (p: PermissionsMap | null | undefined, m: string, role?: string | null) => hasAction(p, m, 'c', role);
export const canEdit = (p: PermissionsMap | null | undefined, m: string, role?: string | null) => hasAction(p, m, 'e', role);
export const canDelete = (p: PermissionsMap | null | undefined, m: string, role?: string | null) => hasAction(p, m, 'd', role);
export const canApprove = (p: PermissionsMap | null | undefined, m: string, role?: string | null) => hasAction(p, m, 'a', role);
export const canExport = (p: PermissionsMap | null | undefined, m: string, role?: string | null) => hasAction(p, m, 'x', role);
