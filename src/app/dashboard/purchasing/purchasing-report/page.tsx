"use client";
import { SearchableSelect } from "@/components/SearchableSelect";
import React, { useState } from "react";
import Link from "next/link";
import { FileText, Download, Loader2, AlertCircle } from "lucide-react";
import * as XLSX from "xlsx";
export default function PurchasingReportPage() {
  const [company, setCompany] = useState("");
  const [poNo, setPoNo] = useState("");
  const [poStatus, setPoStatus] = useState("");
  const [poDateFrom, setPoDateFrom] = useState("");
  const [poDateTo, setPoDateTo] = useState("");
  const [supplier, setSupplier] = useState("");
  const [partNo, setPartNo] = useState("");
  const [partDescription, setPartDescription] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [companies, setCompanies] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);

  React.useEffect(() => {
    fetch("/api/purchasing/purchase-order/form-data")
      .then((res) => res.json())
      .then((data) => {
        setCompanies(Array.isArray(data?.companies) ? data.companies : []);
        setSuppliers(Array.isArray(data?.suppliers) ? data.suppliers : []);
        setMaterials(Array.isArray(data?.materials) ? data.materials : []);
      })
      .catch((err) => console.error("Failed to load dropdown data:", err));
  }, []);

  const handleExport = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const params = new URLSearchParams();
      if (company) params.append("company", company);
      if (poNo) params.append("poNo", poNo);
      if (poStatus) params.append("poStatus", poStatus);
      if (poDateFrom) params.append("poDateFrom", poDateFrom);
      if (poDateTo) params.append("poDateTo", poDateTo);
      if (supplier) params.append("supplier", supplier);
      if (partNo) params.append("partNo", partNo);
      if (partDescription) params.append("partDescription", partDescription);

      const res = await fetch(`/api/reports/purchasing-report?${params.toString()}`);
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
    // Build rows
    const rows = [];
    
    // Row 1: Title
    rows.push(["Purchasing Report"]);
    
    // Row 2: Generated Date
    const now = new Date();
    rows.push([`Generated on ${now.toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-')} ${now.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}`]);
    
    // Row 3: Super Headers
    rows.push([
      "", "", "", "", "", "", "", "", "", "", // Up to Currency
      "Amt", "", "", "", "", // Before Tax to Aft Tax
      "", "", "", "", "", "", "", "", "", "", ""
    ]);

    // Row 4: Column Headers
    rows.push([
      "Company", "PO No", "PO Date", "PO Status", "Purchaser", "Supplier", "WO No", "PR No", "Currency", "Exch Rate",
      "Before Tax", "Tax Type", "Tax Rate", "Tax Amt", "Aft Tax",
      "Part No", "Descr", "UOM", "Qty", "Unit Price", "Amt",
      "Total Received", "Total Returned", "NETT Received", "Outstanding Not Delivered", "Deliver Date"
    ]);

    // Used to track totals for footer
    let sumBeforeTax = 0;
    let sumTaxAmt = 0;
    let sumAftTax = 0;

    // To prevent summing duplicate PO totals (since PO sums are attached to every item), 
    // we only add to sum on the first item of a distinct PO.
    const seenPo = new Set();

    // Data Rows
    data.forEach(item => {
      const isNewPo = !seenPo.has(item.poNo);
      if (isNewPo) {
        seenPo.add(item.poNo);
        sumBeforeTax += item.beforeTax;
        sumTaxAmt += item.taxAmt;
        sumAftTax += item.aftTax;
      }

      const row = [
        item.company,
        item.poNo,
        item.poDate ? new Date(item.poDate).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-') : "",
        item.poStatus,
        item.purchaser,
        item.supplier,
        item.woNo,
        item.prNo,
        item.currency,
        item.exchRate,
        isNewPo ? item.beforeTax : "",
        isNewPo ? item.taxType : "",
        isNewPo ? item.taxRate : "",
        isNewPo ? item.taxAmt : "",
        isNewPo ? item.aftTax : "",
        item.partNo,
        item.description,
        item.uom,
        item.qty,
        item.unitPrice,
        item.amt,
        item.totalReceived,
        item.totalReturned,
        item.nettReceived,
        item.outstandingNotDelivered,
        item.deliverDate ? new Date(item.deliverDate).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-') : ""
      ];

      rows.push(row);
    });

    // Footer Total Row
    const footer = new Array(26).fill("");
    footer[10] = sumBeforeTax; // Before Tax
    footer[13] = sumTaxAmt;    // Tax Amt
    footer[14] = sumAftTax;    // Aft Tax
    rows.push(footer);

    const ws = XLSX.utils.aoa_to_sheet(rows);

    // Apply basic coloring attempt to outstanding cells
    // The standard SheetJS doesn't natively support this without Pro version,
    // but we can attach 's' tags in case a styled writer is used.
    // Start scanning from row 4 (0-indexed 4 is the first data row)
    for (let r = 4; r < rows.length - 1; r++) { // skip footer
      const itemRow = data[r - 4];
      const outstanding = itemRow.outstandingNotDelivered;
      const deliveryDate = itemRow.deliverDate ? new Date(itemRow.deliverDate) : null;
      
      if (outstanding > 0 && deliveryDate && deliveryDate < now) {
        const cellAddress = XLSX.utils.encode_cell({ r, c: 24 }); // Col 24 = Outstanding Not Delivered
        if (ws[cellAddress]) {
          ws[cellAddress].s = {
            fill: { fgColor: { rgb: "FFFF0000" } }, // Red background
            font: { color: { rgb: "FFFFFFFF" } } // White text
          };
        }
      }
    }

    // Merges
    ws['!merges'] = [
      { s: { r: 2, c: 10 }, e: { r: 2, c: 14 } }, // Amt (Before Tax to Aft Tax)
    ];

    // Basic Column Widths
    ws['!cols'] = [
      { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 8 }, { wch: 10 },
      { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 12 },
      { wch: 15 }, { wch: 25 }, { wch: 8 }, { wch: 10 }, { wch: 12 }, { wch: 12 },
      { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 25 }, { wch: 12 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Purchasing Report");
    XLSX.writeFile(wb, `Purchasing_Report_${now.getTime()}.xlsx`);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 relative">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-6 border-b border-blue-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-blue-400 font-semibold tracking-wider uppercase mb-1">
            <Link href="/dashboard" className="hover:text-blue-600">Dashboard</Link>
            <span>/</span>
            <span className="text-blue-500">Purchasing</span>
            <span>/</span>
            <span className="text-blue-500">Purchasing Report</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600">
              <FileText size={20} />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-blue-900">Purchasing Report</h2>
              <p className="text-sm text-blue-500 mt-0.5">Filter and export purchasing and delivery status records to Excel.</p>
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
            <label className="text-xs font-semibold text-blue-700">Company</label>
            <SearchableSelect
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-blue-50 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="">All Companies</option>
              {companies.map((c) => (
                <option key={c.id} value={c.companyName}>
                  {c.companyName}
                </option>
              ))}
            </SearchableSelect>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-blue-700">PO No</label>
            <input
              type="text"
              value={poNo}
              onChange={(e) => setPoNo(e.target.value)}
              placeholder="e.g. PO1700001"
              className="w-full px-3 py-2 text-sm bg-blue-50 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-blue-700">PO Status</label>
            <SearchableSelect
              value={poStatus}
              onChange={(e) => setPoStatus(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-blue-50 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="">All</option>
              <option value="Draft">Draft</option>
              <option value="Issued">Issued</option>
              <option value="Confirmed">Confirmed</option>
            </SearchableSelect>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-blue-700">PO Date (From)</label>
            <input
              type="date"
              value={poDateFrom}
              onChange={(e) => setPoDateFrom(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-blue-50 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-blue-700">PO Date (To)</label>
            <input
              type="date"
              value={poDateTo}
              onChange={(e) => setPoDateTo(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-blue-50 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-blue-700">Supplier</label>
            <SearchableSelect
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-blue-50 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="">All Suppliers</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.supplierName}>
                  {s.supplierName}
                </option>
              ))}
            </SearchableSelect>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-blue-700">Part No</label>
            <SearchableSelect
              value={partNo}
              onChange={(e) => setPartNo(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-blue-50 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="">All Parts</option>
              {materials.map((m) => (
                <option key={m.id} value={m.partNo}>
                  {m.partNo} {m.description ? `- ${m.description}` : ""}
                </option>
              ))}
            </SearchableSelect>
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
