"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowLeft, Plus, Trash2, Save, FileText } from "lucide-react";

type FormData = {
  companies: { id: string; companyName: string; allowPoForWo: boolean }[];
  employees: { id: string; name: string; email: string; code: string }[];
  workOrders: { workOrderNo: string; jobDescription: string | null }[];
  materials: { id: string; partNo: string | null; description: string; shape: string; size: string | null }[];
  uoms: { id: string; uomName: string }[];
};

type Item = {
  id?: string;
  fromMaterialProfile: boolean;
  materialProfileId: string;
  material: string;
  description: string;
  shape: string;
  size: string;
  uomId: string;
  quantity: string;
  cancelQuantity: string;
  deliveryDate: string;
  remark: string;
  poQuantityIssued: string;
};

export default function PurchaseRequisitionEditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const isNew = id === "new";

  const [data, setData] = useState<FormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [readOnly, setReadOnly] = useState(false);
  const [meta, setMeta] = useState<{ prNo?: string; revision?: number; status?: string; poStatus?: string }>({});

  const [companyId, setCompanyId] = useState("");
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [workOrderNo, setWorkOrderNo] = useState("");
  const [requestedById, setRequestedById] = useState("");
  const [remark, setRemark] = useState("");
  const [items, setItems] = useState<Item[]>([
    {
      fromMaterialProfile: true,
      materialProfileId: "",
      material: "",
      description: "",
      shape: "",
      size: "",
      uomId: "",
      quantity: "1.00",
      cancelQuantity: "0.00",
      deliveryDate: new Date().toISOString().slice(0, 10),
      remark: "",
      poQuantityIssued: "0.00",
    },
  ]);

  useEffect(() => {
    (async () => {
      try {
        const fd = await fetch("/api/purchasing/purchase-requisition/form-data").then((r) => r.json());
        setData(fd);

        if (!isNew) {
          const pr = await fetch(`/api/purchasing/purchase-requisition/${id}`).then((r) => r.json());
          if (pr.error) throw new Error(pr.error);
          setMeta({ prNo: pr.prNo, revision: pr.revision, status: pr.status, poStatus: pr.poStatus });
          setReadOnly(pr.status !== "Draft");
          setCompanyId(pr.companyId);
          setDate(new Date(pr.date).toISOString().slice(0, 10));
          setWorkOrderNo(pr.workOrderNo || "");
          setRequestedById(pr.requestedById);
          setRemark(pr.remark || "");
          setItems(
            pr.items.map((it: any) => ({
              id: it.id,
              fromMaterialProfile: it.fromMaterialProfile,
              materialProfileId: it.materialProfileId || "",
              material: it.material || "",
              description: it.description,
              shape: it.shape || "",
              size: it.size || "",
              uomId: it.uomId,
              quantity: Number(it.quantity).toFixed(2),
              cancelQuantity: Number(it.cancelQuantity || 0).toFixed(2),
              deliveryDate: new Date(it.deliveryDate).toISOString().slice(0, 10),
              remark: it.remark || "",
              poQuantityIssued: Number(it.poQuantityIssued || 0).toFixed(2),
            })),
          );
        } else {
          // Defaults
          if (fd.companies.length > 0) setCompanyId(fd.companies[0].id);
          if (fd.employees.length > 0) setRequestedById(fd.employees[0].id);
        }
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isNew]);

  const selectedCompany = useMemo(
    () => data?.companies.find((c) => c.id === companyId) || null,
    [data, companyId],
  );

  const selectedWorkOrder = useMemo(
    () => data?.workOrders.find((w) => w.workOrderNo === workOrderNo) || null,
    [data, workOrderNo],
  );

  // If company doesn't allow WO, clear selection
  useEffect(() => {
    if (selectedCompany && !selectedCompany.allowPoForWo) {
      setWorkOrderNo("");
    }
  }, [selectedCompany]);

  function updateItem(idx: number, patch: Partial<Item>) {
    setItems((cur) =>
      cur.map((it, i) => {
        if (i !== idx) return it;

        const updated = { ...it, ...patch };

        // Auto-populate from profile
        if (patch.fromMaterialProfile !== undefined) {
          // Toggle profile/freetext
          updated.materialProfileId = "";
          updated.material = "";
          updated.description = "";
          updated.shape = "";
          updated.size = "";
        } else if (updated.fromMaterialProfile && patch.materialProfileId) {
          const profile = data?.materials.find((m) => m.id === patch.materialProfileId);
          if (profile) {
            updated.material = profile.partNo || "";
            updated.description = profile.description;
            updated.shape = profile.shape;
            updated.size = profile.size || "";
          }
        }

        return updated;
      }),
    );
  }

  function addItem() {
    setItems((cur) => [
      ...cur,
      {
        fromMaterialProfile: true,
        materialProfileId: "",
        material: "",
        description: "",
        shape: "",
        size: "",
        uomId: "",
        quantity: "1.00",
        cancelQuantity: "0.00",
        deliveryDate: new Date().toISOString().slice(0, 10),
        remark: "",
        poQuantityIssued: "0.00",
      },
    ]);
  }

  function removeItem(idx: number) {
    setItems((cur) => cur.filter((_, i) => i !== idx));
  }

  async function onSave() {
    setError("");

    // Date validations
    const inputDate = new Date(date);
    inputDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (inputDate < today) {
      return setError("Backdate is not allowed for Purchase Requisition Date.");
    }

    if (!companyId) return setError("Company is required");
    if (!requestedById) return setError("Requested By (Requisitioner) is required");
    if (!items.length) return setError("At least one item is required");

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const ln = i + 1;
      if (it.fromMaterialProfile && !it.materialProfileId) {
        return setError(`Line ${ln}: Material Profile is required`);
      }
      if (!it.fromMaterialProfile && !it.description.trim()) {
        return setError(`Line ${ln}: Description is required for free-text items`);
      }
      if (!it.uomId) {
        return setError(`Line ${ln}: UOM is required`);
      }
      const qty = Number(it.quantity);
      if (isNaN(qty) || qty <= 0) {
        return setError(`Line ${ln}: Quantity must be a positive number`);
      }
      const cancel = Number(it.cancelQuantity || 0);
      if (isNaN(cancel) || cancel < 0) {
        return setError(`Line ${ln}: Cancel Quantity cannot be negative`);
      }
      if (cancel > qty) {
        return setError(`Line ${ln}: Cancel Quantity cannot exceed Quantity`);
      }
      if (!it.deliveryDate) {
        return setError(`Line ${ln}: Delivery Date is required`);
      }
    }

    setSaving(true);
    try {
      const payload = {
        companyId,
        date,
        workOrderNo: workOrderNo || null,
        requestedById,
        remark,
        items: items.map((it, idx) => ({
          fromMaterialProfile: it.fromMaterialProfile,
          materialProfileId: it.fromMaterialProfile ? it.materialProfileId : null,
          material: it.material || null,
          description: it.description,
          shape: it.shape || null,
          size: it.size || null,
          uomId: it.uomId,
          quantity: Number(it.quantity),
          cancelQuantity: Number(it.cancelQuantity || 0),
          deliveryDate: it.deliveryDate,
          remark: it.remark || null,
          sortOrder: idx,
        })),
      };

      const url = isNew ? `/api/purchasing/purchase-requisition` : `/api/purchasing/purchase-requisition/${id}`;
      const res = await fetch(url, {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Save failed");
      }

      const saved = await res.json();
      router.push(`/dashboard/saved?module=Purchase Requisition&id=${saved.prNo || saved.id}&viewUrl=/dashboard/purchasing/purchase-requisition/${saved.id}&backUrl=/dashboard/purchasing/purchase-requisition`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-sm text-blue-500">Loading…</p>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between pb-6 border-b border-blue-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-blue-400 font-semibold uppercase mb-1">
            <Link href="/dashboard/purchasing/purchase-requisition" className="hover:text-blue-600 inline-flex items-center gap-1">
              <ArrowLeft size={12} /> Purchase Requisitions
            </Link>
            {!isNew && meta.prNo && (
              <>
                <span>/</span>
                <span className="text-blue-500">
                  {meta.prNo}-R{meta.revision}
                </span>
                <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] border bg-blue-50 text-blue-700 border-blue-200">
                  {meta.status}
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600">
              <FileText size={20} />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-blue-900">
              {isNew ? "New Requisition" : "Edit Requisition"}
            </h2>
          </div>
        </div>

        <button
          onClick={onSave}
          disabled={saving || readOnly}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 rounded-lg shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {saving ? "Saving…" : "Save"}
        </button>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-sm text-rose-700">{error}</div>
      )}
      {readOnly && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-700">
          This purchase requisition is <strong>{meta.status}</strong> — read-only.
        </div>
      )}

      {/* Header Fields */}
      <div className="bg-white border border-blue-200 rounded-xl shadow-sm p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Field label="Company" required>
          <select
            value={companyId}
            disabled={readOnly || !isNew}
            onChange={(e) => setCompanyId(e.target.value)}
            className={inputCls}
          >
            <option value="">— Select —</option>
            {data?.companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.companyName}
              </option>
            ))}
          </select>
        </Field>

        <Field label="PR Date" required>
          <input
            type="date"
            value={date}
            disabled={readOnly}
            onChange={(e) => setDate(e.target.value)}
            className={inputCls}
          />
        </Field>

        <Field label="Requested By (Employee)" required>
          <select
            value={requestedById}
            disabled={readOnly}
            onChange={(e) => setRequestedById(e.target.value)}
            className={inputCls}
          >
            <option value="">— Select —</option>
            {data?.employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name} ({e.code})
              </option>
            ))}
          </select>
        </Field>

        {(!selectedCompany || selectedCompany.allowPoForWo) && (
          <Field label="Work Order">
            <select
              value={workOrderNo}
              disabled={readOnly}
              onChange={(e) => setWorkOrderNo(e.target.value)}
              className={inputCls}
            >
              <option value="">— None (Non Work Order) —</option>
              {data?.workOrders.map((w) => (
                <option key={w.workOrderNo} value={w.workOrderNo}>
                  {w.workOrderNo}
                </option>
              ))}
            </select>
          </Field>
        )}

        {workOrderNo && (
          <div className="md:col-span-2">
            <Field label="Work Description">
              <input
                type="text"
                readOnly
                value={selectedWorkOrder?.jobDescription || ""}
                placeholder="No description available"
                className={`${inputCls} bg-slate-50`}
              />
            </Field>
          </div>
        )}
      </div>

      {/* Items Section */}
      <div className="bg-white border border-blue-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-3 border-b border-blue-200 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-blue-900">Requisition Items</h3>
          {!readOnly && (
            <button
              onClick={addItem}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-md active:scale-95 cursor-pointer"
            >
              <Plus size={14} /> Add Item
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[1800px]">
            <thead className="text-xs text-blue-500 bg-blue-50/50 uppercase tracking-wider">
              <tr>
                <th className="px-3 py-2 text-left w-32">Type</th>
                <th className="px-3 py-2 text-left w-64">Material Profile / Code</th>
                <th className="px-3 py-2 text-left min-w-[200px]">Description</th>
                <th className="px-3 py-2 text-left w-40">Shape</th>
                <th className="px-3 py-2 text-left w-40">Size</th>
                <th className="px-3 py-2 text-left w-32">UOM</th>
                <th className="px-3 py-2 text-right w-32">Qty</th>
                <th className="px-3 py-2 text-right w-32">Cancel Qty</th>
                <th className="px-3 py-2 text-right w-32">PR Qty</th>
                <th className="px-3 py-2 text-left w-48">Delivery Date</th>
                <th className="px-3 py-2 text-right w-32">PO Qty</th>
                <th className="px-3 py-2 text-right w-32">Bal Req</th>
                <th className="px-3 py-2 text-left w-48">Remark</th>
                {!readOnly && <th className="w-10"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-100">
              {items.map((it, idx) => {
                const qtyVal = Number(it.quantity) || 0;
                const cancelVal = Number(it.cancelQuantity) || 0;
                const prQty = qtyVal - cancelVal;
                const poQty = Number(it.poQuantityIssued) || 0;
                const balReq = prQty - poQty;

                return (
                  <tr key={idx} className="hover:bg-blue-50/10">
                    <td className="px-3 py-2 align-top">
                      <select
                        value={it.fromMaterialProfile ? "Profile" : "Free"}
                        disabled={readOnly}
                        onChange={(e) => updateItem(idx, { fromMaterialProfile: e.target.value === "Profile" })}
                        className={inputCls}
                      >
                        <option value="Profile">Profile</option>
                        <option value="Free">FreeText</option>
                      </select>
                    </td>

                    <td className="px-3 py-2 align-top">
                      {it.fromMaterialProfile ? (
                        <select
                          value={it.materialProfileId}
                          disabled={readOnly}
                          onChange={(e) => updateItem(idx, { materialProfileId: e.target.value })}
                          className={inputCls}
                        >
                          <option value="">— Select —</option>
                          {data?.materials.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.partNo ? `${m.partNo} — ` : ""}{m.description.slice(0, 30)}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={it.material}
                          disabled={readOnly}
                          onChange={(e) => updateItem(idx, { material: e.target.value })}
                          className={inputCls}
                          placeholder="e.g. PART-A"
                        />
                      )}
                    </td>

                    <td className="px-3 py-2 align-top">
                      <textarea
                        rows={1}
                        value={it.description}
                        disabled={readOnly || it.fromMaterialProfile}
                        onChange={(e) => updateItem(idx, { description: e.target.value })}
                        className={inputCls}
                        placeholder="Material description"
                      />
                    </td>

                    <td className="px-3 py-2 align-top">
                      <input
                        type="text"
                        value={it.shape}
                        disabled={readOnly || it.fromMaterialProfile}
                        onChange={(e) => updateItem(idx, { shape: e.target.value })}
                        className={inputCls}
                        placeholder="Shape"
                      />
                    </td>

                    <td className="px-3 py-2 align-top">
                      <input
                        type="text"
                        value={it.size}
                        disabled={readOnly || it.fromMaterialProfile}
                        onChange={(e) => updateItem(idx, { size: e.target.value })}
                        className={inputCls}
                        placeholder="Size"
                      />
                    </td>

                    <td className="px-3 py-2 align-top">
                      <select
                        value={it.uomId}
                        disabled={readOnly}
                        onChange={(e) => updateItem(idx, { uomId: e.target.value })}
                        className={inputCls}
                      >
                        <option value="">—</option>
                        {data?.uoms.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.uomName}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="px-3 py-2 align-top">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={it.quantity}
                        disabled={readOnly}
                        onChange={(e) => updateItem(idx, { quantity: e.target.value })}
                        className={`${inputCls} text-right`}
                      />
                    </td>

                    <td className="px-3 py-2 align-top">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={it.cancelQuantity}
                        disabled={readOnly}
                        onChange={(e) => updateItem(idx, { cancelQuantity: e.target.value })}
                        className={`${inputCls} text-right`}
                      />
                    </td>

                    <td className="px-3 py-2 align-top text-right font-mono text-blue-900 font-medium">
                      {prQty.toFixed(2)}
                    </td>

                    <td className="px-3 py-2 align-top">
                      <input
                        type="date"
                        value={it.deliveryDate}
                        disabled={readOnly}
                        onChange={(e) => updateItem(idx, { deliveryDate: e.target.value })}
                        className={inputCls}
                      />
                    </td>

                    <td className="px-3 py-2 align-top text-right font-mono text-slate-500">
                      {poQty.toFixed(2)}
                    </td>

                    <td className="px-3 py-2 align-top text-right font-mono text-blue-900 font-semibold">
                      {balReq.toFixed(2)}
                    </td>

                    <td className="px-3 py-2 align-top">
                      <input
                        type="text"
                        value={it.remark}
                        disabled={readOnly}
                        onChange={(e) => updateItem(idx, { remark: e.target.value })}
                        className={inputCls}
                        placeholder="Remark"
                      />
                    </td>

                    {!readOnly && (
                      <td className="px-2 py-2 align-top text-center">
                        <button
                          onClick={() => removeItem(idx)}
                          className="p-1.5 rounded-md hover:bg-rose-50 text-rose-500 cursor-pointer"
                          title="Remove"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* General Remarks */}
      <div className="bg-white border border-blue-200 rounded-xl shadow-sm p-6 space-y-2">
        <Field label="Remark / Special Instructions">
          <textarea
            rows={3}
            value={remark}
            disabled={readOnly}
            onChange={(e) => setRemark(e.target.value)}
            className={inputCls}
            placeholder="Input any additional details for this purchase requisition..."
          />
        </Field>
      </div>
    </div>
  );
}

const inputCls =
  "w-full px-3 py-2 text-sm bg-blue-50 border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500";

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-blue-700 mb-1">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      {children}
    </div>
  );
}
