"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut } from "next-auth/react";
import { type PermissionsMap } from "@/lib/access";
import { NavLink, isActivePath, visibleSections } from "./NavLink";
import { ChevronDown, LayoutDashboard, LogOut, Menu, X } from "lucide-react";

interface SidebarProps {
  userEmail?: string | null;
  userRole?: string | null;
  userPermissions?: PermissionsMap | null;
}

export default function Sidebar({ userEmail, userRole, userPermissions }: SidebarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isReportsOpen, setIsReportsOpen] = useState(false);

  const sections = visibleSections(userPermissions, userRole);
  const close = () => setIsOpen(false);

  const linkClass = (href: string) => {
    const active = isActivePath(pathname, href);
    return `flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
      active
        ? "bg-indigo-600 text-white shadow-md shadow-slate-500/20 translate-x-1"
        : "text-indigo-600 hover:bg-slate-50 hover:text-indigo-700"
    }`;
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed top-3 z-50 rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 shadow-sm transition-all duration-300 hover:bg-slate-50 ${
          isOpen ? "left-[19rem]" : "left-6"
        }`}
        aria-label="Toggle Navigation"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {isOpen && (
        <div
          onClick={close}
          className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm transition-opacity"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 transform flex-col border-r border-slate-200 bg-white/95 shadow-2xl shadow-slate-900/10 backdrop-blur-xl transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center gap-3 border-b border-slate-200 bg-gradient-to-r from-indigo-600/5 to-purple-600/5 px-6">
          <img src="/logo.jpg" alt="Vision One Logo" className="h-8 w-auto object-contain drop-shadow-md" />
          <div>
            <h1 className="text-sm font-bold tracking-wide text-slate-900">FITPRISE EMS</h1>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-600">
              Vision One ERP
            </p>
          </div>
        </div>

        <div className="scrollbar-thin scrollbar-thumb-slate-200 flex-1 space-y-2 overflow-y-auto px-4 py-4">
          <Link href="/dashboard" onClick={close} className={linkClass("/dashboard")}>
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </Link>

          {sections.map((section) =>
            section.collapsible ? (
              <div key={section.title} className="pt-4">
                <button
                  onClick={() => setIsReportsOpen(!isReportsOpen)}
                  className="flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 transition-colors hover:bg-slate-50"
                >
                  <span>{section.title}</span>
                  <ChevronDown
                    size={14}
                    className={`transform transition-transform ${isReportsOpen ? "rotate-180" : ""}`}
                  />
                </button>
                <div
                  className={`mt-1 space-y-2 overflow-hidden transition-all duration-300 ${
                    isReportsOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  {section.items.map((item) => (
                    <NavLink
                      key={item.href}
                      item={item}
                      active={isActivePath(pathname, item.href)}
                      onNavigate={close}
                      className={linkClass(item.href)}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div key={section.title} className="pt-4">
                <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {section.title}
                </p>
                {section.items.map((item) => (
                  <NavLink
                    key={item.href}
                    item={item}
                    active={isActivePath(pathname, item.href)}
                    onNavigate={close}
                    className={linkClass(item.href)}
                  />
                ))}
              </div>
            ),
          )}
        </div>

        <div className="border-t border-slate-200 bg-slate-50/50 p-4">
          {userEmail && (
            <div className="mb-3 px-1">
              <p className="truncate text-xs font-semibold text-slate-900">{userEmail}</p>
              {userRole && (
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {userRole}
                </p>
              )}
            </div>
          )}
          <button
            onClick={() => signOut({ callbackUrl: "/auth/signin" })}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-slate-200"
          >
            <LogOut size={14} />
            Sign out
          </button>
          <p className="mt-3 text-center text-[10px] font-medium text-slate-500">FITPRISE EMS v1.1</p>
        </div>
      </aside>
    </>
  );
}
