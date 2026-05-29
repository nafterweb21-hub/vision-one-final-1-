"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import {
  Save,
  ArrowLeft,
  Loader2,
  AlertCircle,
  ClipboardList
} from "lucide-react";

export default function SubconReturnTrackingFormPage() {
  const router = useRouter();
  const params = useParams();
  const isNew = params.id === "new";

  const { control, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm({
    defaultValues: {
      companyId: "",
      srtDate: new Date().toISOString().split("T")[0],
      supplierId: "",
      purchaseOrderId: "",
      subconRequestFormId: "",
      returnedQty: 0,
      remark: "",
      status: "Draft",
    }
  });

  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [formData, setFormData] = useState<any>({ companies: [], suppliers: [], pos: [], srfs: [] });
  const [errorMsg, setErrorMsg] = useState("");
  const [srtNo, setSrtNo] = useState("Draft");
  const [readOnlyMode, setReadOnlyMode] = useState(false);

  const watchCompanyId = watch("companyId");
  const watchSupplierId = watch("supplierId");
  const watchPurchaseOrderId = watch("purchaseOrderId");
  const watchSubconRequestFormId = watch("subconRequestFormId");
  const watchStatus = watch("status");

  useEffect(() => {
    async function loadData() {
      try {
        const [formRes, srtRes] = await Promise.all([
          fetch("/api/purchasing/subcon-return-tracking/form-data"),
          isNew ? Promise.resolve(null) : fetch(`/api/purchasing/subcon-return-tracking/${params.id}`)
        ]);

        if (!formRes.ok) throw new Error("Failed to load form dependencies");
        const fData = await formRes.json();
        setFormData(fData);

        if (!isNew && srtRes) {
          if (!srtRes.ok) throw new Error("Failed to load SRT");
          const srtData = await srtRes.json();
          setSrtNo(srtData.srtNo);
          reset({
            companyId: srtData.companyId,
            srtDate: new Date(srtData.srtDate).toISOString().split("T")[0],
            supplierId: srtData.supplierId,
            purchaseOrderId: srtData.purchaseOrderId,
            subconRequestFormId: srtData.subconRequestFormId,
            returnedQty: Number(srtData.returnedQty),
            remark: srtData.remark || "",
            status: srtData.status,
          });

          if (srtData.status !== "Draft") {
            setReadOnlyMode(true);
          }
          
          // Add current PO and SRF to the lists if not there (in case they are fully received now but were selected before)
          const poExists = fData.pos.find((p: any) => p.id === srtData.purchaseOrderId);
          if (!poExists && srtData.purchaseOrder) {
            fData.pos.push(srtData.purchaseOrder);
          }

          const srfExists = fData.srfs.find((s: any) => s.id === srtData.subconRequestFormId);
          if (!srfExists && srtData.subconRequestForm) {
            const srf = srtData.subconRequestForm;
            fData.srfs.push({
              id: srf.id,
              srfNo: srf.srfNo,
              purchaseOrderId: srf.purchaseOrderItem.purchaseOrder.id,
              purchaseOrderItemId: srf.purchaseOrderItemId,
              poNo: srf.purchaseOrderItem.purchaseOrder.poNo,
              woNo: srf.purchaseOrderItem.purchaseOrder.workOrderNo,
              inProcessDescription: srf.purchaseOrderItem.woRoutingProcess?.inProcess?.description || "",
              mainProcess: srf.purchaseOrderItem.woRoutingProcess?.mainProcess?.process || "",
              routingProcess: srf.purchaseOrderItem.woRoutingProcess?.routingProcess?.routingProcess || "",
              partDescription: srf.purchaseOrderItem.description || "",
              dateRequired: srf.dateRequired,
              acknowledgedQuantity: srf.quantity,
              uom: srf.purchaseOrderItem.poUom.uomName,
              unitPrice: srf.purchaseOrderItem.unitPrice,
              amount: srf.purchaseOrderItem.amount,
              hardness: srf.purchaseOrderItem.hardness || "",
              thickness: srf.purchaseOrderItem.thickness || "",
            });
          }
          setFormData({ ...fData });
        }
      } catch (err: any) {
        setErrorMsg(err.message);
      } finally {
        setFetchingData(false);
      }
    }
    loadData();
  }, [isNew, params.id, reset]);

  // Reset dependent fields when parent changes
  useEffect(() => {
    if (isNew) {
      setValue("purchaseOrderId", "");
      setValue("subconRequestFormId", "");
    }
  }, [watchSupplierId, isNew, setValue]);

  useEffect(() => {
    if (isNew) {
      setValue("subconRequestFormId", "");
    }
  }, [watchPurchaseOrderId, isNew, setValue]);

  const selectedSrfData = React.useMemo(() => {
    if (!watchSubconRequestFormId) return null;
    return formData.srfs.find((s: any) => s.id === watchSubconRequestFormId) || null;
  }, [watchSubconRequestFormId, formData.srfs]);

  useEffect(() => {
    if (isNew && selectedSrfData) {
      setValue("returnedQty", Number(selectedSrfData.acknowledgedQuantity));
    }
  }, [selectedSrfData, isNew, setValue]);

  const onSubmit = async (data: any) => {
    if (readOnlyMode) return;
    setLoading(true);
    setErrorMsg("");
    try {
      if (selectedSrfData && Number(data.returnedQty) > Number(selectedSrfData.acknowledgedQuantity)) {
         alert("Total quantity from Subcon Return Tracking cannot be more than quantity from Subcon Request Form.");
         setLoading(false);
         return;
      }
      
      const payload = {
        companyId: data.companyId,
        supplierId: data.supplierId,
        purchaseOrderId: data.purchaseOrderId,
        subconRequestFormId: data.subconRequestFormId,
        srtDate: data.srtDate,
        returnedQty: Number(data.returnedQty),
        remark: data.remark,
      };

      const res = await fetch(
        isNew ? "/api/purchasing/subcon-return-tracking" : `/api/purchasing/subcon-return-tracking/${params.id}`,
        {
          method: isNew ? "POST" : "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Failed to save form");
      }
      const saved = await res.json();
      router.push(`/dashboard/saved?module=Subcon Return Tracking&id=${saved.srtNo || saved.id || srtNo}&viewUrl=/dashboard/purchasing/subcon-return-tracking/${saved.id || params.id}&backUrl=/dashboard/purchasing/subcon-return-tracking`);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (fetchingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const filteredPOs = formData.pos.filter((p: any) => p.supplierId === watchSupplierId && p.companyId === watchCompanyId);
  const filteredSRFs = formData.srfs.filter((s: any) => s.purchaseOrderId === watchPurchaseOrderId);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-indigo-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-indigo-400 font-semibold tracking-wider uppercase mb-1">
            <Link href="/dashboard" className="hover:text-indigo-600">Dashboard</Link>
            <span>/</span>
            <Link href="/dashboard/purchasing/subcon-return-tracking" className="hover:text-indigo-600">Subcon Return Tracking</Link>
            <span>/</span>
            <span className="text-indigo-500">{isNew ? "New Tracking" : srtNo}</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/purchasing/subcon-return-tracking"
              className="p-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-indigo-900">
                {isNew ? "Create Subcon Return Tracking" : `Subcon Return Tracking - ${srtNo}`}
              </h2>
              {!isNew && (
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1 ${
                  watchStatus === "Submitted" ? "bg-emerald-100 text-emerald-800" :
                  watchStatus === "Void" ? "bg-rose-100 text-rose-800" :
                  "bg-amber-100 text-amber-800"
                }`}>
                  {watchStatus}
                </span>
              )}
            </div>
          </div>
        </div>

        {!readOnlyMode && (
          <button
            onClick={handleSubmit(onSubmit)}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-lg shadow-md active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save Tracking
          </button>
        )}
      </div>

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center gap-3 text-rose-700">
          <AlertCircle size={18} />
          <p className="text-sm font-medium">{errorMsg}</p>
        </div>
      )}

      {/* Main Form Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column - General Info */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-indigo-100 shadow-sm space-y-6">
             <h3 className="text-sm font-bold text-indigo-900 border-b border-indigo-100 pb-2 uppercase tracking-wider">General Information</h3>
             
             <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-xs font-semibold text-indigo-700 mb-1.5">Company <span className="text-rose-500">*</span></label>
                  <Controller
                    name="companyId"
                    control={control}
                    rules={{ required: "Required" }}
                    render={({ field }) => (
                      <select {...field} disabled={readOnlyMode} className={`w-full px-3 py-2 text-sm bg-indigo-50/50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 ${errors.companyId ? "border-rose-300 focus:border-rose-500" : "border-indigo-100 focus:border-indigo-500"} disabled:opacity-60`}>
                        <option value="">-- Select Company --</option>
                        {formData.companies.map((c: any) => (
                          <option key={c.id} value={c.id}>{c.companyName}</option>
                        ))}
                      </select>
                    )}
                  />
               </div>

               <div>
                  <label className="block text-xs font-semibold text-indigo-700 mb-1.5">SRT Date <span className="text-rose-500">*</span></label>
                  <Controller
                    name="srtDate"
                    control={control}
                    rules={{ required: "Required" }}
                    render={({ field }) => (
                      <input type="date" {...field} disabled={readOnlyMode} max={new Date().toISOString().split("T")[0]} className="w-full px-3 py-2 text-sm bg-indigo-50/50 border border-indigo-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 disabled:opacity-60" />
                    )}
                  />
               </div>

               <div>
                  <label className="block text-xs font-semibold text-indigo-700 mb-1.5">Supplier <span className="text-rose-500">*</span></label>
                  <Controller
                    name="supplierId"
                    control={control}
                    rules={{ required: "Required" }}
                    render={({ field }) => (
                      <select {...field} disabled={readOnlyMode} className={`w-full px-3 py-2 text-sm bg-indigo-50/50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 ${errors.supplierId ? "border-rose-300 focus:border-rose-500" : "border-indigo-100 focus:border-indigo-500"} disabled:opacity-60`}>
                        <option value="">-- Select Supplier --</option>
                        {formData.suppliers.map((s: any) => (
                          <option key={s.id} value={s.id}>{s.supplierCode} - {s.supplierName}</option>
                        ))}
                      </select>
                    )}
                  />
               </div>

               <div>
                  <label className="block text-xs font-semibold text-indigo-700 mb-1.5">PO No <span className="text-rose-500">*</span></label>
                  <Controller
                    name="purchaseOrderId"
                    control={control}
                    rules={{ required: "Required" }}
                    render={({ field }) => (
                      <select {...field} disabled={readOnlyMode || !watchSupplierId || !watchCompanyId} className={`w-full px-3 py-2 text-sm bg-indigo-50/50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 ${errors.purchaseOrderId ? "border-rose-300 focus:border-rose-500" : "border-indigo-100 focus:border-indigo-500"} disabled:opacity-60`}>
                        <option value="">-- Select PO --</option>
                        {filteredPOs.map((p: any) => (
                          <option key={p.id} value={p.id}>{p.poNo}</option>
                        ))}
                      </select>
                    )}
                  />
               </div>

               <div className="col-span-2">
                  <label className="block text-xs font-semibold text-indigo-700 mb-1.5">SRF No <span className="text-rose-500">*</span></label>
                  <Controller
                    name="subconRequestFormId"
                    control={control}
                    rules={{ required: "Required" }}
                    render={({ field }) => (
                      <select {...field} disabled={readOnlyMode || !watchPurchaseOrderId} className={`w-full px-3 py-2 text-sm bg-indigo-50/50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 ${errors.subconRequestFormId ? "border-rose-300 focus:border-rose-500" : "border-indigo-100 focus:border-indigo-500"} disabled:opacity-60`}>
                        <option value="">-- Select SRF --</option>
                        {filteredSRFs.map((s: any) => (
                          <option key={s.id} value={s.id}>{s.srfNo} - {s.partDescription}</option>
                        ))}
                      </select>
                    )}
                  />
               </div>
             </div>

             <div className="border-t border-indigo-100 pt-6 space-y-4">
                <h3 className="text-sm font-bold text-indigo-900 border-b border-indigo-100 pb-2 uppercase tracking-wider">Return Details</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-indigo-700 mb-1.5">Returned Qty <span className="text-rose-500">*</span></label>
                    <Controller
                      name="returnedQty"
                      control={control}
                      rules={{ required: "Required", min: 1 }}
                      render={({ field }) => (
                        <input type="number" {...field} disabled={readOnlyMode} min="0" step="1" className={`w-full px-3 py-2 text-sm bg-indigo-50/50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 ${errors.returnedQty ? "border-rose-300 focus:border-rose-500" : "border-indigo-100 focus:border-indigo-500"} disabled:opacity-60`} />
                      )}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-indigo-700 mb-1.5">Return UOM</label>
                    <input type="text" disabled value={selectedSrfData?.uom || ""} className="w-full px-3 py-2 text-sm bg-slate-100 border border-slate-200 rounded-lg text-slate-500" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-indigo-700 mb-1.5">Remark</label>
                    <Controller
                      name="remark"
                      control={control}
                      render={({ field }) => (
                        <textarea {...field} disabled={readOnlyMode} rows={3} className="w-full px-3 py-2 text-sm bg-indigo-50/50 border border-indigo-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 disabled:opacity-60" placeholder="Enter remarks..." />
                      )}
                    />
                  </div>
                </div>
             </div>
          </div>
        </div>

        {/* Right Column - SRF Details View */}
        <div className="space-y-6">
           <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 shadow-inner min-h-full">
              <h3 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4 flex items-center gap-2">
                <ClipboardList size={16} className="text-slate-500" />
                Subcon Request Form Details
              </h3>
              
              {selectedSrfData ? (
                <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                  <DetailItem label="WO No" value={selectedSrfData.woNo || "—"} />
                  <DetailItem label="Date Required" value={selectedSrfData.dateRequired ? new Date(selectedSrfData.dateRequired).toLocaleDateString() : "—"} />
                  
                  <div className="col-span-2">
                    <DetailItem label="Part Description" value={selectedSrfData.partDescription || "—"} />
                  </div>
                  
                  <DetailItem label="Main Process" value={selectedSrfData.mainProcess || "—"} />
                  <DetailItem label="Routing Process" value={selectedSrfData.routingProcess || "—"} />
                  
                  <div className="col-span-2">
                    <DetailItem label="In-Process Description" value={selectedSrfData.inProcessDescription || "—"} />
                  </div>

                  <DetailItem label="Acknowledged Qty" value={selectedSrfData.acknowledgedQuantity} highlight />
                  <DetailItem label="UOM" value={selectedSrfData.uom} />
                  
                  <DetailItem label="Unit Price" value={Number(selectedSrfData.unitPrice).toFixed(2)} />
                  <DetailItem label="Amount" value={Number(selectedSrfData.amount).toFixed(2)} />
                  
                  <DetailItem label="Hardness" value={selectedSrfData.hardness || "—"} />
                  <DetailItem label="Thickness" value={selectedSrfData.thickness || "—"} />
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
                   Select an SRF No to view details.
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value, highlight }: { label: string; value: any; highlight?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-sm font-medium ${highlight ? "text-indigo-600 bg-indigo-50 px-2 py-1 rounded w-max border border-indigo-100" : "text-slate-800"}`}>
        {value}
      </p>
    </div>
  );
}
