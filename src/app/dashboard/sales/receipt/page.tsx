"use client";
import { toast as hotToast } from "react-hot-toast";
import { customConfirm } from "@/lib/customConfirm";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Plus,
  Search,
  Loader2,
  Edit2,
  AlertCircle,
  Banknote,
  CheckCircle2,
  Ban,
  Trash2,
  Printer,
} from "lucide-react";
import { getReceipts, transitionReceiptAction, deleteDraftReceiptAction } from "./receipt.actions";

const STATUS_TABS = ["All", "Draft", "Confirmed", "Void"] as const;

type Receipt = {
  id: string;
  receiptNo: string;
  receiptDate: string;
  status: string;
  paymentMethod: string;
  amountReceived: string | number;
  chequeRefNo: string | null;
  customer?: { customerName: string };
  invoice?: { invoiceNo: string };
  currency?: { code: string };
};

export default function ReceiptListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [rows, setRows] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<(typeof STATUS_TABS)[number]>("All");
  const [errorMsg, setErrorMsg] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const toastParam = searchParams.get("toast");
  useEffect(() => {
    if (!toastParam) return;
    if (toastParam === "updated") setToast("Receipt updated successfully.");
    else if (toastParam === "created") setToast("Receipt created successfully.");
    const t = setTimeout(() => setToast(null), 4000);
    router.replace("/dashboard/sales/receipt");
    return () => clearTimeout(t);
  }, [toastParam, router]);

  const fetchRows = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await getReceipts();
      if (!res.success) throw new Error(res.error || "Failed to fetch receipts");
      setRows(res.data);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows();
  }, []);

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      if (tab !== "All" && r.status !== tab) return false;
      if (search) {
        const s = search.toLowerCase();
        return (
          r.receiptNo.toLowerCase().includes(s) ||
          r.customer?.customerName?.toLowerCase().includes(s) ||
          r.invoice?.invoiceNo?.toLowerCase().includes(s) ||
          r.paymentMethod.toLowerCase().includes(s)
        );
      }
      return true;
    });
  }, [rows, search, tab]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { All: rows.length };
    for (const r of rows) c[r.status] = (c[r.status] ?? 0) + 1;
    return c;
  }, [rows]);

  const selected = useMemo(
    () => rows.find((r) => r.id === selectedId) || null,
    [rows, selectedId],
  );

  async function onConfirm() {
    if (!selected) return;
    if (selected.status !== "Draft") return hotToast.error("Only Draft can be Confirmed");
    if (!await customConfirm(`Confirm receipt ${selected.receiptNo}?`)) return;
    
    setLoading(true);
    const res = await transitionReceiptAction(selected.id, "confirm");
    if (!res.success) hotToast.error(res.error || "Failed to confirm");
    await fetchRows();
  }

  async function onVoid() {
    if (!selected) return;
    if (selected.status === "Void") return hotToast.error("Already Voided");
    if (!await customConfirm(`Void receipt ${selected.receiptNo}?`)) return;
    
    setLoading(true);
    const res = await transitionReceiptAction(selected.id, "void");
    if (!res.success) hotToast.error(res.error || "Failed to void");
    await fetchRows();
  }

  async function onDelete() {
    if (!selected) return;
    if (selected.status !== "Draft") return hotToast.error("Only Draft can be deleted");
    if (!await customConfirm(`Permanently delete receipt ${selected.receiptNo}?`)) return;
    
    setLoading(true);
    const res = await deleteDraftReceiptAction(selected.id);
    if (!res.success) hotToast.error(res.error || "Failed to delete");
    await fetchRows();
  }

  function onEdit() {
    if (!selected) return;
    if (selected.status !== "Draft") return hotToast.error("Only Draft can be edited");
    router.push(`/dashboard/sales/receipt/form?id=${selected.id}`);
  }

  function onPrint() {
    if (!selected) return;
    if (selected.status !== "Confirmed") return hotToast.error("Only Confirmed receipts can be printed");
    window.open(`/print/receipt/${selected.id}`, "_blank");
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 relative">
      {toast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 rounded-xl bg-blue-900 px-4 py-3.5 text-xs font-bold text-white shadow-xl border border-blue-800">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
          {toast}
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-6 border-b border-blue-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-blue-400 font-semibold tracking-wider uppercase mb-1">
            <Link href="/dashboard" className="hover:text-blue-600">Dashboard</Link>
            <span>/</span>
            <span className="text-blue-500">Sales</span>
            <span>/</span>
            <span className="text-blue-500">Receipt / Payment Record</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
              <Banknote size={20} />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-blue-900">Receipts</h2>
              <p className="text-sm text-blue-500 mt-0.5">Record payments received from customers.</p>
            </div>
          </div>
        </div>

        <Link
          href="/dashboard/sales/receipt/form"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 rounded-lg shadow-md active:scale-95 transition-all duration-200 shrink-0"
        >
          <Plus size={16} /> New Receipt
        </Link>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 bg-white border border-blue-200 p-3 rounded-xl shadow-sm">
        <ToolbarBtn icon={<Edit2 size={14} />} label="Edit" onClick={onEdit} disabled={!selected || selected.status !== "Draft"} />
        <ToolbarBtn icon={<CheckCircle2 size={14} />} label="Confirm" onClick={onConfirm} disabled={!selected || selected.status !== "Draft"} primary />
        <ToolbarBtn icon={<Ban size={14} />} label="Void" onClick={onVoid} disabled={!selected || selected.status === "Void"} />
        <ToolbarBtn icon={<Trash2 size={14} />} label="Delete" onClick={onDelete} disabled={!selected || selected.status !== "Draft"} />
        <ToolbarBtn icon={<Printer size={14} />} label="Print" onClick={onPrint} disabled={!selected || selected.status !== "Confirmed"} />
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
              tab === t
                ? "bg-blue-900 text-white border-blue-900"
                : "bg-white text-blue-700 border-blue-200 hover:bg-blue-50"
            }`}
          >
            {t} {counts[t] != null ? `(${counts[t]})` : ""}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-white border border-blue-200 p-4 rounded-xl shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-blue-400" />
          <input
            type="text"
            placeholder="Search by Receipt No, Customer, or Invoice..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-blue-50 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          <p className="text-sm text-blue-500">Loading receipts...</p>
        </div>
      ) : errorMsg ? (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 flex items-center gap-3 text-rose-700">
          <AlertCircle size={18} />
          <p className="text-sm font-medium">{errorMsg}</p>
        </div>
      ) : filteredRows.length === 0 ? (
        <div className="bg-white border border-blue-200 rounded-xl p-12 text-center shadow-sm">
          <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
            <Banknote size={22} className="text-emerald-500" />
          </div>
          <p className="text-blue-600 font-semibold">No receipts found.</p>
          <p className="text-xs text-blue-400 mt-1">Click &quot;New Receipt&quot; to record a payment.</p>
        </div>
      ) : (
        <div className="bg-white border border-blue-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="text-xs text-blue-500 bg-blue-50/50 uppercase tracking-wider border-b border-blue-200">
                <tr>
                  <th className="px-3 py-3 w-10"></th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Receipt No</th>
                  <th className="px-3 py-3">Date</th>
                  <th className="px-3 py-3">Customer</th>
                  <th className="px-3 py-3">Invoice No</th>
                  <th className="px-3 py-3">Method</th>
                  <th className="px-3 py-3">Ref No</th>
                  <th className="px-3 py-3 text-right">Amount Received</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-100">
                {filteredRows.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => setSelectedId(r.id === selectedId ? null : r.id)}
                    className={`cursor-pointer transition-colors ${
                      selectedId === r.id ? "bg-emerald-50/70" : "hover:bg-blue-50/50"
                    }`}
                  >
                    <td className="px-3 py-3">
                      <input
                        type="radio"
                        checked={selectedId === r.id}
                        onChange={() => setSelectedId(r.id)}
                        className="accent-emerald-500"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <StatusPill status={r.status} />
                    </td>
                    <td className="px-3 py-3 font-bold text-blue-900">
                      <Link
                        href={`/dashboard/sales/receipt/${r.id}`}
                        className="hover:text-emerald-600"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {r.receiptNo}
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-blue-700">
                      {new Date(r.receiptDate).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-3 font-medium text-blue-700">
                      {r.customer?.customerName || "—"}
                    </td>
                    <td className="px-3 py-3 text-blue-700">
                      {r.invoice?.invoiceNo || "—"}
                    </td>
                    <td className="px-3 py-3 text-blue-700">{r.paymentMethod}</td>
                    <td className="px-3 py-3 text-blue-700">{r.chequeRefNo || "—"}</td>
                    <td className="px-3 py-3 text-right font-mono font-semibold text-blue-900">
                      {r.currency?.code} {Number(r.amountReceived).toFixed(2)}
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
          ? "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-500"
          : "bg-white text-blue-700 border-blue-200 hover:bg-blue-50"
      }`}
    >
      {icon} {label}
    </button>
  );
}

function StatusPill({ status }: { status: string }) {
  const cls =
    status === "Confirmed"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : status === "Draft"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : status === "Void"
      ? "bg-rose-50 text-rose-700 border-rose-200"
      : "bg-blue-50 text-blue-700 border-blue-200";
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cls}`}>
      {status}
    </span>
  );
}
