"use client";

import { usePathname } from "next/navigation";
import GlobalHeader from "./GlobalHeader";

export default function GlobalHeaderWrapper() {
  const pathname = usePathname();

  // Do not show the header on the dashboard, the login page, or print pages
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
      <GlobalHeader />
      {/* Add padding to the top so content doesn't get hidden behind the fixed header */}
      <div className="h-16 no-print" />
    </>
  );
}
