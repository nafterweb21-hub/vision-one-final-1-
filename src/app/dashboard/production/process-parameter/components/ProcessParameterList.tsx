"use client";

import { useState } from "react";
import Link from "next/link";
import { confirmBulkProcessParameters } from "@/app/dashboard/production/process-parameter/actions";

export default function ProcessParameterList({ timesheets, employees, elcometers }: any) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmedById, setConfirmedById] = useState("");
  const [elcometerName, setElcometerName] = useState("");

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedIds.length === timesheets.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(timesheets.map((ts: any) => ts.id));
    }
  };

  const handleConfirm = async () => {
    if (selectedIds.length === 0) return alert("Please select at least one record to confirm.");
    if (!confirmedById) return alert("Please select a 'Confirm By' employee.");

    // Check if any selected record is spray painting and needs elcometer
    const hasSpray = timesheets.some((ts: any) => selectedIds.includes(ts.id) && ts.sprayParameter);
    if (hasSpray && !elcometerName) {
      return alert("Please select an 'Elcometer Used' for the Spray Painting record(s).");
    }

    const formData = new FormData();
    formData.append("confirmedById", confirmedById);
    if (elcometerName) formData.append("elcometerName", elcometerName);
    selectedIds.forEach(id => formData.append("timesheetIds", id));

    await confirmBulkProcessParameters(formData);
    setSelectedIds([]);
    setConfirmedById("");
    setElcometerName("");
  };

  if (timesheets.length === 0) {
    return (
      <div className="p-12 text-center text-slate-500">
        <p className="text-lg font-medium text-slate-700 mb-2">No process parameters require confirmation</p>
      </div>
    );
  }

  return (
    <div>
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap gap-4 items-end">
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-slate-600 mb-1">Confirm By <span className="text-red-500">*</span></label>
          <select 
            value={confirmedById}
            onChange={(e) => setConfirmedById(e.target.value)}
            className="border border-slate-300 rounded-md px-3 py-1.5 text-sm bg-white"
          >
            <option value="">Select Employee...</option>
            {employees.map((emp: any) => (
              <option key={emp.id} value={emp.id}>{emp.name}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-xs font-semibold text-slate-600 mb-1">Elcometer Used (For Spray Painting)</label>
          <select 
            value={elcometerName}
            onChange={(e) => setElcometerName(e.target.value)}
            className="border border-slate-300 rounded-md px-3 py-1.5 text-sm bg-white"
          >
            <option value="">Select Elcometer...</option>
            {elcometers.map((elc: any) => (
              <option key={elc.id} value={elc.serialNo}>{elc.serialNo}</option>
            ))}
          </select>
        </div>

        <button 
          onClick={handleConfirm}
          disabled={selectedIds.length === 0}
          className="ml-auto px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          Confirm Selected ({selectedIds.length})
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 w-10">
                <input 
                  type="checkbox" 
                  checked={selectedIds.length > 0 && selectedIds.length === timesheets.length}
                  onChange={toggleAll}
                  className="rounded border-slate-300"
                />
              </th>
              <th className="px-6 py-4 font-semibold">Date</th>
              <th className="px-6 py-4 font-semibold">Work Order No</th>
              <th className="px-6 py-4 font-semibold">Employee</th>
              <th className="px-6 py-4 font-semibold">Process Type</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {timesheets.map((ts: any) => {
              let type = "";
              let status = "Pending";
              if (ts.weldingParameter) {
                type = "Welding";
                status = ts.weldingParameter.status || "Pending";
              } else if (ts.sprayParameter) {
                type = "Spray Painting";
                status = ts.sprayParameter.status || "Pending";
              } else if (ts.machiningParameter) {
                type = "Machining";
                status = ts.machiningParameter.status || "Pending";
              }

              const wo = ts.routingProcess?.inProcess?.workOrder;
              return (
                <tr key={ts.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3">
                    <input 
                      type="checkbox"
                      checked={selectedIds.includes(ts.id)}
                      onChange={() => toggleSelect(ts.id)}
                      className="rounded border-slate-300"
                    />
                  </td>
                  <td className="px-6 py-4">
                    {(() => {
                      const d = new Date(ts.createdAt);
                      return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
                    })()}
                  </td>
                  <td className="px-6 py-4 font-medium text-blue-600">{wo?.workOrderNo || "-"}</td>
                  <td className="px-6 py-4">{ts.employee?.name || "-"}</td>
                  <td className="px-6 py-4">{type}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                      {status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/dashboard/production/process-parameter/${ts.id}`} className="text-blue-600 hover:text-blue-800 font-medium text-sm">
                      View Details
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
