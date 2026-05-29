"use client";

import { confirmProcessParameter } from "../actions";

export default function WeldingForm({ timesheet, parameter, employees }: any) {
  const wo = timesheet.routingProcess?.inProcess?.workOrder;
  const customer = wo?.customer;
  const machine = parameter.weldingMachine;
  const joint = parameter.typeOfJoint;

  return (
    <div className="p-8">
      <h2 className="text-xl font-bold text-slate-800 mb-6 border-b pb-2">Process Parameter Confirmation – Welding</h2>
      
      <form action={confirmProcessParameter}>
        <input type="hidden" name="id" value={parameter.id} />
        <input type="hidden" name="type" value="welding" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mb-8">
          
          {/* 1. Confirmed By */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-slate-700 mb-1">1. Confirmed By <span className="text-red-500">*</span></label>
            <select 
              name="confirmedById" 
              required
              className="border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              defaultValue={parameter.confirmedById || ""}
            >
              <option value="">Select Employee...</option>
              {employees.map((emp: any) => (
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
          <ReadOnlyField label="11. Type of Material" value={"-"} /> {/* Update if material is joined */}
          <ReadOnlyField label="12. Type of Welding" value={"-"} /> {/* Update if welding type is joined */}
          
          <div className="col-span-1 md:col-span-2"><hr className="border-slate-100 my-2" /></div>

          {/* Machine Profile fields */}
          <ReadOnlyField label="13. Welding Machine" value={machine?.machineCode || "-"} />
          <ReadOnlyField label="14. Machine No" value={machine?.machineNo || "-"} />
          <ReadOnlyField label="15. Brand" value={machine?.brand || "-"} />
          <ReadOnlyField label="16. Model" value={machine?.model || "-"} />
          <ReadOnlyField label="17. Current" value={machine?.current || "-"} />
          <ReadOnlyField label="18. S/No" value={machine?.serialNo || "-"} />

          <div className="col-span-1 md:col-span-2"><hr className="border-slate-100 my-2" /></div>

          {/* Welding Parameters */}
          <ReadOnlyField label="19. Type of Joint" value={joint?.jointName || "-"} />
          <ReadOnlyField label="20. Electrode Type" value={parameter.electrodeType} />
          <ReadOnlyField label="21. Welding Position" value={parameter.weldingPosition} />
          <ReadOnlyField label="22. Welding Joint" value={parameter.weldingJoint?.toString()} />
          <ReadOnlyField label="23. Welding Size (mm)" value={parameter.weldingSizeMm?.toString()} />
          <ReadOnlyField label="24. Voltage (Volts)" value={parameter.voltageVolts?.toString()} />
          <ReadOnlyField label="25. Current (Amp)" value={parameter.currentAmp?.toString()} />
          <ReadOnlyField label="26. Cooling Time (mins)" value={parameter.coolingTimeMins?.toString()} />
          <ReadOnlyField label="27. Pre Heating (°C)" value={parameter.preHeatingC?.toString()} />
          <ReadOnlyField label="28. Post Heating (°C)" value={parameter.postHeatingC?.toString()} />
          <ReadOnlyField label="29. Heat Treatment (HRC)" value={parameter.heatTreatmentHrc?.toString()} />
          <ReadOnlyField label="30. Remark" value={parameter.remark} className="md:col-span-2" />
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-200">
          <button
            type="submit"
            className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            Submit
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
