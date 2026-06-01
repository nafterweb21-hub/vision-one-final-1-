"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Loader2, AlertCircle, FileText, Download, Filter } from "lucide-react";
import * as XLSX from "xlsx";

type Company = {
  id: string;
  companyName: string;
};

type ReportRow = {
  id: string;
  partNo: string;
  description: string;
  category: string;
  internalUom: string;
  onOrderQty: number;
  netReceivedQty: number;
  demandQty: number;
  balance: number;
};

export default function InventoryReportPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [filterCompany, setFilterCompany] = useState("");
  const [filterPartNo, setFilterPartNo] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [filterShortfall, setFilterShortfall] = useState(false);

  useEffect(() => {
    // Fetch companies
    fetch("/api/purchasing/purchase-order/form-data") // We assume this exists or use a generic one
      .then(res => res.json())
      .then(data => {
        if (data.companies) setCompanies(data.companies);
      })
      .catch(console.error);
  }, []);

  async function fetchReport() {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (filterCompany) params.append("companyId", filterCompany);
      if (filterPartNo) params.append("partNo", filterPartNo);
      if (filterStartDate) params.append("startDate", filterStartDate);
      if (filterEndDate) params.append("endDate", filterEndDate);
      if (filterShortfall) params.append("shortfallOnly", "true");

      const res = await fetch(`/api/inventory/report?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load report");
      setRows(await res.json());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleExport() {
    if (rows.length === 0) return alert("No data to export");
    const exportData = rows.map((r, i) => ({
      "SN": i + 1,
      "Part No": r.partNo,
      "Description": r.description,
      "Category": r.category,
      "Internal UOM": r.internalUom,
      "Total On-Order Qty": r.onOrderQty,
      "Net Received Qty": r.netReceivedQty,
      "Total Demand Qty": r.demandQty,
      "Balance": r.balance,
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory");
    XLSX.writeFile(workbook, `Inventory_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-6 border-b border-blue-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-blue-400 font-semibold tracking-wider uppercase mb-1">
            <Link href="/dashboard" className="hover:text-blue-600">Dashboard</Link>
            <span>/</span>
            <span className="text-blue-500">Inventory</span>
            <span>/</span>
            <span className="text-blue-500">Report</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600">
              <FileText size={20} />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-blue-900">Inventory Report</h2>
              <p className="text-sm text-blue-500 mt-0.5">Generate and export inventory reports.</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleExport}
          disabled={rows.length === 0}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-lg shadow-md active:scale-95 transition-all duration-200 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download size={16} /> Export to Excel
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-blue-200 p-4 rounded-xl shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-blue-900 border-b border-blue-100 pb-2">
          <Filter size={16} className="text-blue-500" /> Report Filters
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-blue-900 mb-1">Company</label>
            <select
              value={filterCompany}
              onChange={e => setFilterCompany(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-blue-50 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="">All Companies</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.companyName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-blue-900 mb-1">Part No / Description</label>
            <input
              type="text"
              value={filterPartNo}
              onChange={e => setFilterPartNo(e.target.value)}
              placeholder="Search..."
              className="w-full px-3 py-2 text-sm bg-blue-50 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-blue-900 mb-1">Transaction Date Range</label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={filterStartDate}
                onChange={e => setFilterStartDate(e.target.value)}
                className="w-full px-2 py-2 text-xs bg-blue-50 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <span className="text-blue-400">to</span>
              <input
                type="date"
                value={filterEndDate}
                onChange={e => setFilterEndDate(e.target.value)}
                className="w-full px-2 py-2 text-xs bg-blue-50 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex flex-col justify-end">
            <label className="flex items-center gap-2 cursor-pointer mb-2">
              <input
                type="checkbox"
                checked={filterShortfall}
                onChange={e => setFilterShortfall(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-blue-300 focus:ring-blue-500"
              />
              <span className="text-sm font-bold text-blue-900">Shortfall Only (Balance &lt; 0)</span>
            </label>
            <button
              onClick={fetchReport}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm transition-colors"
            >
              <Search size={16} /> Generate Report
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm text-blue-500">Generating report...</p>
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 flex items-center gap-3 text-rose-700">
          <AlertCircle size={18} />
          <p className="text-sm font-medium">{error}</p>
        </div>
      ) : (
        <div className="bg-white border border-blue-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-blue-100 bg-blue-50/50 flex justify-between items-center">
            <h3 className="font-bold text-blue-900">Report Results</h3>
            <span className="text-xs font-bold text-blue-500 bg-white px-2 py-1 rounded-md border border-blue-200 shadow-sm">{rows.length} records</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="text-xs text-blue-500 bg-white uppercase tracking-wider border-b border-blue-200">
                <tr>
                  <th className="px-4 py-3">SN</th>
                  <th className="px-4 py-3">Part No</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3 text-right">On-Order Qty</th>
                  <th className="px-4 py-3 text-right">Net Received</th>
                  <th className="px-4 py-3 text-right">Demand Qty</th>
                  <th className="px-4 py-3 text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-100">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-blue-500">
                      No data to display. Click "Generate Report".
                    </td>
                  </tr>
                ) : rows.map((r, i) => (
                  <tr key={r.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-4 py-3 text-blue-500">{i + 1}</td>
                    <td className="px-4 py-3 font-bold text-blue-900">{r.partNo || "—"}</td>
                    <td className="px-4 py-3 text-blue-700 max-w-[250px] truncate" title={r.description}>{r.description}</td>
                    <td className="px-4 py-3 text-blue-700">{r.category}</td>
                    <td className="px-4 py-3 text-right text-blue-700">{r.onOrderQty.toFixed(2)} <span className="text-[10px]">{r.internalUom}</span></td>
                    <td className="px-4 py-3 text-right text-emerald-700 font-medium">{r.netReceivedQty.toFixed(2)} <span className="text-[10px]">{r.internalUom}</span></td>
                    <td className="px-4 py-3 text-right text-rose-700">{r.demandQty.toFixed(2)} <span className="text-[10px]">{r.internalUom}</span></td>
                    <td className={`px-4 py-3 text-right font-bold ${r.balance < 0 ? "text-rose-600" : "text-blue-900"}`}>
                      {r.balance.toFixed(2)} <span className="text-[10px]">{r.internalUom}</span>
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
