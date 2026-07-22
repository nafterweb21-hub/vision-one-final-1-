"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/auth/signin" })}
      className="flex items-center gap-2 rounded-full bg-white border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 hover:text-blue-800 transition-all shadow-sm hover:shadow-md"
    >
      <LogOut className="h-4 w-4" />
      Logout
    </button>
  );
}
