"use client";

import { usePathname } from "next/navigation";
import GlobalHeader from "./GlobalHeader";

export default function GlobalHeaderWrapper() {
  const pathname = usePathname();

  // Do not show the header on the dashboard or if it is exactly the dashboard route
  if (pathname?.startsWith("/dashboard")) {
    return null;
  }

  return (
    <>
      <GlobalHeader />
      {/* Add padding to the top so content doesn't get hidden behind the fixed header */}
      <div className="h-16" />
    </>
  );
}
