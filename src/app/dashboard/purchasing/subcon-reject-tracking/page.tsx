"use client";
import { customConfirm } from "@/lib/customConfirm";
import { toast as hotToast } from "react-hot-toast";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Plus,
  Search,
  Loader2,
  Edit2,
  AlertCircle,
  FileText,
  Send,
  Ban,
  ClipboardList
} from "lucide-react";

const STATUS_TABS = ["All", "Draft", "Submitted", "Void"] as const;

export default function SubconRejectTrackingListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<(typeof STATUS_TABS)[number]>("All");
  const [errorMsg, setErrorMsg] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const toastParam = searchParams.get("toast");
  useEffect(() => {
    if (!toastParam) return;
    if (toastParam === "updated") setToast("Subcon Reject Tracking updated successfully.");
    else if (toastParam === "created") setToast("Subcon Reject Tracking created successfully.");
    const t = setTimeout(() => setToast(null), 4000);
    router.replace("/dashboard/purchasing/subcon-reject-tracking");
    return () => clearTimeout(t);
  }, [toastParam, router]);

  const fetchRows = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch(
        `/api/purchasing/subcon-reject-tracking?search=${encodeURIComponent(search)}`
      );
      if (!res.ok) throw new Error("Failed to fetch subcon reject trackings");
      let data = await res.json();
      if (tab !== "All") {
        data = data.filter((r: any) => r.status === tab);
      }
      setRows(data);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows();
  }, [search, tab]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { All: rows.length };
    for (const r of rows) c[r.status] = (c[r.status] ?? 0) + 1;
    return c;
  }, [rows]);

  const selected = useMemo(
    () => rows.find((r) => r.id === selectedId) || null,
    [rows, selectedId]
  );

  async function callAction(id: string, actionStatus: "Submitted" | "Void") {
    const res = await fetch(`/api/purchasing/subcon-reject-tracking/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: actionStatus }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      hotToast.error(err.error || `Failed to change status to ${actionStatus}`);
      return null;
    }
    return res.json();
  }

  async function onSubmit() {
    if (!selected) return;
    if (selected.status !== "Draft") return hotToast.error("Only Draft can be Submitted");
    if (!await customConfirm(`Submit Subcon Reject Tracking ${selected.srjNo}?`)) return;
    await callAction(selected.id, "Submitted");
    fetchRows();
  }

  async function onVoid() {
    if (!selected) return;
    if (selected.status === "Void") return hotToast.error("Already voided");
    if (!await customConfirm(`Void Subcon Reject Tracking ${selected.srjNo}?`)) return;
    await callAction(selected.id, "Void");
    fetchRows();
  }

  function onEdit() {
    if (!selected) return;
    router.push(`/dashboard/purchasing/subcon-reject-tracking/${selected.id}`);
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 relative">
      {toast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 rounded-xl bg-indigo-900 px-4 py-3.5 text-xs font-bold text-white shadow-xl border border-indigo-800">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
          {toast}
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-6 border-b border-indigo-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-indigo-400 font-semibold tracking-wider uppercase mb-1">
            <Link href="/dashboard" className="hover:text-indigo-600">Dashboard</Link>
            <span>/</span>
            <span className="text-indigo-500">Purchasing</span>
            <span>/</span>
            <span className="text-indigo-500">Subcon Reject Tracking</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600">
              <ClipboardList size={20} />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-indigo-900">Subcon Reject Tracking</h2>
              <p className="text-sm text-indigo-500 mt-0.5">Manage rejected items from subcontractor.</p>
            </div>
          </div>
        </div>

        <Link
          href="/dashboard/purchasing/subcon-reject-tracking/new"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-lg shadow-md active:scale-95 transition-all duration-200 shrink-0"
        >
          <Plus size={16} /> New Tracking
        </Link>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 bg-white border border-indigo-200 p-3 rounded-xl shadow-sm">
        <ToolbarBtn icon={<Edit2 size={14} />} label="View / Edit" onClick={onEdit} disabled={!selected} />
        <ToolbarBtn icon={<Ban size={14} />} label="Void" onClick={onVoid} disabled={!selected || selected.status === "Void"} />
        <ToolbarBtn icon={<Send size={14} />} label="Submit" onClick={onSubmit} disabled={!selected || selected.status !== "Draft"} primary />
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
              tab === t
                ? "bg-indigo-900 text-white border-indigo-900"
                : "bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50"
            }`}
          >
            {t} {counts[t] != null ? `(${counts[t]})` : ""}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-white border border-indigo-200 p-4 rounded-xl shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-indigo-400" />
          <input
            type="text"
            placeholder="Search by SRJ No, PO No, or SRF No..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-indigo-50 border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-sm text-indigo-500">Loading trackings...</p>
        </div>
      ) : errorMsg ? (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 flex items-center gap-3 text-rose-700">
          <AlertCircle size={18} />
          <p className="text-sm font-medium">{errorMsg}</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="bg-white border border-indigo-200 rounded-xl p-12 text-center shadow-sm">
          <div className="mx-auto w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center mb-4">
            <ClipboardList size={22} className="text-indigo-600" />
          </div>
          <p className="text-indigo-600 font-semibold">No trackings found.</p>
          <p className="text-xs text-indigo-400 mt-1">Click "New Tracking" to create your first.</p>
        </div>
      ) : (
        <div className="bg-white border border-indigo-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="text-xs text-indigo-500 bg-indigo-50/50 uppercase tracking-wider border-b border-indigo-200">
                <tr>
                  <th className="px-4 py-3 w-10"></th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">SRJ No</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Company</th>
                  <th className="px-4 py-3">Supplier</th>
                  <th className="px-4 py-3">PO No</th>
                  <th className="px-4 py-3">SRF No</th>
                  <th className="px-4 py-3 text-right">Rejected Qty</th>
                  <th className="px-4 py-3">UOM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-indigo-100">
                {rows.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => setSelectedId(r.id === selectedId ? null : r.id)}
                    className={`cursor-pointer transition-colors ${
                      selectedId === r.id ? "bg-indigo-50/70" : "hover:bg-indigo-50/30"
                    }`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="radio"
                        checked={selectedId === r.id}
                        onChange={() => setSelectedId(r.id)}
                        className="accent-indigo-600"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill status={r.status} />
                    </td>
                    <td className="px-4 py-3 font-bold text-indigo-900">
                      <Link
                        href={`/dashboard/purchasing/subcon-reject-tracking/${r.id}`}
                        className="hover:text-indigo-600"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {r.srjNo}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-indigo-700">
                      {new Date(r.srjDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-indigo-700 font-medium">
                      {r.companyName}
                    </td>
                    <td className="px-4 py-3 text-indigo-700 font-medium">
                      {r.supplierName}
                    </td>
                    <td className="px-4 py-3 text-indigo-700 font-mono">
                      {r.poNo}
                    </td>
                    <td className="px-4 py-3 text-indigo-700 font-mono">
                      {r.srfNo}
                    </td>
                    <td className="px-4 py-3 text-indigo-700 text-right font-medium">
                      {r.rejectedQty}
                    </td>
                    <td className="px-4 py-3 text-indigo-700">
                      {r.uom}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function ToolbarBtn({
  icon,
  label,
  onClick,
  disabled,
  primary,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border transition-colors active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${
        primary
          ? "bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-500"
          : "bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50"
      }`}
    >
      {icon} {label}
    </button>
  );
}

function StatusPill({ status }: { status: string }) {
  const cls =
    status === "Submitted"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : status === "Draft"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : status === "Void"
      ? "bg-rose-50 text-rose-700 border-rose-200"
      : "bg-indigo-50 text-indigo-700 border-indigo-200";
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cls}`}>
      {status}
    </span>
  );
}
