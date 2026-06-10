"use client";

import React, { useState } from "react";
import Link from "next/link";
import { FileText, Download, Loader2, AlertCircle } from "lucide-react";
import * as XLSX from "xlsx";

export default function WorkOrderCostingReportPage() {
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleExport = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);

      const res = await fetch(`/api/cost-monitoring?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch report data");
      
      const data = await res.json();
      
      if (data.length === 0) {
        throw new Error("No records found for the given criteria.");
      }

      generateExcel(data);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateExcel = (data: any[]) => {
    const ws = XLSX.utils.aoa_to_sheet([]);
    const rows = [];
    
    rows.push(["Work Order Costing Report"]);
    rows.push(["Vision One Pte Ltd"]); 
    
    const now = new Date();
    rows.push([`Generated on ${now.toLocaleDateString("en-GB").replace(/\//g, '-')} ${now.toLocaleTimeString("en-US")}`]);
    rows.push([]);

    rows.push([
      "Work Order No", "Customer Name", "Date", "Status", 
      "Revenue", "Labor Cost", "Material Cost", "Subcon Cost", 
      "Total Cost", "Profit", "Margin (%)"
    ]);

    data.forEach(item => {
      rows.push([
        item.workOrderNo,
        item.customerName,
        item.date ? new Date(item.date).toLocaleDateString("en-GB").replace(/\//g, '-') : "",
        item.status,
        Number(item.revenue),
        Number(item.laborCost),
        Number(item.materialCost),
        Number(item.subconCost),
        Number(item.totalCost),
        Number(item.profit),
        Number(item.margin)
      ]);
    });

    XLSX.utils.sheet_add_aoa(ws, rows, { origin: "A1" });

    ws['!cols'] = [
      { wch: 20 }, { wch: 30 }, { wch: 15 }, { wch: 15 }, 
      { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, 
      { wch: 15 }, { wch: 15 }, { wch: 15 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "WO Costing Report");
    XLSX.writeFile(wb, `WO_Costing_Report_${now.getTime()}.xlsx`);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 relative">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-6 border-b border-blue-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-blue-400 font-semibold tracking-wider uppercase mb-1">
            <Link href="/dashboard" className="hover:text-blue-600">Dashboard</Link>
            <span>/</span>
            <span className="text-blue-500">Production</span>
            <span>/</span>
            <span className="text-blue-500">WO Costing Report</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600">
              <FileText size={20} />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-blue-900">Work Order Costing Report</h2>
              <p className="text-sm text-blue-500 mt-0.5">Filter and export work order cost tracking data to Excel.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-blue-200 p-6 rounded-xl shadow-sm">
        <h3 className="text-sm font-bold text-blue-900 mb-4 uppercase tracking-wide border-b border-blue-100 pb-2">
          Search Criteria
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-blue-700">Search</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="WO No or Customer Name"
              className="w-full px-3 py-2 text-sm bg-blue-50 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
        </div>

        {errorMsg && (
          <div className="mt-6 bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center gap-3 text-rose-700">
            <AlertCircle size={18} />
            <p className="text-sm font-medium">{errorMsg}</p>
          </div>
        )}

        <div className="mt-8 flex justify-end">
          <button
            onClick={handleExport}
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
            {loading ? "Generating..." : "Generate Report (Excel)"}
          </button>
        </div>
      </div>
    </div>
  );
}
