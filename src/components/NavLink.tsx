"use client";

import Link from "next/link";
import { canAccess, type PermissionsMap } from "@/lib/access";
import { NAV_SECTIONS, type NavItem, type NavSection } from "./nav-config";

/** A path is active when it matches exactly or is an ancestor segment. */
export function isActivePath(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(href + "/");
}

/**
 * Drop every item the role cannot view, then every section left empty. Both
 * navigation surfaces call this, so a link can never appear without the
 * permission that `proxy.ts` will demand when it is followed.
 */
export function visibleSections(
  permissions: PermissionsMap | null | undefined,
  role: string | null | undefined,
): NavSection[] {
  return NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => canAccess(item.href, permissions, role)),
  })).filter((section) => section.items.length > 0);
}

export function NavLink({
  item,
  active,
  onNavigate,
  className,
}: {
  item: NavItem;
  active: boolean;
  onNavigate?: () => void;
  className: string;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={className}
    >
      <Icon size={16} className={item.iconClass} fill={item.filled ? "currentColor" : undefined} />
      <span className="flex-1">{item.label}</span>
    </Link>
  );
}

export type { NavItem, NavSection };
