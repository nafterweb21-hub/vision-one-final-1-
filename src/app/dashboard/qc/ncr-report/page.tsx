"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { FileText, Download, Loader2, AlertCircle } from "lucide-react";
import * as XLSX from "xlsx";

export default function NcrReportPage() {
  const [customer, setCustomer] = useState("");
  const [workOrderNo, setWorkOrderNo] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [inProcessDescription, setInProcessDescription] = useState("");
  const [mainProcess, setMainProcess] = useState("");
  const [routingProcess, setRoutingProcess] = useState("");
  const [department, setDepartment] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [customers, setCustomers] = useState<{ id: string; customerName: string }[]>([]);
  const [mainProcessesList, setMainProcessesList] = useState<{ id: string; process: string }[]>([]);
  const [routingProcessesList, setRoutingProcessesList] = useState<{ id: string; routingProcess: string }[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/sales/quotation/form-data").then(res => res.json()),
      fetch("/api/profiles/main-processes").then(res => res.json()),
      fetch("/api/profiles/process-profiles").then(res => res.json()),
    ])
      .then(([formData, mpData, rpData]) => {
        setCustomers(Array.isArray(formData?.customers) ? formData.customers : []);
        setMainProcessesList(Array.isArray(mpData) ? mpData : []);
        setRoutingProcessesList(Array.isArray(rpData) ? rpData : []);
      })
      .catch(err => console.error("Failed to load dropdown data:", err));
  }, []);

  const handleExport = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const params = new URLSearchParams();
      if (customer) params.append("customer", customer);
      if (workOrderNo) params.append("workOrderNo", workOrderNo);
      if (jobDescription) params.append("jobDescription", jobDescription);
      if (inProcessDescription) params.append("inProcessDescription", inProcessDescription);
      if (mainProcess) params.append("mainProcess", mainProcess);
      if (routingProcess) params.append("routingProcess", routingProcess);
      if (department) params.append("department", department);

      const res = await fetch(`/api/reports/ncr-report?${params.toString()}`);
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
    rows.push(["NCR Report"]);
    
    // Row 2: Company
    rows.push(["Vision One Pte Ltd"]); // Matches the mockup company name
    
    // Row 3: Generated Date
    const now = new Date();
    rows.push([`Generated on ${now.toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-')} ${now.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}`]);
    
    // Row 4: Super Headers
    rows.push([
      "", "", "", "", "", "", "", "", "", "", "", "", // Customer up to Problem
      "Disposition Decision (Qty)", "", "", "", "", // Rework up to Other Qty
      "", "", "", "", "" // Customer Acceptance up to Action Taken
    ]);

    // Row 5: Column Headers
    rows.push([
      "Customer", "Customer PO Ref", "WO No", "WO Date", "Job Description", "In-Process Description", "Main Process", "Routing Process", "NCR Qty", "Dept", "Responsible Party", "Problem",
      "Rework", "Use-As-Is", "Scrap", "Other Decision", "Other Qty",
      "Customer Acceptance for Use-As-Is", "Failure Mode", "Root Cause", "Corrective / Preventive Action", "Action Taken"
    ]);

    // Data Rows
    data.forEach(item => {
      rows.push([
        item.customer,
        item.customerPoRef,
        item.woNo,
        item.woDate ? new Date(item.woDate).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-') : "",
        item.jobDescription,
        item.inProcessDescription,
        item.mainProcess,
        item.routingProcess,
        item.ncrQty,
        item.department,
        item.responsibleParty,
        item.problemDescription,
        item.reworkQty > 0 ? item.reworkQty : "",
        item.useAsIsQty > 0 ? item.useAsIsQty : "",
        item.scrapQty > 0 ? item.scrapQty : "",
        item.otherDecision,
        item.otherQty > 0 ? item.otherQty : "",
        item.customerAcceptance,
        item.failureMode,
        item.rootCause,
        item.correctiveAction,
        item.actionTaken
      ]);
    });

    XLSX.utils.sheet_add_aoa(ws, rows, { origin: "A1" });

    // Merges
    ws['!merges'] = [
      { s: { r: 3, c: 12 }, e: { r: 3, c: 16 } }, // Disposition Decision (Qty) spans across Rework, Use-As-Is, Scrap, Other Decision, Other Qty
    ];

    // Basic Column Widths
    ws['!cols'] = [
      { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 8 }, { wch: 10 }, { wch: 15 }, { wch: 25 },
      { wch: 8 }, { wch: 10 }, { wch: 8 }, { wch: 15 }, { wch: 10 },
      { wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 25 }, { wch: 15 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "NCR Report");
    XLSX.writeFile(wb, `NCR_Report_${now.getTime()}.xlsx`);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 relative">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-6 border-b border-blue-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-blue-400 font-semibold tracking-wider uppercase mb-1">
            <Link href="/dashboard" className="hover:text-blue-600">Dashboard</Link>
            <span>/</span>
            <span className="text-blue-500">QC</span>
            <span>/</span>
            <span className="text-blue-500">NCR Report</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-teal-500/10 text-teal-600">
              <FileText size={20} />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-blue-900">NCR Report</h2>
              <p className="text-sm text-blue-500 mt-0.5">Filter and export Non-Conformance records to Excel.</p>
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
            <label className="text-xs font-semibold text-blue-700">Customer</label>
            <select
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-blue-50 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            >
              <option value="">All Customers</option>
              {customers.map((c) => (
                <option key={c.id} value={c.customerName}>{c.customerName}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-blue-700">Work Order</label>
            <input
              type="text"
              value={workOrderNo}
              onChange={(e) => setWorkOrderNo(e.target.value)}
              placeholder="WO No"
              className="w-full px-3 py-2 text-sm bg-blue-50 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-blue-700">Job Description</label>
            <input
              type="text"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="e.g. K1 Assy"
              className="w-full px-3 py-2 text-sm bg-blue-50 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-blue-700">In-Process Description</label>
            <input
              type="text"
              value={inProcessDescription}
              onChange={(e) => setInProcessDescription(e.target.value)}
              placeholder="e.g. Component"
              className="w-full px-3 py-2 text-sm bg-blue-50 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-blue-700">Main Process</label>
            <select
              value={mainProcess}
              onChange={(e) => setMainProcess(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-blue-50 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            >
              <option value="">All Main Processes</option>
              {mainProcessesList.map((mp) => (
                <option key={mp.id} value={mp.process}>{mp.process}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-blue-700">Routing Process</label>
            <select
              value={routingProcess}
              onChange={(e) => setRoutingProcess(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-blue-50 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            >
              <option value="">All Routing Processes</option>
              {routingProcessesList.map((rp) => (
                <option key={rp.id} value={rp.routingProcess}>{rp.routingProcess}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-blue-700">Department</label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="e.g. Welding"
              className="w-full px-3 py-2 text-sm bg-blue-50 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
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
            className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
            {loading ? "Generating..." : "Generate Report (Excel)"}
          </button>
        </div>
      </div>
    </div>
  );
}
