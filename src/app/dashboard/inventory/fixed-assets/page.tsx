"use client";
import { SearchableSelect } from "@/components/SearchableSelect";
import { customConfirm } from "@/lib/customConfirm";
import { toast as hotToast } from "react-hot-toast";

import { useEffect, useState, useMemo } from "react";
import {
  Search,
  Plus,
  Power,
  Loader2,
  Check,
  AlertCircle,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Armchair,
  ArrowLeft,
  Edit2,
  Trash2,
} from "lucide-react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

type AssetStatus = "Active" | "Under Maintenance" | "Disposed" | "Inactive";

interface FixedAssetItem {
  id: string;
  assetCode: string;
  assetName: string;
  assetCategory: string;
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  purchaseDate: string | null;
  purchaseCost: number;
  departmentId: string | null;
  departmentName: string | null;
  assignedToId: string | null;
  assignedToName: string | null;
  location: string | null;
  status: AssetStatus;
  createdAt: string;
  updatedAt: string;
}

interface LookupOption {
  id: string;
  label: string;
}

interface Lookups {
  departments: LookupOption[];
  employees: LookupOption[];
}

type SortKey =
  | "assetCode_asc"
  | "assetCode_desc"
  | "createdAt_desc"
  | "createdAt_asc"
  | "purchaseDate_desc";
type StatusFilter = "All" | AssetStatus;
type ViewMode = "list" | "add" | "edit" | "view";

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

/** Assets are retired rather than deactivated, so the vocabulary is richer than Active/Inactive. */
const ASSET_STATUSES: AssetStatus[] = ["Active", "Under Maintenance", "Disposed", "Inactive"];

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "createdAt_desc",    label: "Newest First" },
  { value: "createdAt_asc",     label: "Oldest First" },
  { value: "assetCode_asc",     label: "Code A → Z" },
  { value: "assetCode_desc",    label: "Code Z → A" },
  { value: "purchaseDate_desc", label: "Recently Purchased" },
];

const EMPTY_LOOKUPS: Lookups = { departments: [], employees: [] };

