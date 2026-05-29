"use client";

import { confirmProcessParameter } from "../actions";

export default function SprayPaintingForm({ timesheet, parameter, employees, elcometers }: any) {
  const wo = timesheet.routingProcess?.inProcess?.workOrder;
  const customer = wo?.customer;

  return (
    <div className="p-8">
      <h2 className="text-xl font-bold text-slate-800 mb-6 border-b pb-2">Process Parameter Confirmation – Spray Painting</h2>
      
      <form action={confirmProcessParameter}>
        <input type="hidden" name="id" value={parameter.id} />
        <input type="hidden" name="type" value="sprayPainting" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mb-8">
          
          {/* Editable Fields */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-slate-700 mb-1">1. Elcometer Serial No <span className="text-red-500">*</span></label>
            <select 
              name="elcometerName" 
              required
              className="border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              defaultValue={parameter.elcometerName || ""}
            >
              <option value="">Select Elcometer...</option>
              {elcometers?.map((elc: any) => (
                <option key={elc.id} value={elc.serialNo}>{elc.serialNo}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium text-slate-700 mb-1">2. Confirmed By <span className="text-red-500">*</span></label>
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
          <ReadOnlyField label="3. Work Order No" value={wo?.workOrderNo} />
          <ReadOnlyField label="4. Customer" value={customer?.customerName || customer?.name} />
          <ReadOnlyField label="5. Customer PO Ref" value={wo?.customerPoNo} />
          <ReadOnlyField label="6. Job Description" value={wo?.jobDescription} />
          <ReadOnlyField label="7. Quantity" value={timesheet.completedQty?.toString() || wo?.quantity?.toString()} />
          <ReadOnlyField label="8. UOM" value={wo?.uom} />
          <ReadOnlyField label="9. Employee" value={timesheet.employee?.name} />
          <ReadOnlyField label="10. Time IN" value={timesheet.timeIn ? new Date(timesheet.timeIn).toLocaleString() : ""} />
          <ReadOnlyField label="11. Time OUT" value={timesheet.timeOut ? new Date(timesheet.timeOut).toLocaleString() : ""} />
          <ReadOnlyField label="12. Paint Tank Pressure (psi)" value={parameter.paintTankPressurePsi?.toString()} />
          <ReadOnlyField label="13. Spray Nozzle Size (Ø)" value={parameter.sprayNozzleSize?.toString()} />
          <ReadOnlyField label="14. Type of Paint" value={parameter.typeOfPaint} />
          <ReadOnlyField label="15. Remark" value={parameter.remark} className="md:col-span-2" />

          {/* A. Surface Preparation */}
          <div className="col-span-1 md:col-span-2 mt-4"><h3 className="font-semibold text-slate-700 bg-slate-100 px-3 py-2 rounded">A. Surface Preparation</h3></div>
          <ReadOnlyField label="16. Start Date Time" value={parameter.surfaceStartDatetime ? new Date(parameter.surfaceStartDatetime).toLocaleString() : ""} />
          <ReadOnlyField label="17. End Date Time" value={parameter.surfaceEndDatetime ? new Date(parameter.surfaceEndDatetime).toLocaleString() : ""} />
          <ReadOnlyField label="18. General Weather Condition" value={parameter.surfaceGeneralWeather} />
          <ReadOnlyField label="19. Environmental Temperature" value={parameter.surfaceEnvTemperature} />
          <ReadOnlyField label="20. Relative Humidity" value={parameter.surfaceRelativeHumidity} />
          <ReadOnlyField label="21. Abrasive Type" value={parameter.surfaceAbrasiveType} />
          <ReadOnlyField label="22. Sandpaper Grit" value={parameter.surfaceSandpaperGrit} />

          {/* B. Primer Coat */}
          <div className="col-span-1 md:col-span-2 mt-4"><h3 className="font-semibold text-slate-700 bg-slate-100 px-3 py-2 rounded">B. Primer Coat</h3></div>
          <ReadOnlyField label="23. Start Date Time" value={parameter.primerStartDatetime ? new Date(parameter.primerStartDatetime).toLocaleString() : ""} />
          <ReadOnlyField label="24. End Date Time" value={parameter.primerEndDatetime ? new Date(parameter.primerEndDatetime).toLocaleString() : ""} />
          <ReadOnlyField label="25. General Weather Condition" value={parameter.primerGeneralWeather} />
          <ReadOnlyField label="26. Environmental Temperature" value={parameter.primerEnvTemperature} />
          <ReadOnlyField label="27. Relative Humidity" value={parameter.primerRelativeHumidity} />
          <ReadOnlyField label="28. Paint Batch No" value={parameter.primerPaintBatchNo} />
          <ReadOnlyField label="29. Expiry Date" value={parameter.primerExpiryDate ? new Date(parameter.primerExpiryDate).toLocaleDateString() : ""} />
          <ReadOnlyField label="30. DFT Measurement Result" value={parameter.primerDftMeasurement} />

          {/* C. Top Coat */}
          <div className="col-span-1 md:col-span-2 mt-4"><h3 className="font-semibold text-slate-700 bg-slate-100 px-3 py-2 rounded">C. Top Coat</h3></div>
          <ReadOnlyField label="31. Start Date Time" value={parameter.topcoatStartDatetime ? new Date(parameter.topcoatStartDatetime).toLocaleString() : ""} />
          <ReadOnlyField label="32. End Date Time" value={parameter.topcoatEndDatetime ? new Date(parameter.topcoatEndDatetime).toLocaleString() : ""} />
          <ReadOnlyField label="33. General Weather Condition" value={parameter.topcoatGeneralWeather} />
          <ReadOnlyField label="34. Environmental Temperature" value={parameter.topcoatEnvTemperature} />
          <ReadOnlyField label="35. Relative Humidity" value={parameter.topcoatRelativeHumidity} />
          <ReadOnlyField label="36. Abrasive Type" value={parameter.topcoatAbrasiveType} />
          <ReadOnlyField label="37. Sandpaper Grit" value={parameter.topcoatSandpaperGrit} />
          <ReadOnlyField label="38. Start Date Time 2" value={parameter.topcoatStartDatetime2 ? new Date(parameter.topcoatStartDatetime2).toLocaleString() : ""} />
          <ReadOnlyField label="39. End Date Time 2" value={parameter.topcoatEndDatetime2 ? new Date(parameter.topcoatEndDatetime2).toLocaleString() : ""} />
          <ReadOnlyField label="40. General Weather Condition 2" value={parameter.topcoatGeneralWeather2} />
          <ReadOnlyField label="41. Environmental Temperature 2" value={parameter.topcoatEnvTemperature2} />
          <ReadOnlyField label="42. Relative Humidity 2" value={parameter.topcoatRelativeHumidity2} />
          <ReadOnlyField label="43. Paint Batch No" value={parameter.topcoatPaintBatchNo} />
          <ReadOnlyField label="44. Expiry Date" value={parameter.topcoatExpiryDate ? new Date(parameter.topcoatExpiryDate).toLocaleDateString() : ""} />
          <ReadOnlyField label="45. DFT Measurement Result" value={parameter.topcoatDftMeasurement} />
          <ReadOnlyField label="46. Adhesive Test Result" value={parameter.topcoatAdhesiveTestResult} />
          <ReadOnlyField label="47. Additional Remark" value={parameter.additionalRemark} className="md:col-span-2" />

        </div>

        <div className="flex justify-end pt-4 border-t border-slate-200">
          <button
            type="submit"
            className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            Confirm Parameters
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
