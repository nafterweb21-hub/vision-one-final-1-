"use client";

import { confirmProcessParameter } from "../actions";
import Link from "next/link";

export default function MachiningForm({ timesheet, parameter, employees }: any) {
  const wo = timesheet.routingProcess?.inProcess?.workOrder;
  const customer = wo?.customer;
  const machine = parameter.machine;

  return (
    <div className="p-8">
      <h2 className="text-xl font-bold text-slate-800 mb-6 border-b pb-2">Process Parameter Confirmation – Machining</h2>
      
      <form action={confirmProcessParameter}>
        <input type="hidden" name="id" value={parameter.id} />
        <input type="hidden" name="type" value="machining" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mb-8">
          
          {/* Editable Fields */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-slate-700 mb-1">1. Confirmed By <span className="text-red-500">*</span></label>
            <select 
              name="confirmedById" 
              required
              className="border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              defaultValue={parameter.confirmedById || ""}
            >
              <option value="">Select Employee...</option>
              {employees?.map((emp: any) => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
          </div>

          <div className="col-span-1 md:col-span-2"><hr className="border-slate-100 my-2" /></div>

          {/* Read-Only Fields from WO / Production Terminal */}
          <ReadOnlyField label="2. Work Order No" value={wo?.workOrderNo} />
          <ReadOnlyField label="3. Customer" value={customer?.customerName || customer?.name} />
          <ReadOnlyField label="4. Customer PO Ref" value={wo?.customerPoNo} />
          <ReadOnlyField label="5. Job Description" value={wo?.jobDescription} />
          <ReadOnlyField label="6. Quantity" value={timesheet.completedQty?.toString() || wo?.quantity?.toString()} />
          <ReadOnlyField label="7. UOM" value={wo?.uom} />
          <ReadOnlyField label="8. Employee" value={timesheet.employee?.name} />
          <ReadOnlyField label="9. Time IN" value={timesheet.timeIn ? new Date(timesheet.timeIn).toLocaleString() : ""} />
          <ReadOnlyField label="10. Time OUT" value={timesheet.timeOut ? new Date(timesheet.timeOut).toLocaleString() : ""} />

          <div className="col-span-1 md:col-span-2"><hr className="border-slate-100 my-2" /></div>

          {/* Read-Only Fields from Machine */}
          <ReadOnlyField label="11. Machine Type" value={machine?.machineType} />
          <ReadOnlyField label="12. Machine Serial No" value={machine?.serialNo} />
          <ReadOnlyField label="13. Machine No / Name" value={machine?.machineNo} />
          <ReadOnlyField label="14. Brand" value={machine?.brand} />
          <ReadOnlyField label="15. Model" value={machine?.model} />
          
          <div className="col-span-1 md:col-span-2"><hr className="border-slate-100 my-2" /></div>

          {/* Machining Specific */}
          <ReadOnlyField label="16. Operation Type" value={machine?.operationType} />
          <ReadOnlyField label="17. CNC Program No" value={parameter.cncProgramNo} />
          <ReadOnlyField label="18. Test Run" value={parameter.testRun} />
          <ReadOnlyField label="19. Special Tooling" value={parameter.specialTooling} />
          <ReadOnlyField label="20. Part Runtime (Hr)" value={parameter.partRuntimeHr?.toString()} />
          <ReadOnlyField label="21. Part Runtime (Mins)" value={parameter.partRuntimeMins?.toString()} />
          
          {/* Tool List Table */}
          <div className="col-span-1 md:col-span-2 mt-4">
            <h3 className="font-semibold text-slate-700 bg-slate-100 px-3 py-2 rounded mb-2">22. Tool List</h3>
            {parameter.toolLists && parameter.toolLists.length > 0 ? (
              <div className="border border-slate-200 rounded-md overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2 font-semibold">SN</th>
                      <th className="px-4 py-2 font-semibold">Tool Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parameter.toolLists.map((tool: any, idx: number) => (
                      <tr key={tool.id}>
                        <td className="px-4 py-2">{idx + 1}</td>
                        <td className="px-4 py-2">{tool.toolValue?.toString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-sm text-slate-500 p-2 border border-slate-200 rounded-md bg-slate-50">No tools recorded.</div>
            )}
          </div>

          <ReadOnlyField label="23. Remark" value={parameter.remark} className="md:col-span-2 mt-2" />
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <Link
            href="/dashboard/production/process-parameter"
            className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium"
          >
            Cancel / Back
          </Link>
          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium"
          >
            Print / Export
          </button>
          <button
            type="reset"
            className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium"
          >
            Reset
          </button>
          <button
            type="submit"
            name="actionName"
            value="reject"
            className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors shadow-sm text-sm"
          >
            Reject
          </button>
          <button
            type="submit"
            name="actionName"
            value="approve"
            className="px-6 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors shadow-sm text-sm"
          >
            Approve
          </button>
        </div>
      </form>
    </div>
  );
}

function ReadOnlyField({ label, value, className = "" }: { label: string, value: any, className?: string }) {
  return (
    <div className={`flex flex-col ${className}`}>
      <label className="text-xs font-semibold text-slate-500 mb-1">{label}</label>
      <div className="bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-700 min-h-[38px]">
        {value || "-"}
      </div>
    </div>
  );
}
