"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2, Plus, Trash2, Send, AlertCircle } from "lucide-react";

export default function DeliveryOrderFormPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [formData, setFormData] = useState<any>({
    doNo: "",
    date: new Date().toISOString().split("T")[0],
    customerId: "",
    salesOrderId: "",
    cocRequired: false,
    items: [],
  });

  const [metadata, setMetadata] = useState<any>({
    customers: [],
    salesOrders: [],
    workOrders: [],
    uoms: [],
  });

  const [errorMsg, setErrorMsg] = useState("");
  const [status, setStatus] = useState("Draft");

  useEffect(() => {
    fetchMetadata();
    if (isEdit) {
      fetchDeliveryOrder();
    }
  }, [id]);

  const fetchMetadata = async () => {
    try {
      const res = await fetch("/api/sales/delivery-order/form-data");
      if (res.ok) {
        const data = await res.json();
        setMetadata(data);
      }
    } catch (err) {
      console.error("Failed to fetch metadata");
    }
  };

  const fetchDeliveryOrder = async () => {
    try {
      const res = await fetch(`/api/sales/delivery-order/${id}`);
      if (!res.ok) throw new Error("Failed to fetch DO details");
      const data = await res.json();
      setFormData({
        ...data,
        date: new Date(data.date).toISOString().split("T")[0],
      });
      setStatus(data.status);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.doNo || !formData.customerId || !formData.salesOrderId) {
      setErrorMsg("Please fill in DO No, Customer, and Sales Order.");
      return;
    }
    if (formData.items.length === 0) {
      setErrorMsg("Please add at least one work order item.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    try {
      const url = isEdit ? `/api/sales/delivery-order/${id}` : "/api/sales/delivery-order";
      const method = isEdit ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to save Delivery Order");
      
      router.push(`/dashboard/saved?module=Delivery Order&id=${resData.doNo || resData.id || ''}&viewUrl=/dashboard/sales/delivery-order/form?id=${resData.id}&backUrl=/dashboard/sales/delivery-order`);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!confirm("Are you sure you want to submit? This action cannot be undone.")) return;
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch(`/api/sales/delivery-order/${id}/submit`, { method: "POST" });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to submit");
      router.push(`/dashboard/saved?module=Delivery Order (Submitted)&id=${resData.doNo || resData.id || ''}&viewUrl=/dashboard/sales/delivery-order/form?id=${resData.id}&backUrl=/dashboard/sales/delivery-order`);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    setFormData((prev: any) => ({
      ...prev,
      items: [
        ...prev.items,
        { workOrderNo: "", quantity: 0, uomId: "", deliveryDate: "" },
      ],
    }));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    
    // Auto-fill delivery date and quantity from WorkOrder metadata if selected
    if (field === "workOrderNo") {
      const wo = metadata.workOrders.find((w: any) => w.workOrderNo === value);
      if (wo) {
        newItems[index].quantity = wo.quantity || 0;
        newItems[index].deliveryDate = wo.deliveryDate ? new Date(wo.deliveryDate).toISOString().split("T")[0] : "";
        // Find UOM by name if it exists
        if (wo.uom) {
           const u = metadata.uoms.find((um: any) => um.uomName === wo.uom);
           if (u) newItems[index].uomId = u.id;
        }
      }
    }
    
    setFormData((prev: any) => ({ ...prev, items: newItems }));
  };

  const removeItem = (index: number) => {
    const newItems = [...formData.items];
    newItems.splice(index, 1);
    setFormData((prev: any) => ({ ...prev, items: newItems }));
  };

  if (initialLoading) {
    return (
      <div className="p-8 flex justify-center items-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const isDraft = status === "Draft";

  // Filter Sales Orders and Work Orders based on selected Customer
  const filteredSalesOrders = formData.customerId 
    ? metadata.salesOrders.filter((so: any) => so.customerId === formData.customerId)
    : metadata.salesOrders;

  const filteredWorkOrders = formData.customerId
    ? metadata.workOrders.filter((wo: any) => wo.customerId === formData.customerId)
    : metadata.workOrders;

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6 pb-24">
      <div className="flex items-center justify-between pb-6 border-b border-blue-200">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/sales/delivery-order" className="p-2 bg-blue-50 text-blue-500 hover:bg-blue-100 rounded-full transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-blue-900">{isEdit ? "Edit Delivery Order" : "New Delivery Order"}</h1>
            <p className="text-sm text-blue-500">
              {isEdit ? `Editing DO: ${formData.doNo}` : "Create a new delivery order to track delivered goods"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           {isEdit && isDraft && (
             <button
               onClick={handleSubmit}
               disabled={loading}
               className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-lg font-semibold transition-colors disabled:opacity-50"
             >
               <Send size={16} /> Submit DO
             </button>
           )}
           {isDraft && (
             <button
               onClick={handleSave}
               disabled={loading}
               className="inline-flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-lg font-semibold shadow-md active:scale-95 transition-all disabled:opacity-50"
             >
               {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
               Save
             </button>
           )}
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-center gap-3">
          <AlertCircle size={18} />
          <p className="text-sm font-medium">{errorMsg}</p>
        </div>
      )}

      {/* Main Form Fields */}
      <div className="bg-white rounded-xl shadow-sm border border-blue-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="text-sm font-semibold text-blue-900">Delivery Order No <span className="text-rose-500">*</span></label>
            <input
              type="text"
              value={formData.doNo}
              onChange={(e) => setFormData({ ...formData, doNo: e.target.value })}
              disabled={!isDraft}
              className="w-full px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
              placeholder="E.g., DO-2023-001"
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-sm font-semibold text-blue-900">Date <span className="text-rose-500">*</span></label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              disabled={!isDraft}
              className="w-full px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-blue-900">Customer <span className="text-rose-500">*</span></label>
            <select
              value={formData.customerId}
              onChange={(e) => setFormData({ ...formData, customerId: e.target.value, salesOrderId: "" })} // Reset SO when customer changes
              disabled={!isDraft}
              className="w-full px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
            >
              <option value="">Select Customer...</option>
              {metadata.customers.map((c: any) => (
                <option key={c.id} value={c.id}>{c.customerName}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-blue-900">Sales Order <span className="text-rose-500">*</span></label>
            <select
              value={formData.salesOrderId}
              onChange={(e) => setFormData({ ...formData, salesOrderId: e.target.value })}
              disabled={!isDraft || !formData.customerId}
              className="w-full px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
            >
              <option value="">Select Sales Order...</option>
              {filteredSalesOrders.map((so: any) => (
                <option key={so.id} value={so.id}>{so.orderNo} {so.customerPoRef ? `(${so.customerPoRef})` : ""}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1 md:col-span-2 flex items-center gap-3">
             <input 
               type="checkbox" 
               id="cocRequired"
               checked={formData.cocRequired}
               onChange={(e) => setFormData({ ...formData, cocRequired: e.target.checked })}
               disabled={!isDraft}
               className="w-5 h-5 rounded border-blue-300 text-indigo-600 focus:ring-indigo-500"
             />
             <label htmlFor="cocRequired" className="text-sm font-semibold text-blue-900 select-none">
               Requires Certificate Of Conformity (COC)
             </label>
          </div>
        </div>
      </div>

      {/* Items Area */}
      <div className="bg-white rounded-xl shadow-sm border border-blue-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-blue-900">Delivery Items (Work Orders)</h3>
          {isDraft && (
            <button
              onClick={addItem}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
            >
              <Plus size={16} /> Add Item
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="text-xs text-blue-500 bg-blue-50/50 uppercase tracking-wider border-b border-blue-200">
              <tr>
                <th className="px-4 py-3">Work Order No</th>
                <th className="px-4 py-3 w-32">Quantity</th>
                <th className="px-4 py-3 w-40">UOM</th>
                <th className="px-4 py-3 w-48">Delivery Date</th>
                {isDraft && <th className="px-4 py-3 w-16"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-100">
              {formData.items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-blue-400">
                    No items added yet. Click &quot;Add Item&quot; to begin.
                  </td>
                </tr>
              ) : (
                formData.items.map((item: any, index: number) => (
                  <tr key={index} className="hover:bg-blue-50/30">
                    <td className="px-4 py-2">
                      <select
                        value={item.workOrderNo}
                        onChange={(e) => updateItem(index, "workOrderNo", e.target.value)}
                        disabled={!isDraft}
                        className="w-full px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
                      >
                        <option value="">Select Work Order...</option>
                        {filteredWorkOrders.map((wo: any) => (
                          <option key={wo.workOrderNo} value={wo.workOrderNo}>{wo.workOrderNo}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2">
                       <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, "quantity", e.target.value)}
                        disabled={!isDraft}
                        className="w-full px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <select
                        value={item.uomId || ""}
                        onChange={(e) => updateItem(index, "uomId", e.target.value)}
                        disabled={!isDraft}
                        className="w-full px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
                      >
                        <option value="">Select UOM...</option>
                        {metadata.uoms.map((u: any) => (
                          <option key={u.id} value={u.id}>{u.uomName}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2">
                       <input
                        type="date"
                        value={item.deliveryDate ? item.deliveryDate.split("T")[0] : ""}
                        onChange={(e) => updateItem(index, "deliveryDate", e.target.value)}
                        disabled={!isDraft}
                        className="w-full px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
                      />
                    </td>
                    {isDraft && (
                      <td className="px-4 py-2 text-right">
                        <button
                          onClick={() => removeItem(index)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
