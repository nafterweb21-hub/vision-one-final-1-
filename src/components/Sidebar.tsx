"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut } from "next-auth/react";
import { canAccess, type Role } from "@/lib/access";
import {
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  LayoutGrid,
  Key,
  User,
  Bell,
  Lock,
  Mail,
  Diamond,
  CircleDot,
  Circle,
  Hexagon,
  File,
  SquareSplitHorizontal,
  Briefcase,
  List,
  Book,
  CheckSquare,
  PackageOpen,
  CornerUpLeft,
  Clipboard,
  RefreshCw,
  AlertTriangle,
  Receipt,
  BarChart2,
  Building2,
  Handshake,
  Factory,
  Coins,
  Calendar,
  Scale,
  Box,
  BarChart,
  TrendingUp,
  ShoppingCart,
  Settings2,
  Layers,
  Globe,
  Package,
  Flame,
  Link2,
  Cpu,
  Gauge,
} from "lucide-react";

interface SidebarProps {
  userEmail?: string | null;
  userRole?: string | null;
  isAdmin?: boolean;
}

export default function Sidebar({ userEmail, userRole, isAdmin }: SidebarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const role = (userRole ?? null) as Role | null;
  const allow = (path: string) => canAccess(path, role);

  const linkClass = (path: string) => {
    // Exact match for dashboard or check if it is exactly the path or starts with the path + "/" for nested routes
    const active = path === "/dashboard" ? pathname === "/dashboard" : pathname === path || pathname.startsWith(path + "/");
    return `flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
      active
        ? "bg-indigo-600 text-white shadow-md shadow-slate-500/20 translate-x-1"
        : "text-indigo-600 hover:bg-slate-50 :bg-indigo-800 hover:text-indigo-700 :text-white"
    }`;
  };

  return (
    <>
      {/* Mobile & Desktop Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed top-5 z-50 p-2.5 rounded-xl border shadow-sm transition-all duration-300 ${
          isOpen 
            ? "left-[19rem] bg-white border-slate-200 text-slate-600 hover:bg-slate-50" 
            : "left-6 bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
        }`}
        aria-label="Toggle Navigation"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm transition-opacity"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 bg-white/95 backdrop-blur-xl border-r border-slate-200 flex flex-col transition-transform duration-300 transform shadow-2xl shadow-slate-900/10 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header Branding */}
        <div className="h-16 px-6 border-b border-slate-200 flex items-center gap-3 bg-gradient-to-r from-indigo-600/5 to-purple-600/5">
          <img src="/logo.jpg" alt="Vision One Logo" className="h-8 w-auto object-contain drop-shadow-md" />
          <div>
            <h1 className="font-bold text-sm text-slate-900 tracking-wide">
              FITPRISE EMS
            </h1>
            <p className="text-[10px] font-semibold text-indigo-600 tracking-wider uppercase">
              Vision One ERP
            </p>
          </div>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 scrollbar-thin scrollbar-thumb-slate-200 ">
          <Link
            href="/dashboard"
            onClick={() => setIsOpen(false)}
            className={linkClass("/dashboard")}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </Link>

          {/* ADMINISTRATOR */}
          <div className="pt-4">
            <p className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              ADMINISTRATOR
            </p>
            <Link href="#" onClick={() => setIsOpen(false)} className={linkClass("#module-management")}>
              <LayoutGrid size={16} className="text-slate-500" />
              <span>Module Management</span>
            </Link>
            <Link href="#" onClick={() => setIsOpen(false)} className={linkClass("#roles")}>
              <Key size={16} className="text-yellow-500" />
              <span>Roles</span>
            </Link>
            {isAdmin && allow("/dashboard/admin/users") && (
              <Link href="/dashboard/admin/users" onClick={() => setIsOpen(false)} className={linkClass("/dashboard/admin/users")}>
                <User size={16} className="text-slate-500" fill="currentColor" />
                <span>Users</span>
              </Link>
            )}
            <Link href="#" onClick={() => setIsOpen(false)} className={linkClass("#user-alert")}>
              <Bell size={16} className="text-yellow-600" />
              <span>User Alert</span>
            </Link>
            <Link href="#" onClick={() => setIsOpen(false)} className={linkClass("#user-locked-record")}>
              <Lock size={16} className="text-yellow-600" fill="currentColor" />
              <span>User Locked Record</span>
            </Link>
            <Link href="#" onClick={() => setIsOpen(false)} className={linkClass("#email-notification")}>
              <Mail size={16} className="text-slate-500" />
              <span>Email Notification</span>
            </Link>
          </div>

          {/* OPERATION */}
          <div className="pt-4">
            <p className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              OPERATION
            </p>
            {allow("/dashboard/sales/sales-order") && (
              <Link href="/dashboard/sales/sales-order" onClick={() => setIsOpen(false)} className={linkClass("/dashboard/sales/sales-order")}>
                <Diamond size={16} className="text-slate-600" />
                <span className="flex-1">Sales Order</span>
                <span className="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">3</span>
              </Link>
            )}
            {allow("/dashboard/production/work-order") && (
              <Link href="/dashboard/production/work-order" onClick={() => setIsOpen(false)} className={linkClass("/dashboard/production/work-order")}>
                <CircleDot size={16} className="text-slate-600" />
                <span className="flex-1">Work Order</span>
                <span className="bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full">7</span>
              </Link>
            )}
            {allow("/dashboard/qc/approval") && (
              <Link href="/dashboard/qc/approval" onClick={() => setIsOpen(false)} className={linkClass("/dashboard/qc/approval")}>
                <Circle size={16} className="text-slate-600" />
                <span className="flex-1">QC Approval</span>
                <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">2</span>
              </Link>
            )}
            {allow("/dashboard/sales/delivery-order") && (
              <Link href="/dashboard/sales/delivery-order" onClick={() => setIsOpen(false)} className={linkClass("/dashboard/sales/delivery-order")}>
                <Hexagon size={16} className="text-slate-600" fill="currentColor" />
                <span>Delivery Order</span>
              </Link>
            )}
            {allow("/dashboard/qc/coc") && (
              <Link href="/dashboard/qc/coc" onClick={() => setIsOpen(false)} className={linkClass("/dashboard/qc/coc")}>
                <File size={16} className="text-slate-400" fill="currentColor" />
                <span>Certificate Of Conformity</span>
              </Link>
            )}
            <Link href="/dashboard/production/process-parameter" onClick={() => setIsOpen(false)} className={linkClass("/dashboard/production/process-parameter")}>
              <SquareSplitHorizontal size={16} className="text-slate-600" fill="currentColor" />
              <span>Process Parameter Confirmation</span>
            </Link>
            {allow("/dashboard/sales/quotation") && (
              <Link href="/dashboard/sales/quotation" onClick={() => setIsOpen(false)} className={linkClass("/dashboard/sales/quotation")}>
                <Briefcase size={16} className="text-yellow-600" fill="currentColor" />
                <span>Vision One Costing & Quotation</span>
              </Link>
            )}
          </div>

          {/* PROCUREMENT */}
          <div className="pt-4">
            <p className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              PROCUREMENT
            </p>
            {allow("/dashboard/purchasing/purchase-requisition") && (
              <Link href="/dashboard/purchasing/purchase-requisition" onClick={() => setIsOpen(false)} className={linkClass("/dashboard/purchasing/purchase-requisition")}>
                <List size={16} className="text-slate-500" />
                <span>Purchase Requisition</span>
              </Link>
            )}
            {allow("/dashboard/purchasing/purchase-order") && (
              <Link href="/dashboard/purchasing/purchase-order" onClick={() => setIsOpen(false)} className={linkClass("/dashboard/purchasing/purchase-order")}>
                <Book size={16} className="text-slate-600" fill="currentColor" />
                <span>Purchase Order</span>
              </Link>
            )}
            {allow("/dashboard/purchasing/purchase-order-approval") && (
              <Link href="/dashboard/purchasing/purchase-order-approval" onClick={() => setIsOpen(false)} className={linkClass("/dashboard/purchasing/purchase-order-approval")}>
                <CheckSquare size={16} className="text-green-500" fill="currentColor" />
                <span className="flex-1">Purchase Order Approval</span>
                <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">4</span>
              </Link>
            )}
            {allow("/dashboard/purchasing/goods-receive") && (
              <Link href="/dashboard/purchasing/goods-receive" onClick={() => setIsOpen(false)} className={linkClass("/dashboard/purchasing/goods-receive")}>
                <PackageOpen size={16} className="text-amber-700" fill="currentColor" />
                <span>Goods Receive</span>
              </Link>
            )}
            {allow("/dashboard/purchasing/goods-return") && (
              <Link href="/dashboard/purchasing/goods-return" onClick={() => setIsOpen(false)} className={linkClass("/dashboard/purchasing/goods-return")}>
                <CornerUpLeft size={16} className="text-slate-600" />
                <span>Goods Return</span>
              </Link>
            )}
          </div>

          {/* SUBCON */}
          <div className="pt-4">
            <p className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              SUBCON
            </p>
            {allow("/dashboard/purchasing/purchase-order-subcon") && (
              <Link href="/dashboard/purchasing/purchase-order-subcon" onClick={() => setIsOpen(false)} className={linkClass("/dashboard/purchasing/purchase-order-subcon")}>
                <Hexagon size={16} className="text-slate-400" />
                <span>Purchase Order Subcon</span>
              </Link>
            )}
            <Link href="#" onClick={() => setIsOpen(false)} className={linkClass("#po-subcon-approval")}>
              <CheckSquare size={16} className="text-green-500" fill="currentColor" />
              <span>PO Subcon Approval</span>
            </Link>
            {allow("/dashboard/purchasing/subcon-request-form") && (
              <Link href="/dashboard/purchasing/subcon-request-form" onClick={() => setIsOpen(false)} className={linkClass("/dashboard/purchasing/subcon-request-form")}>
                <Clipboard size={16} className="text-slate-500" fill="currentColor" />
                <span>Subcon Request Form</span>
              </Link>
            )}
            {allow("/dashboard/purchasing/subcon-return-tracking") && (
              <Link href="/dashboard/purchasing/subcon-return-tracking" onClick={() => setIsOpen(false)} className={linkClass("/dashboard/purchasing/subcon-return-tracking")}>
                <RefreshCw size={16} className="text-slate-500" />
                <span>Subcon Return Tracking</span>
              </Link>
            )}
            <Link href="#" onClick={() => setIsOpen(false)} className={linkClass("#subcon-reject-tracking")}>
              <AlertTriangle size={16} className="text-slate-500" />
              <span>Subcon Reject Tracking</span>
            </Link>
          </div>

          {/* FINANCE */}
          <div className="pt-4">
            <p className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              FINANCE
            </p>
            {allow("/dashboard/sales/quotation") && (
              <Link href="/dashboard/sales/quotation" onClick={() => setIsOpen(false)} className={linkClass("/dashboard/sales/quotation")}>
                <Clipboard size={16} className="text-slate-500" fill="currentColor" />
                <span className="flex-1">Quotations</span>
                <span className="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">2</span>
              </Link>
            )}
            {allow("/dashboard/sales/invoice") && (
              <Link href="/dashboard/sales/invoice" onClick={() => setIsOpen(false)} className={linkClass("/dashboard/sales/invoice")}>
                <Receipt size={16} className="text-slate-400" />
                <span className="flex-1">Invoicing</span>
              </Link>
            )}
            <Link href="#" onClick={() => setIsOpen(false)} className={linkClass("#cost-monitoring")}>
              <BarChart2 size={16} className="text-blue-500" fill="currentColor" />
              <span>Cost Monitoring</span>
            </Link>
            {allow("/dashboard/qc/ncr") && (
              <Link href="/dashboard/qc/ncr" onClick={() => setIsOpen(false)} className={linkClass("/dashboard/qc/ncr")}>
                <AlertTriangle size={16} className="text-slate-500" />
                <span>NCR</span>
              </Link>
            )}
          </div>

          {/* PROFILE */}
          <div className="pt-4">
            <p className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              PROFILE
            </p>
            {allow("/dashboard/profiles/company") && (
              <Link href="/dashboard/profiles/company" onClick={() => setIsOpen(false)} className={linkClass("/dashboard/profiles/company")}>
                <Building2 size={16} className="text-slate-500" fill="currentColor" />
                <span>Company Profile</span>
              </Link>
            )}
            {allow("/dashboard/master-profile/employee") && (
              <Link href="/dashboard/master-profile/employee" onClick={() => setIsOpen(false)} className={linkClass("/dashboard/master-profile/employee")}>
                <User size={16} className="text-slate-500" fill="currentColor" />
                <span>Employee Profile</span>
              </Link>
            )}
            {allow("/dashboard/profiles/approval-levels") && (
              <Link href="/dashboard/profiles/approval-levels" onClick={() => setIsOpen(false)} className={linkClass("/dashboard/profiles/approval-levels")}>
                <Key size={16} className="text-yellow-500" fill="currentColor" />
                <span>Approval Level Profile</span>
              </Link>
            )}
            {allow("/dashboard/admin/master-profile/customer") && (
              <Link href="/dashboard/admin/master-profile/customer" onClick={() => setIsOpen(false)} className={linkClass("/dashboard/admin/master-profile/customer")}>
                <Handshake size={16} className="text-yellow-600" fill="currentColor" />
                <span>Customer Profile</span>
              </Link>
            )}
            {allow("/dashboard/admin/master-profile/supplier") && (
              <Link href="/dashboard/admin/master-profile/supplier" onClick={() => setIsOpen(false)} className={linkClass("/dashboard/admin/master-profile/supplier")}>
                <Factory size={16} className="text-amber-800" fill="currentColor" />
                <span>Supplier Profile</span>
              </Link>
            )}
            {allow("/dashboard/profiles/currency") && (
              <Link href="/dashboard/profiles/currency" onClick={() => setIsOpen(false)} className={linkClass("/dashboard/profiles/currency")}>
                <Coins size={16} className="text-slate-600" />
                <span>Currency Profile</span>
              </Link>
            )}
            {allow("/dashboard/admin/master-profile/tax") && (
              <Link href="/dashboard/admin/master-profile/tax" onClick={() => setIsOpen(false)} className={linkClass("/dashboard/admin/master-profile/tax")}>
                <Receipt size={16} className="text-slate-400" />
                <span>Tax Profile</span>
              </Link>
            )}
            {allow("/dashboard/profiles/payment-term") && (
              <Link href="/dashboard/profiles/payment-term" onClick={() => setIsOpen(false)} className={linkClass("/dashboard/profiles/payment-term")}>
                <Calendar size={16} className="text-red-800" fill="currentColor" />
                <span>Payment Terms</span>
              </Link>
            )}
            {allow("/dashboard/profiles/uom") && (
              <Link href="/dashboard/profiles/uom" onClick={() => setIsOpen(false)} className={linkClass("/dashboard/profiles/uom")}>
                <Scale size={16} className="text-slate-500" />
                <span>UOM Profile</span>
              </Link>
            )}
            {allow("/dashboard/profiles/material-categories") && (
              <Link href="/dashboard/profiles/material-categories" onClick={() => setIsOpen(false)} className={linkClass("/dashboard/profiles/material-categories")}>
                <Box size={16} className="text-amber-800" fill="currentColor" />
                <span>Material Category Profile</span>
              </Link>
            )}
            {allow("/dashboard/master-profile/process-profile") && (
              <Link href="/dashboard/master-profile/process-profile" onClick={() => setIsOpen(false)} className={linkClass("/dashboard/master-profile/process-profile")}>
                <Settings2 size={16} className="text-slate-500" />
                <span>Process Profile</span>
              </Link>
            )}
            {allow("/dashboard/master-profile/main-process") && (
              <Link href="/dashboard/master-profile/main-process" onClick={() => setIsOpen(false)} className={linkClass("/dashboard/master-profile/main-process")}>
                <Layers size={16} className="text-indigo-500" />
                <span>Main Process Profile</span>
              </Link>
            )}
            {allow("/dashboard/profiles/incoterm") && (
              <Link href="/dashboard/profiles/incoterm" onClick={() => setIsOpen(false)} className={linkClass("/dashboard/profiles/incoterm")}>
                <Globe size={16} className="text-blue-500" />
                <span>Incoterm Profile</span>
              </Link>
            )}
            {allow("/dashboard/master-profile/material-type") && (
              <Link href="/dashboard/master-profile/material-type" onClick={() => setIsOpen(false)} className={linkClass("/dashboard/master-profile/material-type")}>
                <Package size={16} className="text-amber-600" />
                <span>Material Type Profile</span>
              </Link>
            )}
            {allow("/dashboard/master-profile/welding-type") && (
              <Link href="/dashboard/master-profile/welding-type" onClick={() => setIsOpen(false)} className={linkClass("/dashboard/master-profile/welding-type")}>
                <Flame size={16} className="text-orange-500" />
                <span>Welding Type Profile</span>
              </Link>
            )}
            {allow("/dashboard/master-profile/joint") && (
              <Link href="/dashboard/master-profile/joint" onClick={() => setIsOpen(false)} className={linkClass("/dashboard/master-profile/joint")}>
                <Link2 size={16} className="text-slate-600" />
                <span>Joint Profile</span>
              </Link>
            )}
            {allow("/dashboard/profiles/machine") && (
              <Link href="/dashboard/profiles/machine" onClick={() => setIsOpen(false)} className={linkClass("/dashboard/profiles/machine")}>
                <Cpu size={16} className="text-slate-500" />
                <span>Machine Profile</span>
              </Link>
            )}
            {allow("/dashboard/profiles/elcometer") && (
              <Link href="/dashboard/profiles/elcometer" onClick={() => setIsOpen(false)} className={linkClass("/dashboard/profiles/elcometer")}>
                <Gauge size={16} className="text-red-500" />
                <span>Elcometer Profile</span>
              </Link>
            )}
            {allow("/dashboard/master-profile/failure-mode") && (
              <Link href="/dashboard/master-profile/failure-mode" onClick={() => setIsOpen(false)} className={linkClass("/dashboard/master-profile/failure-mode")}>
                <AlertTriangle size={16} className="text-red-600" />
                <span>Failure Mode Profile</span>
              </Link>
            )}
          </div>

          {/* REPORT */}
          <div className="pt-4">
            <p className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              REPORT
            </p>
            {allow("/dashboard/sales/sales-report") && (
              <Link href="/dashboard/sales/sales-report" onClick={() => setIsOpen(false)} className={linkClass("/dashboard/sales/sales-report")}>
                <BarChart size={16} className="text-blue-500" fill="currentColor" />
                <span>Sales Report</span>
              </Link>
            )}
            <Link href="#" onClick={() => setIsOpen(false)} className={linkClass("#work-order-costing-report")}>
              <TrendingUp size={16} className="text-red-500" />
              <span>Work Order Costing Report</span>
            </Link>
            {allow("/dashboard/qc/ncr-report") && (
              <Link href="/dashboard/qc/ncr-report" onClick={() => setIsOpen(false)} className={linkClass("/dashboard/qc/ncr-report")}>
                <AlertTriangle size={16} className="text-slate-500" />
                <span>Non Conformance Report</span>
              </Link>
            )}
            {allow("/dashboard/purchasing/purchasing-report") && (
              <Link href="/dashboard/purchasing/purchasing-report" onClick={() => setIsOpen(false)} className={linkClass("/dashboard/purchasing/purchasing-report")}>
                <ShoppingCart size={16} className="text-slate-500" />
                <span>Purchasing Report</span>
              </Link>
            )}
            {allow("/dashboard/purchasing/subcon-purchasing-report") && (
              <Link href="/dashboard/purchasing/subcon-purchasing-report" onClick={() => setIsOpen(false)} className={linkClass("/dashboard/purchasing/subcon-purchasing-report")}>
                <Factory size={16} className="text-red-800" fill="currentColor" />
                <span>Subcon Purchasing Report</span>
              </Link>
            )}
          </div>
        </div>

        {/* Footer: user + sign out */}
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
          <p className="mt-3 text-center text-[10px] font-medium text-slate-500">
            FITPRISE EMS v1.1
          </p>
        </div>
      </aside>
    </>
  );
}
