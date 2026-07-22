"use client";

import { usePathname } from "next/navigation";
import GlobalHeader from "./GlobalHeader";
import type { PermissionsMap } from "@/lib/access";

interface GlobalHeaderWrapperProps {
  userEmail?: string | null;
  userRole?: string | null;
  userPermissions?: PermissionsMap | null;
  canSeeDashboard?: boolean;
}

export default function GlobalHeaderWrapper(props: GlobalHeaderWrapperProps) {
  const pathname = usePathname();

  // The dashboard has its own Sidebar; the rest render no chrome at all.
  if (
    pathname?.startsWith("/dashboard") ||
    pathname === "/" ||
    pathname?.startsWith("/auth") ||
    pathname?.startsWith("/print")
  ) {
    return null;
  }

  return (
    <>
      <GlobalHeader {...props} />
      {/* Offset the fixed header so content is not hidden behind it. */}
      <div className="no-print h-16" />
    </>
  );
}
