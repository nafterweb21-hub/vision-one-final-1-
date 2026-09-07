"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import { AlertCircle, Ban, Check, Loader2, PackageMinus, Pencil, Plus, Search } from "lucide-react";
import { canCreate, canEdit } from "@/lib/access";
import { customConfirm } from "@/lib/customConfirm";
import { SearchableSelect } from "@/components/SearchableSelect";

const MODULE = "MATERIAL_CONSUMPTION";
const API = "/api/inventory/consumption";
const FORM = "/dashboard/inventory/consumption";

type Consumption = {
  id: string;
  mcNo: string;
  date: string;
  workOrderNo: string;
  customerName: string;
  issuedByName: string;
  status: "Draft" | "Submitted" | "Void";
  totalAmount: number;
  items: unknown[];
};

const STATUS_STYLES: Record<string, string> = {
  Draft: "bg-slate-100 text-slate-700 border-slate-200",
  Submitted: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Void: "bg-rose-50 text-rose-700 border-rose-200",
};

export default function MaterialConsumptionPage() {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const permissions = session?.user?.permissions;
  const allowCreate = canCreate(permissions, MODULE, role);
  const allowEdit = canEdit(permissions, MODULE, role);

  const [rows, setRows] = useState<Consumption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchRows = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`${API}?${params}`);
      if (!res.ok) throw new Error((await res.json()).error || "Failed to load consumptions");
      setRows(await res.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  // Debounced so typing in the search box does not fire a request per keystroke.
  useEffect(() => {
    const t = setTimeout(fetchRows, 300);
    return () => clearTimeout(t);
  }, [fetchRows]);

  async function transition(row: Consumption, action: "submit" | "void") {
    const verb = action === "submit" ? "Submit" : "Void";
    const warning =
      action === "submit"
        ? `Submit ${row.mcNo}? This will issue the material and reduce stock on hand.`
        : `Void ${row.mcNo}? The issued material will be returned to stock. This cannot be undone.`;
    if (!(await customConfirm(warning))) return;

    const res = await fetch(`${API}/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const body = await res.json();
    if (!res.ok) return toast.error(body.error || `Failed to ${verb.toLowerCase()}`);

    toast.success(`${row.mcNo} ${action === "submit" ? "submitted" : "voided"}`);
    fetchRows();
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-rose-500/10">
            <PackageMinus className="text-rose-600" size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-blue-900">Material Consumption</h1>
            <p className="text-sm text-blue-600">
              Issue raw materials and consumables to a work order. Submitting reduces stock on hand.
            </p>
          </div>
        </div>

        {allowCreate && (
          <Link
            href={`${FORM}/new`}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 rounded-lg shadow-md shadow-rose-500/20 active:scale-95 transition-all duration-200 shrink-0"
          >
            <Plus size={16} /> New Consumption
          </Link>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" size={16} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by MC No, work order, issuer or remark…"
            className="w-full pl-9 pr-3 py-2.5 text-sm bg-white border border-blue-200 rounded-lg focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none"
          />
        </div>
        <SearchableSelect
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 text-sm bg-white border border-blue-200 rounded-lg focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none"
        >
          <option value="">All statuses</option>
          <option value="Draft">Draft</option>
          <option value="Submitted">Submitted</option>
          <option value="Void">Void</option>
        </SearchableSelect>
      </div>

      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-rose-600" />
          <p className="text-sm text-blue-500">Loading consumptions…</p>
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 flex items-center gap-3 text-rose-700">
          <AlertCircle size={18} />
          <p className="text-sm font-medium">{error}</p>
        </div>
      ) : (
        <div className="bg-white border border-blue-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="text-xs text-blue-500 bg-blue-50/50 uppercase tracking-wider border-b border-blue-200">
                <tr>
                  <th className="px-4 py-3">MC No</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Work Order</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Issued By</th>
                  <th className="px-4 py-3 text-center">Items</th>
                  <th className="px-4 py-3 text-right">Total Cost</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-100">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-blue-500">
                      No consumption records found.
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr key={r.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-4 py-3 font-bold text-blue-900">{r.mcNo}</td>
                      <td className="px-4 py-3 text-blue-700">
                        {new Date(r.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-blue-700">{r.workOrderNo}</td>
                      <td
                        className="px-4 py-3 text-blue-700 max-w-[180px] truncate"
                        title={r.customerName}
                      >
                        {r.customerName || "—"}
                      </td>
                      <td className="px-4 py-3 text-blue-700">{r.issuedByName}</td>
                      <td className="px-4 py-3 text-center text-blue-700">{r.items.length}</td>
                      <td className="px-4 py-3 text-right font-medium text-blue-900">
                        ${r.totalAmount.toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_STYLES[r.status]}`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {allowEdit && r.status !== "Void" && (
                            <Link
                              href={`${FORM}/${r.id}`}
                              title={
                                r.status === "Draft"
                                  ? "Edit draft"
                                  : "Edit — saving adjusts stock on hand"
                              }
                              className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-100 rounded-md transition-colors"
                            >
                              <Pencil size={15} />
                            </Link>
                          )}
                          {allowEdit && r.status === "Draft" && (
                            <button
                              onClick={() => transition(r, "submit")}
                              title="Submit — issues material and reduces stock"
                              className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-100 rounded-md transition-colors"
                            >
                              <Check size={15} />
                            </button>
                          )}
                          {allowEdit && r.status === "Submitted" && (
                            <button
                              onClick={() => transition(r, "void")}
                              title="Void — returns material to stock"
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-100 rounded-md transition-colors"
                            >
                              <Ban size={15} />
                            </button>
                          )}
                          {(!allowEdit || r.status === "Void") && (
                            <span className="text-xs text-blue-300">—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
