"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { FileText, Download, Loader2, AlertCircle, Search } from "lucide-react";
import * as XLSX from "xlsx";

export default function SalesReportPage() {
  const [soNo, setSoNo] = useState("");
  const [soDateFrom, setSoDateFrom] = useState("");
  const [soDateTo, setSoDateTo] = useState("");
  const [customer, setCustomer] = useState("");
  const [salesperson, setSalesperson] = useState("");
  const [partNo, setPartNo] = useState("");
  const [partDescription, setPartDescription] = useState("");
  const [workOrderNo, setWorkOrderNo] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [reportData, setReportData] = useState<any[] | null>(null);

  const [customers, setCustomers] = useState<{ id: string; customerName: string }[]>([]);
  const [employees, setEmployees] = useState<{ id: string; name: string }[]>([]);
  const [finishedGoods, setFinishedGoods] = useState<{ id: string; partNo: string; description: string }[]>([]);

  useEffect(() => {
    fetch("/api/sales/quotation/form-data")
      .then((res) => res.json())
      .then((data) => {
        setCustomers(data.customers || []);
        setEmployees(data.employees || []);
        setFinishedGoods(data.finishedGoods || []);
      })
      .catch((err) => console.error("Failed to load dropdown data:", err));

    const savedFilters = localStorage.getItem("salesReportFilters");
    if (savedFilters) {
      try {
        const p = JSON.parse(savedFilters);
        if (p.soNo) setSoNo(p.soNo);
        if (p.soDateFrom) setSoDateFrom(p.soDateFrom);
        if (p.soDateTo) setSoDateTo(p.soDateTo);
        if (p.customer) setCustomer(p.customer);
        if (p.salesperson) setSalesperson(p.salesperson);
        if (p.partNo) setPartNo(p.partNo);
        if (p.partDescription) setPartDescription(p.partDescription);
        if (p.workOrderNo) setWorkOrderNo(p.workOrderNo);
      } catch (e) {
        console.error("Failed to parse saved filters:", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("salesReportFilters", JSON.stringify({
      soNo, soDateFrom, soDateTo, customer, salesperson, partNo, partDescription, workOrderNo
    }));
  }, [soNo, soDateFrom, soDateTo, customer, salesperson, partNo, partDescription, workOrderNo]);

  const handleSearch = async () => {
    setLoading(true);
    setErrorMsg("");
    setReportData(null);
    try {
      const params = new URLSearchParams();
      if (soNo) params.append("soNo", soNo);
      if (soDateFrom) params.append("soDateFrom", soDateFrom);
      if (soDateTo) params.append("soDateTo", soDateTo);
      if (customer) params.append("customer", customer);
      if (salesperson) params.append("salesperson", salesperson);
      if (partNo) params.append("partNo", partNo);
      if (partDescription) params.append("partDescription", partDescription);
      if (workOrderNo) params.append("workOrderNo", workOrderNo);

      const res = await fetch(`/api/reports/sales-report?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch report data");
      
      const data = await res.json();
      
      if (data.length === 0) {
        throw new Error("No records found for the given criteria.");
      }

      setReportData(data);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const params = new URLSearchParams();
      if (soNo) params.append("soNo", soNo);
      if (soDateFrom) params.append("soDateFrom", soDateFrom);
      if (soDateTo) params.append("soDateTo", soDateTo);
      if (customer) params.append("customer", customer);
      if (salesperson) params.append("salesperson", salesperson);
      if (partNo) params.append("partNo", partNo);
      if (partDescription) params.append("partDescription", partDescription);
      if (workOrderNo) params.append("workOrderNo", workOrderNo);

      const res = await fetch(`/api/reports/sales-report?${params.toString()}`);
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
    
    // Build rows
    const rows = [];
    
    // Row 1: Title
    rows.push(["Sales Report"]);
    
    // Row 2: Company
    rows.push(["Vision One Pte Ltd"]); // Can be dynamic if needed
    
    // Row 3: Generated Date
    const now = new Date();
    rows.push([`Generated on ${now.toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-')} ${now.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`]);
    
    // Row 4: Super Headers
    rows.push([
      "", "", "", "", "", "", "", "", "", "", // Blank under SO No up to Tax Rate
      "Amt", "", "", // Before Tax, Tax, Aft Tax
      "", "Item", "", "", "", "", "", "", "", // Part No up to Material Spec
      "", "Batch", "", // Batch Qty, Delivery Date, WO No
      "", "Work Order", // WO Status, QC Acceptance
      "Qty", "", // Qty Delivered, Not Delivered
      "Amt", "" // Amt Delivered, Not Delivered
    ]);

    // Row 5: Column Headers
    rows.push([
      "SO No", "SO Date", "Salesperson", "Customer", "Customer PO Ref", "Project Code", "Curr", "Exch Rate", "Tax Type", "Tax Rate",
      "Before Tax", "Tax", "Aft Tax",
      "Part No", "Description", "Qty", "UOM", "Unit Price", "Amt", "Internal Quo No", "Vendor Material No", "Material Spec",
      "Qty", "Delivery Date", "WO No",
      "WO Status", "QC Acceptance",
      "Delivered", "Not Delivered",
      "Delivered", "Not Delivered"
    ]);

    // Data Rows
    data.forEach(item => {
      rows.push([
        item.soNo,
        item.soDate ? new Date(item.soDate).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-') : "",
        item.salesperson,
        item.customer,
        item.customerPoRef,
        item.projectCode,
        item.curr,
        item.exchRate,
        item.taxType,
        item.taxRate,
        item.beforeTax,
        item.tax,
        item.aftTax,
        item.partNo,
        item.description,
        item.qty,
        item.uom,
        item.unitPrice,
        item.amt,
        item.internalQuoNo,
        item.vendorMaterialNo,
        item.materialSpec,
        item.batchQty,
        item.deliveryDate ? new Date(item.deliveryDate).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-') : "",
        item.woNo,
        item.woStatus,
        item.qcAcceptance,
        item.qtyDelivered,
        item.qtyNotDelivered,
        item.amtDelivered,
        item.amtNotDelivered
      ]);
    });

    XLSX.utils.sheet_add_aoa(ws, rows, { origin: "A1" });

    // Merges
    ws['!merges'] = [
      { s: { r: 3, c: 10 }, e: { r: 3, c: 12 } }, // Amt (Before Tax to Aft Tax)
      { s: { r: 3, c: 13 }, e: { r: 3, c: 21 } }, // Item
      { s: { r: 3, c: 22 }, e: { r: 3, c: 24 } }, // Batch
      { s: { r: 3, c: 25 }, e: { r: 3, c: 26 } }, // Work Order
      { s: { r: 3, c: 27 }, e: { r: 3, c: 28 } }, // Qty (Delivered/Not Delivered)
      { s: { r: 3, c: 29 }, e: { r: 3, c: 30 } }, // Amt (Delivered/Not Delivered)
    ];

    // Some basic col widths
    ws['!cols'] = [
      { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 6 }, { wch: 10 }, { wch: 10 }, { wch: 10 },
      { wch: 12 }, { wch: 10 }, { wch: 12 },
      { wch: 15 }, { wch: 25 }, { wch: 8 }, { wch: 6 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
      { wch: 8 }, { wch: 12 }, { wch: 15 },
      { wch: 15 }, { wch: 15 },
      { wch: 12 }, { wch: 12 },
      { wch: 12 }, { wch: 12 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sales Report");
    XLSX.writeFile(wb, `Sales_Report_${now.getTime()}.xlsx`);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 relative">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-6 border-b border-blue-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-blue-400 font-semibold tracking-wider uppercase mb-1">
            <Link href="/dashboard" className="hover:text-blue-600">Dashboard</Link>
            <span>/</span>
            <span className="text-blue-500">Sales</span>
            <span>/</span>
            <span className="text-blue-500">Sales Report</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600">
              <FileText size={20} />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-blue-900">Sales Report</h2>
              <p className="text-sm text-blue-500 mt-0.5">Filter and export sales data to Excel.</p>
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
            <label className="text-xs font-semibold text-blue-700">SO No</label>
            <input
              type="text"
              value={soNo}
              onChange={(e) => setSoNo(e.target.value)}
              placeholder="e.g. 800002"
              className="w-full px-3 py-2 text-sm bg-blue-50 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-blue-700">SO Date (From)</label>
            <input
              type="date"
              value={soDateFrom}
              onChange={(e) => setSoDateFrom(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-blue-50 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-blue-700">SO Date (To)</label>
            <input
              type="date"
              value={soDateTo}
              onChange={(e) => setSoDateTo(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-blue-50 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-blue-700">Customer</label>
            <select
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-blue-50 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="">All Customers</option>
              {customers.map((c) => (
                <option key={c.id} value={c.customerName}>{c.customerName}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-blue-700">Salesperson</label>
            <select
              value={salesperson}
              onChange={(e) => setSalesperson(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-blue-50 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="">All Salespersons</option>
              {employees.map((e) => (
                <option key={e.id} value={e.name}>{e.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-blue-700">Part No</label>
            <select
              value={partNo}
              onChange={(e) => setPartNo(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-blue-50 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="">All Parts</option>
              {finishedGoods.map((fg) => (
                <option key={fg.id} value={fg.partNo || ""}>{fg.partNo ? `${fg.partNo} - ${fg.description}` : fg.description}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-blue-700">Part Description</label>
            <input
              type="text"
              value={partDescription}
              onChange={(e) => setPartDescription(e.target.value)}
              placeholder="Description"
              className="w-full px-3 py-2 text-sm bg-blue-50 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-blue-700">Work Order No</label>
            <input
              type="text"
              value={workOrderNo}
              onChange={(e) => setWorkOrderNo(e.target.value)}
              placeholder="WO No"
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

        <div className="mt-8 flex justify-end gap-3">
          <button
            onClick={handleSearch}
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 rounded-lg shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : <Search size={16} />}
            Search
          </button>
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

      {reportData && reportData.length > 0 && (
        <div className="bg-white border border-blue-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600 whitespace-nowrap">
              <thead className="bg-blue-50/50 text-blue-900 border-b border-blue-100 text-xs uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-4 py-3">SO No</th>
                  <th className="px-4 py-3">SO Date</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Salesperson</th>
                  <th className="px-4 py-3">Customer PO Ref</th>
                  <th className="px-4 py-3">Item Part No</th>
                  <th className="px-4 py-3">Item Description</th>
                  <th className="px-4 py-3 text-right">Qty</th>
                  <th className="px-4 py-3 text-right">Unit Price</th>
                  <th className="px-4 py-3 text-right">Amt</th>
                  <th className="px-4 py-3">WO No</th>
                  <th className="px-4 py-3">WO Status</th>
                  <th className="px-4 py-3 text-right">Delivered Qty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reportData.map((row, i) => (
                  <tr key={i} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-blue-900">{row.soNo}</td>
                    <td className="px-4 py-3">{row.soDate ? new Date(row.soDate).toLocaleDateString() : ""}</td>
                    <td className="px-4 py-3">{row.customer}</td>
                    <td className="px-4 py-3">{row.salesperson}</td>
                    <td className="px-4 py-3">{row.customerPoRef}</td>
                    <td className="px-4 py-3">{row.partNo}</td>
                    <td className="px-4 py-3">{row.description}</td>
                    <td className="px-4 py-3 text-right">{row.qty}</td>
                    <td className="px-4 py-3 text-right">{row.unitPrice}</td>
                    <td className="px-4 py-3 text-right">{row.amt}</td>
                    <td className="px-4 py-3">{row.woNo}</td>
                    <td className="px-4 py-3">{row.woStatus}</td>
                    <td className="px-4 py-3 text-right">{row.qtyDelivered}</td>
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
