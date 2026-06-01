"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createNcr, updateNcr } from "../actions";

export default function NcrForm({ initialData, formData }: { initialData?: any, formData: any }) {
  const router = useRouter();
  const isEditing = !!initialData;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [ncrDate, setNcrDate] = useState(initialData?.ncrDate ? new Date(initialData.ncrDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
  const [customerId, setCustomerId] = useState(initialData?.customerId || "");
  const [workOrderNo, setWorkOrderNo] = useState(initialData?.workOrderNo || "");
  const [inProcessId, setInProcessId] = useState(initialData?.inProcessId || "");
  const [mainProcessId, setMainProcessId] = useState(initialData?.mainProcessId || "");
  const [routingProcessId, setRoutingProcessId] = useState(initialData?.routingProcessId || "");
  const [requestorId, setRequestorId] = useState(initialData?.requestorId || "");
  const [responsiblePartyId, setResponsiblePartyId] = useState(initialData?.responsiblePartyId || "");
  const [descriptionOfNonConformance, setDescriptionOfNonConformance] = useState(initialData?.descriptionOfNonConformance || "");
  const [ncrQuantity, setNcrQuantity] = useState(initialData?.ncrQuantity || 0);
  const [reworkQuantity, setReworkQuantity] = useState(initialData?.reworkQuantity || 0);
  const [useAsIsQuantity, setUseAsIsQuantity] = useState(initialData?.useAsIsQuantity || 0);
  const [scrapQuantity, setScrapQuantity] = useState(initialData?.scrapQuantity || 0);
  const [otherQuantity, setOtherQuantity] = useState(initialData?.otherQuantity || 0);
  const [otherDecisions, setOtherDecisions] = useState(initialData?.otherDecisions || "");
  const [customerAcceptanceForUseAsIs, setCustomerAcceptanceForUseAsIs] = useState<boolean | null>(initialData?.customerAcceptanceForUseAsIs ?? null);
  const [department, setDepartment] = useState(initialData?.department || "");
  
  const [correctiveAction, setCorrectiveAction] = useState<boolean | null>(initialData?.correctiveAction ?? null);
  const [reasonToJustify, setReasonToJustify] = useState(initialData?.reasonToJustify || "");
  
  const [rootCause, setRootCause] = useState(initialData?.rootCause || "");
  const [rootCauseResponsibleStaffId, setRootCauseResponsibleStaffId] = useState(initialData?.rootCauseResponsibleStaffId || "");
  const [rootCauseDate, setRootCauseDate] = useState(initialData?.rootCauseDate ? new Date(initialData.rootCauseDate).toISOString().split('T')[0] : "");
  
  const [correctivePreventiveAction, setCorrectivePreventiveAction] = useState(initialData?.correctivePreventiveAction || "");
  const [cpaResponsibleStaffId, setCpaResponsibleStaffId] = useState(initialData?.cpaResponsibleStaffId || "");
  const [cpaDate, setCpaDate] = useState(initialData?.cpaDate ? new Date(initialData.cpaDate).toISOString().split('T')[0] : "");
  
  const [followUpVerification, setFollowUpVerification] = useState(initialData?.followUpVerification || "");
  const [actionTaken, setActionTaken] = useState(initialData?.actionTaken || "");
  const [verifiedConfirmedById, setVerifiedConfirmedById] = useState(initialData?.verifiedConfirmedById || "");
  const [verifiedConfirmedDate, setVerifiedConfirmedDate] = useState(initialData?.verifiedConfirmedDate ? new Date(initialData.verifiedConfirmedDate).toISOString().split('T')[0] : "");

  const [failureModeIds, setFailureModeIds] = useState<string[]>(
    initialData?.NcrFailureMode ? initialData.NcrFailureMode.map((fm: any) => fm.failureModeId) : []
  );

  // Auto calculate NCR Quantity
  useEffect(() => {
    setNcrQuantity(Number(reworkQuantity) + Number(useAsIsQuantity) + Number(scrapQuantity) + Number(otherQuantity));
  }, [reworkQuantity, useAsIsQuantity, scrapQuantity, otherQuantity]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validation
    const selectedWO = formData.workOrders.find((w: any) => w.workOrderNo === workOrderNo);
    if (selectedWO && ncrQuantity > Number(selectedWO.quantity)) {
        setError(`NCR Quantity (${ncrQuantity}) cannot be more than Work Order Quantity (${selectedWO.quantity})`);
        setLoading(false);
        return;
    }

    const payload = {
      ncrDate: new Date(ncrDate),
      customerId,
      workOrderNo,
      inProcessId: inProcessId || undefined,
      mainProcessId: mainProcessId || undefined,
      routingProcessId: routingProcessId || undefined,
      requestorId,
      responsiblePartyId: responsiblePartyId || undefined,
      descriptionOfNonConformance,
      ncrQuantity,
      reworkQuantity,
      useAsIsQuantity,
      scrapQuantity,
      otherQuantity,
      otherDecisions: otherDecisions || undefined,
      customerAcceptanceForUseAsIs,
      department: department || undefined,
      correctiveAction,
      reasonToJustify: !correctiveAction ? reasonToJustify : undefined,
      rootCause: rootCause || undefined,
      rootCauseResponsibleStaffId: rootCauseResponsibleStaffId || undefined,
      rootCauseDate: rootCauseDate ? new Date(rootCauseDate) : undefined,
      correctivePreventiveAction: correctivePreventiveAction || undefined,
      cpaResponsibleStaffId: cpaResponsibleStaffId || undefined,
      cpaDate: cpaDate ? new Date(cpaDate) : undefined,
      followUpVerification: followUpVerification || undefined,
      actionTaken: actionTaken || undefined,
      verifiedConfirmedById: verifiedConfirmedById || undefined,
      verifiedConfirmedDate: verifiedConfirmedDate ? new Date(verifiedConfirmedDate) : undefined,
      failureModeIds
    };

    try {
      let saved: any;
      if (isEditing) {
        saved = await updateNcr(initialData.id, payload);
      } else {
        saved = await createNcr(payload);
      }
      router.push(`/dashboard/saved?module=NCR&id=${saved.ncrNo || saved.id}&viewUrl=/dashboard/qc/ncr/${saved.id}&backUrl=/dashboard/qc/ncr`);
    } catch (err: any) {
      setError(err.message || "Failed to save NCR");
    } finally {
      setLoading(false);
    }
  };

  const handleFailureModeChange = (id: string) => {
    if (failureModeIds.includes(id)) {
      setFailureModeIds(failureModeIds.filter((fId) => fId !== id));
    } else {
      setFailureModeIds([...failureModeIds, id]);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
      {error && <div className="p-4 bg-red-50 text-red-600 rounded">{error}</div>}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">NCR Date *</label>
          <input type="date" value={ncrDate} onChange={(e) => setNcrDate(e.target.value)} required className="w-full border-gray-300 rounded-md shadow-sm p-2 border" />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Customer *</label>
          <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} required className="w-full border-gray-300 rounded-md shadow-sm p-2 border">
            <option value="">Select Customer</option>
            {formData.customers.map((c: any) => (
              <option key={c.id} value={c.id}>{c.customerName}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Work Order No *</label>
          <select value={workOrderNo} onChange={(e) => setWorkOrderNo(e.target.value)} required className="w-full border-gray-300 rounded-md shadow-sm p-2 border">
            <option value="">Select Work Order</option>
            {formData.workOrders.filter((wo: any) => customerId ? wo.customerId === customerId : true).map((w: any) => (
              <option key={w.workOrderNo} value={w.workOrderNo}>{w.workOrderNo}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">In-Process Description</label>
          <select value={inProcessId} onChange={(e) => setInProcessId(e.target.value)} className="w-full border-gray-300 rounded-md shadow-sm p-2 border">
            <option value="">Select In-Process</option>
            {formData.workOrders.find((w: any) => w.workOrderNo === workOrderNo)?.inProcesses?.map((ip: any) => (
              <option key={ip.id} value={ip.id}>{ip.description}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Requestor *</label>
          <select value={requestorId} onChange={(e) => setRequestorId(e.target.value)} required className="w-full border-gray-300 rounded-md shadow-sm p-2 border">
            <option value="">Select Employee</option>
            {formData.employees.map((emp: any) => (
              <option key={emp.id} value={emp.id}>{emp.name}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Responsible Party</label>
          <select value={responsiblePartyId} onChange={(e) => setResponsiblePartyId(e.target.value)} className="w-full border-gray-300 rounded-md shadow-sm p-2 border">
            <option value="">Select Employee</option>
            {formData.employees.map((emp: any) => (
              <option key={emp.id} value={emp.id}>{emp.name}</option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Description of Non-Conformance / Problem *</label>
          <textarea value={descriptionOfNonConformance} onChange={(e) => setDescriptionOfNonConformance(e.target.value)} required rows={3} className="w-full border-gray-300 rounded-md shadow-sm p-2 border" />
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-medium mb-4">Quantities & Decisions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rework Qty</label>
            <input type="number" value={reworkQuantity} onChange={(e) => setReworkQuantity(Number(e.target.value))} min={0} className="w-full border-gray-300 rounded-md shadow-sm p-2 border" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Use-As-Is Qty</label>
            <input type="number" value={useAsIsQuantity} onChange={(e) => setUseAsIsQuantity(Number(e.target.value))} min={0} className="w-full border-gray-300 rounded-md shadow-sm p-2 border" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Scrap Qty</label>
            <input type="number" value={scrapQuantity} onChange={(e) => setScrapQuantity(Number(e.target.value))} min={0} className="w-full border-gray-300 rounded-md shadow-sm p-2 border" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Other Qty</label>
            <input type="number" value={otherQuantity} onChange={(e) => setOtherQuantity(Number(e.target.value))} min={0} className="w-full border-gray-300 rounded-md shadow-sm p-2 border" />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Total NCR Quantity (Calculated)</label>
          <input type="number" value={ncrQuantity} readOnly className="w-full bg-gray-50 border-gray-300 rounded-md shadow-sm p-2 border" />
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-medium mb-4">Analysis & Actions</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <select value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full border-gray-300 rounded-md shadow-sm p-2 border">
              <option value="">Select Department</option>
              {formData.departments?.map((dept: any) => (
                <option key={dept.id} value={dept.name}>{dept.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Corrective Action Required?</label>
            <select value={correctiveAction === null ? "" : (correctiveAction ? "Yes" : "No")} onChange={(e) => setCorrectiveAction(e.target.value === "" ? null : e.target.value === "Yes")} className="w-full border-gray-300 rounded-md shadow-sm p-2 border">
              <option value="">Select Option</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>
        </div>

        {correctiveAction === false && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason to Justify (If No Corrective Action)</label>
            <textarea value={reasonToJustify} onChange={(e) => setReasonToJustify(e.target.value)} rows={2} className="w-full border-gray-300 rounded-md shadow-sm p-2 border" />
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Failure Modes</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {formData.failureModes.map((fm: any) => (
              <label key={fm.id} className="flex items-center space-x-2">
                <input type="checkbox" checked={failureModeIds.includes(fm.id)} onChange={() => handleFailureModeChange(fm.id)} className="rounded border-gray-300" />
                <span className="text-sm">{fm.failureMode}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-4 print:hidden">
        <button type="button" onClick={() => router.back()} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
        <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50">
          {loading ? "Saving..." : "Save NCR"}
        </button>
      </div>
    </form>
  );
}
