"use client";
import { SearchableSelect } from "@/components/SearchableSelect";
import { customConfirm } from "@/lib/customConfirm";
import { toast as hotToast } from "react-hot-toast";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowLeft, CheckCircle2, XCircle, FileText } from "lucide-react";
type Item = {
  id?: string;
  fromMaterialProfile: boolean;
  materialProfileId: string;
  purchaseRequisitionItemId?: string;
  material: string;
  description: string;
  supplierMaterialNo: string;
  shape: string;
  size: string;
  poUomId: string;
  quantity: string;
  unitPrice: string;
  amount: string;
  conversion: string;
  internalUomId: string;
  internalQuantity: string;
  deliveryDate: string;
  remark: string;
};

export default function PurchaseOrderApprovalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [meta, setMeta] = useState<{ poNo?: string; revision?: number; status?: string }>({});

  const [companyId, setCompanyId] = useState("");
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [workOrderNo, setWorkOrderNo] = useState("");
  const [purchaseRequisitionId, setPurchaseRequisitionId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [contactPersonId, setContactPersonId] = useState("");
  const [supplierEmail, setSupplierEmail] = useState("");
  const [supplierTel, setSupplierTel] = useState("");
  const [supplierFax, setSupplierFax] = useState("");
  const [supplierMobile, setSupplierMobile] = useState("");
  const [purchaserId, setPurchaserId] = useState("");
  const [currencyId, setCurrencyId] = useState("");
  const [exchangeRate, setExchangeRate] = useState("1.00");
  const [taxTypeId, setTaxTypeId] = useState("");
  const [taxRate, setTaxRate] = useState("0.00");
  const [amountBeforeTax, setAmountBeforeTax] = useState("0.00");
  const [taxAmount, setTaxAmount] = useState("0.00");
  const [amountAfterTax, setAmountAfterTax] = useState("0.00");
  const [millCertificate, setMillCertificate] = useState(false);
  const [certOfConformance, setCertOfConformance] = useState(false);

  const [poRemark, setPoRemark] = useState("");
  const [items, setItems] = useState<Item[]>([]);

  // Approval specific
  const [approvalRemark, setApprovalRemark] = useState("");

  const [companies, setCompanies] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [taxes, setTaxes] = useState<any[]>([]);
  const [uoms, setUoms] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [prs, setPrs] = useState<any[]>([]);
  const [workOrders, setWorkOrders] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const fd = await fetch("/api/purchasing/purchase-order/form-data").then((r) => r.json());
        setCompanies(fd.companies || []);
        setSuppliers(fd.suppliers || []);
        setEmployees(fd.employees || []);
        setCurrencies(fd.currencies || []);
        setTaxes(fd.taxes || []);
        setUoms(fd.uoms || []);
        setMaterials(fd.materials || []);
        setPrs(fd.purchaseRequisitions || []);
        setWorkOrders(fd.workOrders || []);

        const po = await fetch(`/api/purchasing/purchase-order/${id}`).then((r) => r.json());
        if (po.error) throw new Error(po.error);
        
        setMeta({ poNo: po.poNo, revision: po.revision, status: po.status });
        setCompanyId(po.companyId);
        setDate(new Date(po.date).toISOString().slice(0, 10));
        setWorkOrderNo(po.workOrderNo || "");
        setPurchaseRequisitionId(po.purchaseRequisitionId || "");
        setSupplierId(po.supplierId);
        setContactPersonId(po.contactPersonId || "");
        setSupplierEmail(po.email || "");
        setSupplierTel(po.telNo || "");
        setSupplierFax(po.faxNo || "");
        setSupplierMobile(po.mobileNo || "");
        setPurchaserId(po.purchaserId);
        setCurrencyId(po.currencyId);
        setExchangeRate(Number(po.exchangeRate || 1).toFixed(4));
        setTaxTypeId(po.taxTypeId);
        setTaxRate(Number(po.taxRate || 0).toFixed(2));
        setAmountBeforeTax(Number(po.amountBeforeTax || 0).toFixed(2));
        setTaxAmount(Number(po.taxAmount || 0).toFixed(2));
        setAmountAfterTax(Number(po.amountAfterTax || 0).toFixed(2));
        setMillCertificate(po.millCertificate || false);
        setCertOfConformance(po.certOfConformance || false);
        setPoRemark(po.remark || "");
        setItems(
          po.items.map((it: any) => ({
            id: it.id,
            fromMaterialProfile: it.fromMaterialProfile,
            materialProfileId: it.materialProfileId || "",
            purchaseRequisitionItemId: it.purchaseRequisitionItemId || "",
            material: it.material || "",
            description: it.description,
            supplierMaterialNo: it.supplierMaterialNo || "",
            shape: it.shape || "",
            size: it.size || "",
            poUomId: it.poUomId,
            quantity: Number(it.quantity).toFixed(2),
            unitPrice: Number(it.unitPrice).toFixed(4),
            amount: Number(it.amount).toFixed(2),
            conversion: Number(it.conversion).toFixed(4),
            internalUomId: it.internalUomId || "",
            internalQuantity: Number(it.internalQuantity || 0).toFixed(2),
            deliveryDate: new Date(it.deliveryDate).toISOString().slice(0, 10),
            remark: it.remark || "",
          })),
        );
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleAction = async (action: "approve" | "reject") => {
    if (action === "reject" && !approvalRemark.trim()) {
      hotToast.error("Please provide an approval remark for rejection.");
      return;
    }
    
    if (!await customConfirm(`Are you sure you want to ${action} this Purchase Order?`)) {
      return;
    }

    setSubmitting(true);
    try {
      // Current user mock - in real app get from session
      const currentUserId = "mock-user-id"; 

      const res = await fetch(`/api/purchasing/purchase-order-approval/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, remark: approvalRemark, currentUserId }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Failed to ${action}`);
      }

      router.push("/dashboard/purchasing/purchase-order-approval");
      router.refresh();
    } catch (e: any) {
      hotToast.error(e.message);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-sm text-blue-500">Loading details…</p>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between pb-6 border-b border-blue-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-blue-400 font-semibold uppercase mb-1">
            <Link href="/dashboard/purchasing/purchase-order-approval" className="hover:text-blue-600 inline-flex items-center gap-1">
              <ArrowLeft size={12} /> Purchase Order Approvals
            </Link>
            {meta.poNo && (
              <>
                <span>/</span>
                <span className="text-blue-500">
                  {meta.poNo}-R{meta.revision}
                </span>
                <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] border bg-sky-50 text-sky-700 border-sky-200">
                  {meta.status}
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600">
              <CheckCircle2 size={20} />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-blue-900">
              Review Purchase Order
            </h2>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-sm text-rose-700">{error}</div>
      )}

      {/* Header Fields - Read Only */}
      <div className="bg-white border border-blue-200 rounded-xl shadow-sm p-6 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <Field label="Company">
          <SearchableSelect value={companyId} disabled className={inputCls}>
            <option value="">— Select —</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>{c.companyName}</option>
            ))}
          </SearchableSelect>
        </Field>

        <Field label="PO Date">
          <input type="date" value={date} disabled className={inputCls} />
        </Field>

        <Field label="Purchaser">
          <SearchableSelect value={purchaserId} disabled className={inputCls}>
            <option value="">— Select —</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>{e.name} ({e.code})</option>
            ))}
          </SearchableSelect>
        </Field>

        <Field label="PR No">
          <SearchableSelect value={purchaseRequisitionId} disabled className={inputCls}>
            <option value="">— Independent PO —</option>
            {prs.map((pr) => (
              <option key={pr.id} value={pr.id}>{pr.prNo}</option>
            ))}
          </SearchableSelect>
        </Field>

        <Field label="Supplier">
          <SearchableSelect value={supplierId} disabled className={inputCls}>
            <option value="">— Select Supplier —</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>{s.supplierName}</option>
            ))}
          </SearchableSelect>
        </Field>

        <Field label="Supplier Contact Person">
          <SearchableSelect value={contactPersonId} disabled className={inputCls}>
            <option value="">— Select —</option>
            {suppliers.find(s => s.id === supplierId)?.contactPersons?.map((cp: any) => (
              <option key={cp.id} value={cp.id}>{cp.contactPersonName}</option>
            ))}
          </SearchableSelect>
        </Field>

        <Field label="Supplier Email">
          <input type="email" value={supplierEmail} disabled className={inputCls} />
        </Field>

        <Field label="Supplier Tel No">
          <input type="text" value={supplierTel} disabled className={inputCls} />
        </Field>

        <Field label="Supplier Fax No">
          <input type="text" value={supplierFax} disabled className={inputCls} />
        </Field>

        <Field label="Supplier Mobile No">
          <input type="text" value={supplierMobile} disabled className={inputCls} />
        </Field>
        
        <Field label="Work Order">
          <SearchableSelect value={workOrderNo} disabled className={inputCls}>
            <option value="">— None (Non Work Order) —</option>
            {workOrders.map((w) => (
              <option key={w.workOrderNo} value={w.workOrderNo}>{w.workOrderNo}</option>
            ))}
          </SearchableSelect>
        </Field>

        <Field label="Currency">
          <SearchableSelect value={currencyId} disabled className={inputCls}>
            <option value="">— Select —</option>
            {currencies.map((c) => (
              <option key={c.id} value={c.id}>{c.code}</option>
            ))}
          </SearchableSelect>
        </Field>

        <Field label="Exchange Rate">
          <input type="number" value={exchangeRate} disabled className={inputCls} />
        </Field>

        <Field label="Tax Code">
          <SearchableSelect value={taxTypeId} disabled className={inputCls}>
            <option value="">— Select —</option>
            {taxes.map((t) => (
              <option key={t.id} value={t.id}>{t.taxType}</option>
            ))}
          </SearchableSelect>
        </Field>

        <Field label="Tax Rate %">
          <input type="number" value={taxRate} disabled className={inputCls} />
        </Field>
      </div>

      {/* Items Section - Read Only */}
      <div className="bg-white border border-blue-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-3 border-b border-blue-200">
          <h3 className="text-sm font-semibold text-blue-900">Purchase Order Items</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[2200px]">
            <thead className="text-xs text-blue-500 bg-blue-50/50 uppercase tracking-wider">
              <tr>
                <th className="px-3 py-2 text-left w-24">Type</th>
                <th className="px-3 py-2 text-left w-48">Material Profile / Code</th>
                <th className="px-3 py-2 text-left w-56">Description</th>
                <th className="px-3 py-2 text-left w-40">Supplier Part No</th>
                <th className="px-3 py-2 text-left w-32">Shape</th>
                <th className="px-3 py-2 text-left w-32">Size</th>
                <th className="px-3 py-2 text-left w-28">PO UOM</th>
                <th className="px-3 py-2 text-right w-24">Qty</th>
                <th className="px-3 py-2 text-right w-32">Unit Price</th>
                <th className="px-3 py-2 text-right w-32">Amount</th>
                <th className="px-3 py-2 text-right w-24">Conv</th>
                <th className="px-3 py-2 text-left w-28">Int UOM</th>
                <th className="px-3 py-2 text-right w-24">Int Qty</th>
                <th className="px-3 py-2 text-left w-40">Delivery Date</th>
                <th className="px-3 py-2 text-left min-w-[150px]">Remark</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-100">
              {items.map((it, idx) => (
                <tr key={idx} className="bg-white">
                  <td className="px-3 py-2 align-top">
                    <input type="text" value={it.fromMaterialProfile ? "Profile" : "FreeText"} disabled className={inputCls} />
                  </td>
                  <td className="px-3 py-2 align-top">
                    {it.fromMaterialProfile ? (
                      <SearchableSelect value={it.materialProfileId} disabled className={inputCls}>
                        <option value="">— Select —</option>
                        {materials.map((m) => (
                          <option key={m.id} value={m.id}>{m.partNo || "N/A"}</option>
                        ))}
                      </SearchableSelect>
                    ) : (
                      <input type="text" value={it.material} disabled className={inputCls} />
                    )}
                  </td>
                  <td className="px-3 py-2 align-top">
                    <textarea rows={1} value={it.description} disabled className={inputCls} />
                  </td>
                  <td className="px-3 py-2 align-top">
                    <input type="text" value={it.supplierMaterialNo} disabled className={inputCls} />
                  </td>
                  <td className="px-3 py-2 align-top">
                    <input type="text" value={it.shape} disabled className={inputCls} />
                  </td>
                  <td className="px-3 py-2 align-top">
                    <input type="text" value={it.size} disabled className={inputCls} />
                  </td>
                  <td className="px-3 py-2 align-top">
                    <SearchableSelect value={it.poUomId} disabled className={inputCls}>
                      <option value="">—</option>
                      {uoms.map((u) => <option key={u.id} value={u.id}>{u.uomName}</option>)}
                    </SearchableSelect>
                  </td>
                  <td className="px-3 py-2 align-top">
                    <input type="number" value={it.quantity} disabled className={`${inputCls} text-right`} />
                  </td>
                  <td className="px-3 py-2 align-top">
                    <input type="number" value={it.unitPrice} disabled className={`${inputCls} text-right`} />
                  </td>
                  <td className="px-3 py-2 align-top text-right font-mono text-blue-900 font-semibold pt-4">
                    {it.amount}
                  </td>
                  <td className="px-3 py-2 align-top">
                    <input type="number" value={it.conversion} disabled className={`${inputCls} text-right`} />
                  </td>
                  <td className="px-3 py-2 align-top">
                    <SearchableSelect value={it.internalUomId} disabled className={inputCls}>
                      <option value="">—</option>
                      {uoms.map((u) => <option key={u.id} value={u.id}>{u.uomName}</option>)}
                    </SearchableSelect>
                  </td>
                  <td className="px-3 py-2 align-top text-right font-mono text-blue-900 pt-4">
                    {it.internalQuantity}
                  </td>
                  <td className="px-3 py-2 align-top">
                    <input type="date" value={it.deliveryDate} disabled className={inputCls} />
                  </td>
                  <td className="px-3 py-2 align-top">
                    <input type="text" value={it.remark} disabled className={inputCls} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Quality Controls and Remarks */}
        <div className="bg-white border border-blue-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm font-medium text-blue-900">
              <input type="checkbox" checked={millCertificate} disabled className="w-4 h-4 text-blue-600 rounded border-blue-300 focus:ring-blue-500 disabled:opacity-50" />
              Mill Certificate
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-blue-900">
              <input type="checkbox" checked={certOfConformance} disabled className="w-4 h-4 text-blue-600 rounded border-blue-300 focus:ring-blue-500 disabled:opacity-50" />
              Cert. of Conformance
            </label>
          </div>
          <Field label="Remark / Special Instructions">
            <textarea rows={3} value={poRemark} disabled className={inputCls} />
          </Field>
        </div>

        {/* Totals Summary */}
        <div className="bg-white border border-blue-200 rounded-xl shadow-sm p-6 flex flex-col justify-end space-y-3">
          <div className="flex items-center justify-between text-sm text-blue-700">
            <span>Amount Before Tax:</span>
            <span className="font-mono font-medium">{amountBeforeTax}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-blue-700">
            <span>Tax Amount:</span>
            <span className="font-mono font-medium">{taxAmount}</span>
          </div>
          <div className="flex items-center justify-between text-lg font-bold text-blue-900 border-t border-blue-100 pt-3">
            <span>Amount After Tax:</span>
            <span className="font-mono">{amountAfterTax}</span>
          </div>
        </div>
      </div>

      {/* Approval Action Panel */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl shadow-sm p-6 space-y-4">
        <h3 className="text-lg font-bold text-blue-900 flex items-center gap-2">
          <CheckCircle2 size={18} /> Approval Decision
        </h3>
        
        <Field label="Approval Remark">
          <textarea
            rows={2}
            value={approvalRemark}
            onChange={(e) => setApprovalRemark(e.target.value)}
            disabled={submitting}
            placeholder="Optional remark for approval, required for rejection..."
            className="w-full px-3 py-2 text-sm bg-white border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-slate-100"
          />
        </Field>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={() => handleAction("reject")}
            disabled={submitting}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-rose-700 bg-rose-100 hover:bg-rose-200 rounded-lg transition-colors active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
            Reject
          </button>
          
          <button
            onClick={() => handleAction("approve")}
            disabled={submitting}
            className="inline-flex items-center gap-2 px-6 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm transition-colors active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
            Approve
          </button>
        </div>
      </div>
    </div>
  );
}

const inputCls =
  "w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md focus:outline-none disabled:text-slate-700 disabled:cursor-not-allowed";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-blue-700 mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}