const STATUS_STYLES: Record<AssetStatus, { badge: string; dot: string }> = {
  "Active":            { badge: "bg-emerald-50 text-emerald-700 border border-emerald-200/60", dot: "bg-emerald-500" },
  "Under Maintenance": { badge: "bg-amber-50 text-amber-700 border border-amber-200/60",       dot: "bg-amber-500" },
  "Disposed":          { badge: "bg-rose-50 text-rose-700 border border-rose-200/60",          dot: "bg-rose-500" },
  "Inactive":          { badge: "bg-blue-100 text-blue-600 border border-blue-200",            dot: "bg-blue-400" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** `<input type="date">` wants YYYY-MM-DD, not a full ISO timestamp. */
function toDateInput(iso: string | null) {
  return iso ? iso.slice(0, 10) : "";
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function FixedAssetsPage() {
  // ── Data state ──
  const [items, setItems]       = useState<FixedAssetItem[]>([]);
  const [lookups, setLookups]   = useState<Lookups>(EMPTY_LOOKUPS);
  const [loading, setLoading]   = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // ── View mode ──
  const [viewMode, setViewMode]     = useState<ViewMode>("list");
  const [activeItem, setActiveItem] = useState<FixedAssetItem | null>(null);

  // ── List controls ──
  const [search, setSearch]                 = useState("");
  const [statusFilter, setStatusFilter]     = useState<StatusFilter>("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [sortKey, setSortKey]               = useState<SortKey>("createdAt_desc");
  const [page, setPage]                     = useState(1);

  // ── Form state ──
  const [formCode, setFormCode]                 = useState("");
  const [formName, setFormName]                 = useState("");
  const [formCategory, setFormCategory]         = useState("");
  const [formBrand, setFormBrand]               = useState("");
  const [formModel, setFormModel]               = useState("");
  const [formSerialNumber, setFormSerialNumber] = useState("");
  const [formPurchaseDate, setFormPurchaseDate] = useState("");
  const [formPurchaseCost, setFormPurchaseCost] = useState("0");
  const [formDepartmentId, setFormDepartmentId] = useState("");
  const [formAssignedToId, setFormAssignedToId] = useState("");
  const [formLocation, setFormLocation]         = useState("");
  const [formStatus, setFormStatus]             = useState<AssetStatus>("Active");
  const [submitting, setSubmitting]             = useState(false);
  const [formError, setFormError]               = useState("");

  // ─────────────────────────────────────────────────────────────────────────────
  // Fetch
  // ─────────────────────────────────────────────────────────────────────────────

  const fetchItems = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch(`/api/inventory/fixed-assets?search=${encodeURIComponent(search)}`);
      if (!res.ok) throw new Error("Failed to load fixed asset records");
      const data: FixedAssetItem[] = await res.json();
      setItems(data);
      setPage(1);
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : "Failed to load fixed asset records");
    } finally {
      setLoading(false);
    }
  };

  const fetchLookups = async () => {
    try {
      const res = await fetch("/api/inventory/lookups");
      if (!res.ok) throw new Error("Failed to load dropdown options");
      setLookups(await res.json());
    } catch (e: unknown) {
      hotToast.error(e instanceof Error ? e.message : "Failed to load dropdown options");
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchLookups();
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // Client-side filter / sort / paginate
  // ─────────────────────────────────────────────────────────────────────────────

  /** Asset Category is free text, so the filter offers whatever has been entered. */
  const categoryOptions = useMemo(
    () => Array.from(new Set(items.map((i) => i.assetCategory).filter(Boolean))).sort(),
    [items]
  );

  const filtered = useMemo(() => {
    let list = [...items];
    if (statusFilter !== "All") list = list.filter((i) => i.status === statusFilter);
    if (categoryFilter !== "All") list = list.filter((i) => i.assetCategory === categoryFilter);
    list.sort((a, b) => {
      switch (sortKey) {
        case "assetCode_asc":     return a.assetCode.localeCompare(b.assetCode);
        case "assetCode_desc":    return b.assetCode.localeCompare(a.assetCode);
        case "purchaseDate_desc": return new Date(b.purchaseDate ?? 0).getTime() - new Date(a.purchaseDate ?? 0).getTime();
        case "createdAt_asc":     return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "createdAt_desc":    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
    return list;
  }, [items, statusFilter, categoryFilter, sortKey]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Navigation helpers
  // ─────────────────────────────────────────────────────────────────────────────

  const goList = () => { setViewMode("list"); setActiveItem(null); setFormError(""); };

  const goAdd = () => {
    setActiveItem(null);
    setFormCode("");
    setFormName("");
    setFormCategory("");
    setFormBrand("");
    setFormModel("");
    setFormSerialNumber("");
    setFormPurchaseDate("");
    setFormPurchaseCost("0");
    setFormDepartmentId("");
    setFormAssignedToId("");
    setFormLocation("");
    setFormStatus("Active");
    setFormError("");
    setViewMode("add");
  };

  const goEdit = (item: FixedAssetItem) => {
    setActiveItem(item);
    setFormCode(item.assetCode);
    setFormName(item.assetName);
    setFormCategory(item.assetCategory);
    setFormBrand(item.brand ?? "");
    setFormModel(item.model ?? "");
    setFormSerialNumber(item.serialNumber ?? "");
    setFormPurchaseDate(toDateInput(item.purchaseDate));
    setFormPurchaseCost(String(item.purchaseCost));
    setFormDepartmentId(item.departmentId ?? "");
    setFormAssignedToId(item.assignedToId ?? "");
    setFormLocation(item.location ?? "");
    setFormStatus(item.status);
    setFormError("");
    setViewMode("edit");
  };

  const goView = (item: FixedAssetItem) => {
    setActiveItem(item);
    setViewMode("view");
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Form submit
  // ─────────────────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");

    const payload: Record<string, unknown> = {
      assetCode:     formCode.trim(),
      assetName:     formName.trim(),
      assetCategory: formCategory.trim(),
      brand:         formBrand.trim() || null,
      model:         formModel.trim() || null,
      serialNumber:  formSerialNumber.trim() || null,
      purchaseDate:  formPurchaseDate || null,
      purchaseCost:  Number(formPurchaseCost || 0),
      departmentId:  formDepartmentId || null,
      assignedToId:  formAssignedToId || null,
      location:      formLocation.trim() || null,
      status:        formStatus,
    };
    if (viewMode === "edit" && activeItem) payload.id = activeItem.id;

    try {
      const method = viewMode === "edit" ? "PUT" : "POST";
      const res = await fetch("/api/inventory/fixed-assets", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save");
      }

      goList();
      fetchItems();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Toggle status / Delete
  // ─────────────────────────────────────────────────────────────────────────────

  const handleToggleStatus = async (item: FixedAssetItem) => {
    try {
      const res = await fetch("/api/inventory/fixed-assets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to toggle status");
      }
      fetchItems();
    } catch (e: unknown) {
      hotToast.error(e instanceof Error ? e.message : "An error occurred");
    }
  };

  const handleDelete = async (item: FixedAssetItem) => {
    if (!(await customConfirm(`Are you sure you want to delete "${item.assetCode}"? This action cannot be undone.`))) {
      return;
    }
    try {
      const res = await fetch("/api/inventory/fixed-assets", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete");
      }
      hotToast.success("Fixed Asset deleted");
      fetchItems();
    } catch (e: unknown) {
      hotToast.error(e instanceof Error ? e.message : "An error occurred");
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Shared page header
  // ─────────────────────────────────────────────────────────────────────────────

  const isForm = viewMode === "add" || viewMode === "edit";
  const isView = viewMode === "view";

  const pageHeader = (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-6 border-b border-blue-200 ">
      <div>
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-blue-400 font-semibold tracking-wider uppercase mb-1">
          <Link href="/dashboard" className="hover:text-blue-600">Dashboard</Link>
          <span>/</span>
          <Link href="/dashboard/inventory" className="hover:text-blue-600">Inventory</Link>
          <span>/</span>
          {isForm || isView ? (
            <>
              <button onClick={goList} className="hover:text-blue-600">Fixed Assets</button>
              <span>/</span>
              <span className="text-blue-500">
                {viewMode === "add" ? "Add Fixed Asset" : viewMode === "edit" ? "Edit Fixed Asset" : "View Fixed Asset"}
              </span>
            </>
          ) : (
            <span className="text-blue-500">Fixed Assets</span>
          )}
        </div>

        {/* Title row */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600">
            <Armchair size={20} />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-blue-900">
              {viewMode === "add" ? "Add Fixed Asset" : viewMode === "edit" ? "Edit Fixed Asset" : "Fixed Assets"}
            </h2>
            <p className="text-sm text-blue-500 mt-0.5">
              {isForm
                ? "Fill in the details below and click Save."
                : "Track company assets, their custodians, and their locations."}
            </p>
          </div>
        </div>
      </div>

      {/* Right-side action */}
      {viewMode === "list" && (
        <button
          id="btn-add-fixed-asset"
          onClick={goAdd}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 rounded-lg shadow-md shadow-purple-500/20 active:scale-95 transition-all duration-200 shrink-0"
        >
          <Plus size={16} /> Add Fixed Asset
        </button>
      )}

      {(isForm || isView) && (
        <button
          onClick={goList}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-blue-600 bg-white border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors shrink-0"
        >
          <ArrowLeft size={16} /> Back to List
        </button>
      )}
    </div>
  );

  const inputClass =
    "w-full px-3 py-2.5 text-sm bg-blue-50 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors";
  const labelClass = "text-xs font-semibold uppercase tracking-wider text-blue-500 flex items-center gap-1";
  const optionalTag = <span className="ml-1.5 text-[10px] font-normal normal-case text-blue-400">(optional)</span>;

  // ─────────────────────────────────────────────────────────────────────────────
  // Render — Add / Edit form (inline, no popup)
  // ─────────────────────────────────────────────────────────────────────────────

  if (isForm) {
    return (
      <div className="p-6 lg:p-8 space-y-6">
        {pageHeader}

        <div className="bg-white border border-blue-200 rounded-xl shadow-sm overflow-hidden">
          {/* Form header bar */}
          <div className="px-6 py-4 border-b border-blue-100 bg-blue-50/60 flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600">
              <Armchair size={15} />
            </div>
            <span className="font-semibold text-sm text-blue-700">Fixed Asset Information</span>
          </div>

          <form id="fixed-asset-form" onSubmit={handleSubmit} className="p-6 space-y-6">
            {formError && (
              <div className="p-3 bg-rose-50 text-rose-700 text-sm font-medium rounded-lg flex items-center gap-2 border border-rose-200">
                <AlertCircle size={15} />
                <span>{formError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Asset Code */}
              <div className="space-y-2">
                <label className={labelClass}>
                  Asset Code <span className="text-rose-500">*</span>
                </label>
                <input
                  id="fixed-asset-code-input"
                  type="text"
                  required
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  placeholder="e.g. FA-0001"
                  className={inputClass}
                />
              </div>

              {/* Asset Name */}
              <div className="space-y-2">
                <label className={labelClass}>
                  Asset Name <span className="text-rose-500">*</span>
                </label>
                <input
                  id="fixed-asset-name-input"
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Overhead Crane"
                  className={inputClass}
                />
              </div>

              {/* Asset Category */}
              <div className="space-y-2">
                <label className={labelClass}>
                  Asset Category <span className="text-rose-500">*</span>
                </label>
                <input
                  id="fixed-asset-category-input"
                  type="text"
                  required
                  list="fixed-asset-category-options"
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  placeholder="e.g. Machinery"
                  className={inputClass}
                />
                <datalist id="fixed-asset-category-options">
                  {categoryOptions.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>

              {/* Brand */}
              <div className="space-y-2">
                <label className={labelClass}>Brand{optionalTag}</label>
                <input
                  id="fixed-asset-brand-input"
                  type="text"
                  value={formBrand}
                  onChange={(e) => setFormBrand(e.target.value)}
                  placeholder="e.g. Demag"
                  className={inputClass}
                />
              </div>

              {/* Model */}
              <div className="space-y-2">
                <label className={labelClass}>Model{optionalTag}</label>
                <input
                  id="fixed-asset-model-input"
                  type="text"
                  value={formModel}
                  onChange={(e) => setFormModel(e.target.value)}
                  placeholder="e.g. DR-5T"
                  className={inputClass}
                />
              </div>

              {/* Serial Number */}
              <div className="space-y-2">
                <label className={labelClass}>Serial Number{optionalTag}</label>
                <input
                  id="fixed-asset-serial-number-input"
                  type="text"
                  value={formSerialNumber}
                  onChange={(e) => setFormSerialNumber(e.target.value)}
                  placeholder="e.g. SN-99213"
                  className={inputClass}
                />
              </div>

              {/* Purchase Date */}
              <div className="space-y-2">
                <label className={labelClass}>Purchase Date{optionalTag}</label>
                <input
                  id="fixed-asset-purchase-date-input"
                  type="date"
                  value={formPurchaseDate}
                  onChange={(e) => setFormPurchaseDate(e.target.value)}
                  className={inputClass}
                />
              </div>

              {/* Purchase Cost */}
              <div className="space-y-2">
                <label className={labelClass}>Purchase Cost</label>
                <input
                  id="fixed-asset-purchase-cost-input"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formPurchaseCost}
                  onChange={(e) => setFormPurchaseCost(e.target.value)}
                  className={inputClass}
                />
              </div>

              {/* Department */}
              <div className="space-y-2">
                <label className={labelClass}>Department{optionalTag}</label>
                <SearchableSelect
                  id="fixed-asset-department-input"
                  value={formDepartmentId}
                  onChange={(e) => setFormDepartmentId(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Select department...</option>
                  {lookups.departments.map((o) => (
                    <option key={o.id} value={o.id}>{o.label}</option>
                  ))}
                </SearchableSelect>
              </div>

              {/* Assigned To */}
              <div className="space-y-2">
                <label className={labelClass}>Assigned To{optionalTag}</label>
                <SearchableSelect
                  id="fixed-asset-assigned-to-input"
                  value={formAssignedToId}
                  onChange={(e) => setFormAssignedToId(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Select employee...</option>
                  {lookups.employees.map((o) => (
                    <option key={o.id} value={o.id}>{o.label}</option>
                  ))}
                </SearchableSelect>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <label className={labelClass}>Location{optionalTag}</label>
                <input
                  id="fixed-asset-location-input"
                  type="text"
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  placeholder="e.g. Workshop Bay 2"
                  className={inputClass}
                />
              </div>

              {/* Status */}
              <div className="space-y-2">
                <label className={labelClass}>Status</label>
                <SearchableSelect
                  id="fixed-asset-status-input"
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as AssetStatus)}
                  className={inputClass}
                >
                  {ASSET_STATUSES.map((s) => (
                    <option key={s} value={s}>{s === "Inactive" ? "Deactive" : s}</option>
                  ))}
                </SearchableSelect>
              </div>
            </div>

            {/* Form action buttons */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-blue-100">
              <button
                type="button"
                onClick={goList}
                className="px-5 py-2.5 text-sm font-semibold text-blue-600 bg-white border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="fixed-asset-form"
                disabled={submitting}
                className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 rounded-lg shadow-md shadow-purple-500/20 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                {submitting ? (
                  <><Loader2 size={14} className="animate-spin" /> Saving...</>
                ) : (
                  <><Check size={14} /> {viewMode === "edit" ? "Update Fixed Asset" : "Save Fixed Asset"}</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Render — View detail (inline, no popup)
  // ─────────────────────────────────────────────────────────────────────────────

  if (isView && activeItem) {
    return (
      <div className="p-6 lg:p-8 space-y-6">
        {pageHeader}

        <div className="bg-white border border-blue-200 rounded-xl shadow-sm overflow-hidden">
          {/* View header bar */}
          <div className="px-6 py-4 border-b border-blue-100 bg-blue-50/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
                <Armchair size={17} />
              </div>
              <div>
                <p className="font-bold text-base text-blue-900">{activeItem.assetCode}</p>
                <p className="text-xs text-blue-400">Fixed Asset Record — Read Only</p>
              </div>
            </div>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[activeItem.status].badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${STATUS_STYLES[activeItem.status].dot}`} />
              {activeItem.status === "Inactive" ? "Deactive" : activeItem.status}
            </span>
          </div>

          {/* Detail grid */}
          <div className="p-6">
            <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { label: "Asset Code",     value: activeItem.assetCode },
                { label: "Asset Name",     value: activeItem.assetName },
                { label: "Asset Category", value: activeItem.assetCategory },
                { label: "Brand",          value: activeItem.brand || "—" },
                { label: "Model",          value: activeItem.model || "—" },
                { label: "Serial Number",  value: activeItem.serialNumber || "—" },
                { label: "Purchase Date",  value: activeItem.purchaseDate ? formatDate(activeItem.purchaseDate) : "—" },
                { label: "Purchase Cost",  value: `$${activeItem.purchaseCost.toFixed(2)}` },
                { label: "Department",     value: activeItem.departmentName || "—" },
                { label: "Assigned To",    value: activeItem.assignedToName || "—" },
                { label: "Location",       value: activeItem.location || "—" },
                { label: "Status",         value: activeItem.status === "Inactive" ? "Deactive" : activeItem.status },
                { label: "Created Date",   value: formatDate(activeItem.createdAt) },
                { label: "Updated Date",   value: formatDate(activeItem.updatedAt) },
              ].map(({ label, value }) => (
                <div key={label} className="space-y-1">
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-blue-400">{label}</dt>
                  <dd className="text-sm font-semibold text-blue-800">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* View footer actions */}
          <div className="px-6 pb-6 flex items-center gap-3">
            <button
              onClick={() => goEdit(activeItem)}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 rounded-lg shadow-md shadow-purple-500/20 active:scale-95 transition-all duration-200"
            >
              <Edit2 size={14} /> Edit Fixed Asset
            </button>
            <button
              onClick={goList}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-blue-600 bg-white border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <X size={14} /> Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Render — List view
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {pageHeader}

      {/* ── Controls Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-white border border-blue-200 p-4 rounded-xl shadow-sm">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-blue-400" />
          <input
            id="fixed-asset-search"
            type="text"
            placeholder="Search code, name, brand, serial, location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-blue-50 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-colors"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-blue-500 uppercase tracking-wider shrink-0">Category</label>
          <SearchableSelect
            id="fixed-asset-category-filter"
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
            className="text-sm bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-blue-700"
          >
            <option value="All">All</option>
            {categoryOptions.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </SearchableSelect>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-blue-500 uppercase tracking-wider shrink-0">Status</label>
          <SearchableSelect
            id="fixed-asset-status-filter"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as StatusFilter); setPage(1); }}
            className="text-sm bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-blue-700"
          >
            <option value="All">All</option>
            {ASSET_STATUSES.map((s) => (
              <option key={s} value={s}>{s === "Inactive" ? "Deactive" : s}</option>
            ))}
          </SearchableSelect>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <ArrowUpDown size={14} className="text-blue-400 shrink-0" />
          <SearchableSelect
            id="fixed-asset-sort"
            value={sortKey}
            onChange={(e) => { setSortKey(e.target.value as SortKey); setPage(1); }}
            className="text-sm bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-blue-700"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </SearchableSelect>
        </div>
      </div>

      {/* ── Table Area ── */}
      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          <p className="text-sm text-blue-500">Loading fixed assets...</p>
        </div>
      ) : errorMsg ? (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 flex items-center gap-3 text-rose-700">
          <AlertCircle size={18} />
          <p className="text-sm font-medium">{errorMsg}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-blue-200 rounded-xl p-12 text-center shadow-sm">
          <div className="mx-auto w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center mb-4">
            <Armchair size={22} className="text-purple-600" />
          </div>
          <p className="text-blue-600 font-semibold">
            {search || statusFilter !== "All" || categoryFilter !== "All"
              ? "No fixed assets match your filters."
              : "No fixed assets yet."}
          </p>
          <p className="text-xs text-blue-400 mt-1">
            {search || statusFilter !== "All" || categoryFilter !== "All"
              ? "Try adjusting your search or filter."
              : 'Click "Add Fixed Asset" to create your first record.'}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-blue-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm text-blue-600 whitespace-nowrap">
              <thead className="bg-blue-50 text-xs font-bold uppercase tracking-wider text-blue-500 border-b border-blue-200">
                <tr>
                  <th className="px-5 py-4">Asset</th>
                  <th className="px-5 py-4">Category</th>
                  <th className="px-5 py-4">Brand / Model</th>
                  <th className="px-5 py-4">Serial No</th>
                  <th className="px-5 py-4">Purchase Date</th>
                  <th className="px-5 py-4 text-right">Purchase Cost</th>
                  <th className="px-5 py-4">Department</th>
                  <th className="px-5 py-4">Assigned To</th>
                  <th className="px-5 py-4">Location</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-100">
                {pageItems.map((item) => (
                  <tr key={item.id} className="hover:bg-blue-50/50 transition-colors group">

                    {/* Asset — clickable to Edit */}
                    <td className="px-5 py-4">
                      <button
                        onClick={() => goEdit(item)}
                        className="inline-flex items-center gap-2.5 text-left group/name"
                        title="Click to edit"
                      >
                        <span className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0 group-hover/name:bg-purple-600 group-hover/name:text-white transition-all duration-200">
                          <Armchair size={14} />
                        </span>
                        <span>
                          <span className="block font-semibold text-blue-900 group-hover/name:text-purple-600 transition-colors">
                            {item.assetCode}
                          </span>
                          <span className="block text-xs text-blue-500">{item.assetName}</span>
                        </span>
                        <Edit2 size={12} className="text-blue-300 group-hover/name:text-purple-500 opacity-0 group-hover/name:opacity-100 transition-all -ml-1" />
                      </button>
                    </td>

                    <td className="px-5 py-4 text-blue-700">{item.assetCategory}</td>
                    <td className="px-5 py-4 text-blue-700">
                      {[item.brand, item.model].filter(Boolean).join(" / ") || "—"}
                    </td>
                    <td className="px-5 py-4 text-blue-500">{item.serialNumber || "—"}</td>
                    <td className="px-5 py-4 text-blue-700">
                      {item.purchaseDate ? formatDate(item.purchaseDate) : "—"}
                    </td>
                    <td className="px-5 py-4 text-right text-blue-700">${item.purchaseCost.toFixed(2)}</td>
                    <td className="px-5 py-4 text-blue-700">{item.departmentName || "—"}</td>
                    <td className="px-5 py-4 text-blue-700">{item.assignedToName || "—"}</td>
                    <td className="px-5 py-4 text-blue-500">{item.location || "—"}</td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[item.status].badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${STATUS_STYLES[item.status].dot}`} />
                        {item.status === "Inactive" ? "Deactive" : item.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right flex items-center justify-end gap-2">
                      <button
                        onClick={() => goView(item)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-blue-200 hover:bg-blue-100 text-blue-700 transition-all active:scale-95 cursor-pointer"
                        title="View Details"
                      >
                        View
                      </button>
                      <button
                        id={`btn-toggle-${item.id}`}
                        onClick={() => handleToggleStatus(item)}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all active:scale-95 cursor-pointer ${
                          item.status === "Active"
                            ? "text-rose-600 border-rose-200 hover:bg-rose-50"
                            : "text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                        }`}
                        title={item.status === "Active" ? "Deactivate" : "Activate"}
                      >
                        <Power size={12} />
                        {item.status === "Active" ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        id={`btn-delete-${item.id}`}
                        onClick={() => handleDelete(item)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-rose-200 text-rose-600 hover:bg-rose-50 transition-all active:scale-95 cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination footer */}
          <div className="px-5 py-3 border-t border-blue-100 flex items-center justify-between text-xs text-blue-500 bg-blue-50/50">
            <span>
              Showing{" "}
              <span className="font-semibold text-blue-700">
                {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-blue-700">{filtered.length}</span>{" "}
              records
            </span>
            <div className="flex items-center gap-1">
              <button
                id="fixed-asset-prev-page"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-blue-200 hover:bg-blue-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .reduce<(number | "...")[]>((acc, p, i, arr) => {
                  if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  p === "..." ? (
                    <span key={`ellipsis-${i}`} className="px-1 text-blue-400">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p as number)}
                      className={`w-7 h-7 rounded-lg text-xs font-semibold transition-colors ${
                        page === p
                          ? "bg-purple-600 text-white shadow-sm"
                          : "border border-blue-200 hover:bg-blue-100"
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}
              <button
                id="fixed-asset-next-page"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg border border-blue-200 hover:bg-blue-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
