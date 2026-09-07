"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CalendarClock,
  Download,
  Loader2,
  RefreshCw,
} from "lucide-react";
import * as XLSX from "xlsx";
import { SearchableSelect } from "@/components/SearchableSelect";

/**
 * Monthly Schedule Report — `docs/spec/reports.md`.
 *
 * Unlike the other reports (which are export-only), the spec calls for a live
 * view that auto-refreshes every five minutes, so this renders the table on
 * screen and offers the Excel export as a secondary action.
 */

const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

type ScheduleState = "Completed" | "Overdue" | "Due Soon" | "On Track";

type ScheduleRow = {
  id: string;
  workOrderNo: string;
  woDeliveryDate: string | null;
  customerName: string;
  projectCode: string;
  jobDescription: string;
  inProcessDescription: string;
  sn: string;
  sequence: number;
  mainProcess: string;
  routingProcess: string;
  targetCompletionDate: string;
  fullyReceived: boolean;
  status: string;
  remark: string;
  scheduleState: ScheduleState;
};

type ReportPayload = {
  generatedAt: string;
  summary: {
    total: number;
    overdue: number;
    dueSoon: number;
    onTrack: number;
    completed: number;
  };
  rows: ScheduleRow[];
};

const STATE_STYLES: Record<ScheduleState, string> = {
  Overdue: "bg-rose-100 text-rose-700 border-rose-200",
  "Due Soon": "bg-amber-100 text-amber-700 border-amber-200",
  "On Track": "bg-emerald-100 text-emerald-700 border-emerald-200",
  Completed: "bg-slate-100 text-slate-600 border-slate-200",
};

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function fmtDate(value: string | null | undefined): string {
  if (!value) return "";
  return new Date(value)
    .toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    .replace(/ /g, "-");
}

export default function MonthlyScheduleReportPage() {
  const [month, setMonth] = useState(currentMonth);
  const [workOrderNo, setWorkOrderNo] = useState("");
  const [customer, setCustomer] = useState("");
  const [state, setState] = useState("");

  const [data, setData] = useState<ReportPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Filters are read inside an interval callback; a ref keeps the interval from
  // being torn down and recreated on every keystroke. Synced in an effect
  // rather than during render, which React forbids.
  const filtersRef = useRef({ month, workOrderNo, customer, state });
  useEffect(() => {
    filtersRef.current = { month, workOrderNo, customer, state };
  }, [month, workOrderNo, customer, state]);

  const load = useCallback(async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const current = filtersRef.current;
      const params = new URLSearchParams();
      if (current.month) params.append("month", current.month);
      if (current.workOrderNo) params.append("workOrderNo", current.workOrderNo);
      if (current.customer) params.append("customer", current.customer);
      if (current.state) params.append("state", current.state);

      const res = await fetch(
        `/api/reports/monthly-schedule-report?${params.toString()}`,
        { cache: "no-store" },
      );
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.error ?? "Failed to load schedule");

      setData(payload as ReportPayload);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to load schedule");
    } finally {
      setLoading(false);
    }
  }, []);

  // Spec: "Refresh: auto every 5 minutes."
  useEffect(() => {
    let cancelled = false;
    const run = () => {
      if (!cancelled) load();
    };

    // Deferred rather than called inline so the effect body does not enter a
    // setState synchronously, which would cascade an extra render.
    const initial = setTimeout(run, 0);
    const timer = setInterval(run, REFRESH_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearTimeout(initial);
      clearInterval(timer);
    };
  }, [load]);

  const rows = useMemo(() => data?.rows ?? [], [data]);

  const handleExport = () => {
    if (rows.length === 0) {
      setErrorMsg("Nothing to export for the current filters.");
      return;
    }

    const now = new Date();
    const aoa: (string | number)[][] = [
      ["Monthly Schedule Report"],
      ["Vision One Pte Ltd"],
      [`Month: ${month || "All"}`],
      [
        `Generated on ${fmtDate(now.toISOString())} ${now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })}`,
      ],
      [],
      [
        "Work Order No",
        "Customer",
        "Project Code",
        "Job Description",
        "In-Process",
        "SN",
        "Seq",
        "Main Process",
        "Routing Process",
        "Target Completion",
        "WO Delivery Date",
        "Fully Received",
        "Status",
        "Schedule State",
        "Remark",
      ],
    ];

    rows.forEach((r) => {
      aoa.push([
        r.workOrderNo,
        r.customerName,
        r.projectCode,
        r.jobDescription,
        r.inProcessDescription,
        r.sn,
        r.sequence,
        r.mainProcess,
        r.routingProcess,
        fmtDate(r.targetCompletionDate),
        fmtDate(r.woDeliveryDate),
        r.fullyReceived ? "Yes" : "No",
        r.status,
        r.scheduleState,
        r.remark,
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws["!cols"] = [
      { wch: 18 }, { wch: 28 }, { wch: 14 }, { wch: 30 }, { wch: 26 },
      { wch: 8 }, { wch: 6 }, { wch: 20 }, { wch: 22 }, { wch: 18 },
      { wch: 18 }, { wch: 14 }, { wch: 18 }, { wch: 15 }, { wch: 30 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Monthly Schedule");
    XLSX.writeFile(wb, `Monthly_Schedule_Report_${month || "all"}.xlsx`);
  };

  const summary = data?.summary;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-6 border-b border-blue-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-blue-400 font-semibold tracking-wider uppercase mb-1">
            <Link href="/dashboard" className="hover:text-blue-600">Dashboard</Link>
            <span>/</span>
            <span className="text-blue-500">Production</span>
            <span>/</span>
            <span className="text-blue-500">Monthly Schedule Report</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600">
              <CalendarClock size={20} />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-blue-900">Monthly Schedule Report</h2>
              <p className="text-sm text-blue-500 mt-0.5">
                Target completion dates of each routing process per work order. Refreshes every 5 minutes.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-blue-700 bg-white border border-blue-200 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
          <button
            onClick={handleExport}
            disabled={loading || rows.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={16} />
            Export Excel
          </button>
        </div>
      </div>

      <div className="bg-white border border-blue-200 p-6 rounded-xl shadow-sm">
        <h3 className="text-sm font-bold text-blue-900 mb-4 uppercase tracking-wide border-b border-blue-100 pb-2">
          Search Criteria
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-blue-700">Month</label>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-blue-50 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-blue-700">Work Order No</label>
            <input
              type="text"
              value={workOrderNo}
              onChange={(e) => setWorkOrderNo(e.target.value)}
              placeholder="e.g. WO-2023-001"
              className="w-full px-3 py-2 text-sm bg-blue-50 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-blue-700">Customer</label>
            <input
              type="text"
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              placeholder="Customer Name"
              className="w-full px-3 py-2 text-sm bg-blue-50 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-blue-700">Schedule State</label>
            <SearchableSelect
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-blue-50 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="">All</option>
              <option value="Overdue">Overdue</option>
              <option value="Due Soon">Due Soon</option>
              <option value="On Track">On Track</option>
              <option value="Completed">Completed</option>
            </SearchableSelect>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-md transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : null}
            Apply Filters
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center gap-3 text-rose-700">
          <AlertCircle size={18} />
          <p className="text-sm font-medium">{errorMsg}</p>
        </div>
      )}

      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {([
            ["Total", summary.total, "text-blue-900"],
            ["Overdue", summary.overdue, "text-rose-600"],
            ["Due Soon", summary.dueSoon, "text-amber-600"],
            ["On Track", summary.onTrack, "text-emerald-600"],
            ["Completed", summary.completed, "text-slate-500"],
          ] as const).map(([label, value, tone]) => (
            <div key={label} className="bg-white border border-blue-200 rounded-xl p-4 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wide text-blue-500">{label}</div>
              <div className={`text-2xl font-bold mt-1 ${tone}`}>{value}</div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white border border-blue-200 rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-3 border-b border-blue-100">
          <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wide">Schedule</h3>
          {data && (
            <span className="text-xs text-blue-400">
              Last updated {new Date(data.generatedAt).toLocaleTimeString("en-US")}
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-blue-50 text-blue-800">
              <tr>
                {[
                  "Work Order No", "Customer", "In-Process", "SN", "Main Process",
                  "Routing Process", "Target Completion", "Received", "Status", "State",
                ].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-50">
              {rows.length === 0 && !loading && (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-blue-400">
                    No routing processes scheduled for these criteria.
                  </td>
                </tr>
              )}
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-blue-50/40">
                  <td className="px-4 py-2.5 font-semibold text-blue-900 whitespace-nowrap">{r.workOrderNo}</td>
                  <td className="px-4 py-2.5 text-slate-700">{r.customerName}</td>
                  <td className="px-4 py-2.5 text-slate-700">{r.inProcessDescription}</td>
                  <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap">{r.sn}</td>
                  <td className="px-4 py-2.5 text-slate-700">{r.mainProcess}</td>
                  <td className="px-4 py-2.5 text-slate-700">{r.routingProcess}</td>
                  <td className="px-4 py-2.5 text-slate-700 whitespace-nowrap">{fmtDate(r.targetCompletionDate)}</td>
                  <td className="px-4 py-2.5 text-slate-500">{r.fullyReceived ? "Yes" : "No"}</td>
                  <td className="px-4 py-2.5 text-slate-700 whitespace-nowrap">{r.status}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    <span className={`inline-block px-2 py-0.5 rounded-full border text-xs font-semibold ${STATE_STYLES[r.scheduleState]}`}>
                      {r.scheduleState}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
