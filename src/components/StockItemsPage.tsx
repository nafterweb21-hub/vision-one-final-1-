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
  ArrowLeft,
  Edit2,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ItemType = "RAW_MATERIAL" | "CONSUMABLE";

interface StockItem {
  id: string;
  itemType: ItemType;
  materialProfileId: string;
  code: string;
  name: string;
  categoryId: string;
  categoryName: string;
  materialTypeId: string | null;
  materialTypeName: string | null;
  grade: string | null;
  uomId: string;
  uomName: string;
  openingStock: number;
  currentStock: number;
  reorderLevel: number;
  unitCost: number;
  supplierId: string | null;
  supplierName: string | null;
  warehouse: string | null;
  status: "Active" | "Inactive";
  createdAt: string;
  updatedAt: string;
}

interface LookupOption {
  id: string;
  label: string;
}

interface MaterialProfileOption extends LookupOption {
  partNo: string;
  description: string;
  categoryId: string;
  categoryName: string;
  /** Non-null when another stock item already claims this material. */
  takenBy: ItemType | null;
}

interface Lookups {
  materialProfiles: MaterialProfileOption[];
  categories: LookupOption[];
  materialTypes: LookupOption[];
  uoms: LookupOption[];
  suppliers: LookupOption[];
}

/**
 * Tailwind scans for literal class names, so every accent variant is spelled
 * out rather than interpolated.
 */
export interface StockItemsPageConfig {
  itemType: ItemType;
  /** "Raw Material" — singular, title case. */
  noun: string;
  /** "Raw Materials" — plural, used for the list heading and breadcrumb. */
  nounPlural: string;
  apiPath: string;
  /** Slug used for element ids, e.g. "raw-material". */
  idPrefix: string;
  icon: LucideIcon;
  subtitle: string;
  /** Raw materials call it Standard Cost; consumables call it Unit Cost. */
  costLabel: string;
  /** Material Type and Grade are raw-material-only concepts. */
  showMaterialTypeAndGrade: boolean;
  codeLabel: string;
  nameLabel: string;
  accent: {
    iconBg: string;
    iconText: string;
    button: string;
    ring: string;
    spinner: string;
    hoverText: string;
    hoverBg: string;
    pageActive: string;
    tint: string;
  };
}

type SortKey = "code_asc" | "code_desc" | "createdAt_desc" | "createdAt_asc" | "currentStock_asc";
type StatusFilter = "All" | "Active" | "Inactive";
type ViewMode = "list" | "add" | "edit" | "view";

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "createdAt_desc",   label: "Newest First" },
  { value: "createdAt_asc",    label: "Oldest First" },
  { value: "code_asc",         label: "Code A → Z" },
  { value: "code_desc",        label: "Code Z → A" },
  { value: "currentStock_asc", label: "Lowest Stock First" },
];

const EMPTY_LOOKUPS: Lookups = {
  materialProfiles: [],
  categories: [],
  materialTypes: [],
  uoms: [],
  suppliers: [],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** At or below the reorder level the item needs replenishing — the table flags it. */
function isLowStock(item: StockItem) {
  return item.reorderLevel > 0 && item.currentStock <= item.reorderLevel;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function StockItemsPage({ config }: { config: StockItemsPageConfig }) {
  const { accent, icon: Icon } = config;

  // ── Data state ──
  const [items, setItems]       = useState<StockItem[]>([]);
  const [lookups, setLookups]   = useState<Lookups>(EMPTY_LOOKUPS);
  const [loading, setLoading]   = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // ── View mode ──
  const [viewMode, setViewMode]     = useState<ViewMode>("list");
  const [activeItem, setActiveItem] = useState<StockItem | null>(null);

  // ── List controls ──
  const [search, setSearch]                 = useState("");
  const [statusFilter, setStatusFilter]     = useState<StatusFilter>("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [sortKey, setSortKey]               = useState<SortKey>("createdAt_desc");
  const [page, setPage]                     = useState(1);

  // ── Form state ──
  /** "new" lets the user type a material; "existing" attaches to one already in the master. */
  const [formMaterialSource, setFormMaterialSource]       = useState<"new" | "existing">("new");
  const [formMaterialCode, setFormMaterialCode]           = useState("");
  const [formMaterialName, setFormMaterialName]           = useState("");
  const [formCategoryId, setFormCategoryId]               = useState("");
  const [formShape, setFormShape]                         = useState("");
  const [formSize, setFormSize]                           = useState("");
  const [formMaterialProfileId, setFormMaterialProfileId] = useState("");
  const [formMaterialTypeId, setFormMaterialTypeId]       = useState("");
  const [formGrade, setFormGrade]                         = useState("");
  const [formUomId, setFormUomId]                         = useState("");
  const [formOpeningStock, setFormOpeningStock]           = useState("0");
  const [formReorderLevel, setFormReorderLevel]           = useState("0");
  const [formUnitCost, setFormUnitCost]                   = useState("0");
  const [formSupplierId, setFormSupplierId]               = useState("");
  const [formWarehouse, setFormWarehouse]                 = useState("");
  const [formStatus, setFormStatus]                       = useState<"Active" | "Inactive">("Active");
  const [submitting, setSubmitting]                       = useState(false);
  const [formError, setFormError]                         = useState("");

  // ─────────────────────────────────────────────────────────────────────────────
  // Fetch
  // ─────────────────────────────────────────────────────────────────────────────

  const fetchItems = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch(`${config.apiPath}?search=${encodeURIComponent(search)}`);
      if (!res.ok) throw new Error(`Failed to load ${config.nounPlural.toLowerCase()}`);
      const data: StockItem[] = await res.json();
      setItems(data);
      setPage(1);
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : `Failed to load ${config.nounPlural.toLowerCase()}`);
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
  // Derived
  // ─────────────────────────────────────────────────────────────────────────────

  const selectedProfile = useMemo(
    () => lookups.materialProfiles.find((m) => m.id === formMaterialProfileId) ?? null,
    [lookups.materialProfiles, formMaterialProfileId]
  );

  /** Materials already claimed by another stock item are not offered again. */
  const availableProfiles = useMemo(
    () =>
      lookups.materialProfiles.filter(
        (m) => !m.takenBy || m.id === activeItem?.materialProfileId
      ),
    [lookups.materialProfiles, activeItem]
  );

  const filtered = useMemo(() => {
    let list = [...items];
    if (statusFilter !== "All") list = list.filter((i) => i.status === statusFilter);
    if (categoryFilter !== "All") list = list.filter((i) => i.categoryId === categoryFilter);
    list.sort((a, b) => {
      switch (sortKey) {
        case "code_asc":         return a.code.localeCompare(b.code);
        case "code_desc":        return b.code.localeCompare(a.code);
        case "currentStock_asc": return a.currentStock - b.currentStock;
        case "createdAt_asc":    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "createdAt_desc":   return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
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
    setFormMaterialSource("new");
    setFormMaterialCode("");
    setFormMaterialName("");
    setFormCategoryId("");
    setFormShape("");
    setFormSize("");
    setFormMaterialProfileId("");
    setFormMaterialTypeId("");
    setFormGrade("");
    setFormUomId("");
    setFormOpeningStock("0");
    setFormReorderLevel("0");
    setFormUnitCost("0");
    setFormSupplierId("");
    setFormWarehouse("");
    setFormStatus("Active");
    setFormError("");
    setViewMode("add");
  };

  const goEdit = (item: StockItem) => {
    setActiveItem(item);
    // An existing record is already bound to its material; that link is locked.
    setFormMaterialSource("existing");
    setFormMaterialCode(item.code);
    setFormMaterialName(item.name);
    setFormCategoryId(item.categoryId);
    setFormShape("");
    setFormSize("");
    setFormMaterialProfileId(item.materialProfileId);
    setFormMaterialTypeId(item.materialTypeId ?? "");
    setFormGrade(item.grade ?? "");
    setFormUomId(item.uomId);
    setFormOpeningStock(String(item.openingStock));
    setFormReorderLevel(String(item.reorderLevel));
    setFormUnitCost(String(item.unitCost));
    setFormSupplierId(item.supplierId ?? "");
    setFormWarehouse(item.warehouse ?? "");
    setFormStatus(item.status);
    setFormError("");
    setViewMode("edit");
  };

  const goView = (item: StockItem) => {
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

    const isNewMaterial = formMaterialSource === "new" && viewMode === "add";

    const payload: Record<string, unknown> = {
      // Either attach to an existing material, or hand the server the fields to
      // create one. Editing always keeps the material it is already bound to.
      ...(isNewMaterial
        ? {
            newMaterial: {
              materialCode: formMaterialCode.trim(),
              materialName: formMaterialName.trim(),
              categoryId:   formCategoryId,
              shape:        formShape.trim(),
              size:         formSize.trim() || null,
            },
          }
        : { materialProfileId: formMaterialProfileId }),
      materialTypeId:    config.showMaterialTypeAndGrade ? formMaterialTypeId || null : null,
      grade:             config.showMaterialTypeAndGrade ? formGrade.trim() || null : null,
      uomId:             formUomId,
      openingStock:      Number(formOpeningStock || 0),
      reorderLevel:      Number(formReorderLevel || 0),
      unitCost:          Number(formUnitCost || 0),
      supplierId:        formSupplierId || null,
      warehouse:         formWarehouse.trim() || null,
      status:            formStatus,
    };
    if (viewMode === "edit" && activeItem) payload.id = activeItem.id;

    try {
      const method = viewMode === "edit" ? "PUT" : "POST";
      const res = await fetch(config.apiPath, {
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
      fetchLookups();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Toggle status / Delete
  // ─────────────────────────────────────────────────────────────────────────────

  const handleToggleStatus = async (item: StockItem) => {
    try {
      const res = await fetch(config.apiPath, {
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

  const handleDelete = async (item: StockItem) => {
    if (!(await customConfirm(`Are you sure you want to delete "${item.code}"? This action cannot be undone.`))) {
      return;
    }
    try {
      const res = await fetch(config.apiPath, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete");
      }
      hotToast.success(`${config.noun} deleted`);
      fetchItems();
      fetchLookups();
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
              <button onClick={goList} className="hover:text-blue-600">{config.nounPlural}</button>
              <span>/</span>
              <span className="text-blue-500">
                {viewMode === "add" ? `Add ${config.noun}` : viewMode === "edit" ? `Edit ${config.noun}` : `View ${config.noun}`}
              </span>
            </>
          ) : (
            <span className="text-blue-500">{config.nounPlural}</span>
          )}
        </div>

        {/* Title row */}
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${accent.iconBg} ${accent.iconText}`}>
            <Icon size={20} />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-blue-900">
              {viewMode === "add" ? `Add ${config.noun}` : viewMode === "edit" ? `Edit ${config.noun}` : config.nounPlural}
            </h2>
            <p className="text-sm text-blue-500 mt-0.5">
              {isForm ? "Fill in the details below and click Save." : config.subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Right-side action */}
      {viewMode === "list" && (
        <button
          id={`btn-add-${config.idPrefix}`}
          onClick={goAdd}
          className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white ${accent.button} rounded-lg shadow-md active:scale-95 transition-all duration-200 shrink-0`}
        >
          <Plus size={16} /> Add {config.noun}
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

  const inputClass = `w-full px-3 py-2.5 text-sm bg-blue-50 border border-blue-200 rounded-lg focus:outline-none ${accent.ring} disabled:opacity-60 disabled:cursor-not-allowed transition-colors`;
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
            <div className={`p-1.5 rounded-lg ${accent.iconBg} ${accent.iconText}`}>
              <Icon size={15} />
            </div>
            <span className="font-semibold text-sm text-blue-700">{config.noun} Information</span>
          </div>

          <form id={`${config.idPrefix}-form`} onSubmit={handleSubmit} className="p-6 space-y-6">
            {formError && (
              <div className="p-3 bg-rose-50 text-rose-700 text-sm font-medium rounded-lg flex items-center gap-2 border border-rose-200">
                <AlertCircle size={15} />
                <span>{formError}</span>
              </div>
            )}

            {/* Material source — type a new material, or attach to an existing one */}
            {viewMode === "add" && (
              <div className="flex flex-wrap items-center gap-4">
                <span className={labelClass}>Material</span>
                {(["new", "existing"] as const).map((source) => (
                  <label
                    key={source}
                    className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name={`${config.idPrefix}-material-source`}
                      value={source}
                      checked={formMaterialSource === source}
                      onChange={() => setFormMaterialSource(source)}
                      className="accent-blue-600"
                    />
                    {source === "new" ? "New material" : "Existing material"}
                  </label>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {formMaterialSource === "existing" && viewMode === "add" ? (
                <>
                  {/* Attach to a material already in the master */}
                  <div className="space-y-2 md:col-span-2">
                    <label className={labelClass}>
                      Material <span className="text-rose-500">*</span>
                    </label>
                    <SearchableSelect
                      id={`${config.idPrefix}-material-input`}
                      required
                      value={formMaterialProfileId}
                      onChange={(e) => setFormMaterialProfileId(e.target.value)}
                      className={inputClass}
                    >
                      <option value="">Select material...</option>
                      {availableProfiles.map((o) => (
                        <option key={o.id} value={o.id}>{o.label}</option>
                      ))}
                    </SearchableSelect>
                    <p className="text-[11px] text-blue-400">
                      Materials that already have a stock record are not listed.
                    </p>
                  </div>

                  {/* Category — read through from the selected material */}
                  <div className="space-y-2">
                    <label className={labelClass}>Category</label>
                    <input
                      type="text"
                      disabled
                      value={selectedProfile?.categoryName ?? ""}
                      placeholder="Select a material first"
                      className={inputClass}
                    />
                  </div>
                </>
              ) : (
                <>
                  {/* Material Code */}
                  <div className="space-y-2">
                    <label className={labelClass}>
                      {config.codeLabel} <span className="text-rose-500">*</span>
                      {viewMode === "edit" && (
                        <span className="text-[10px] text-blue-400 font-normal normal-case ml-1 bg-blue-100 px-1.5 py-0.5 rounded">
                          locked
                        </span>
                      )}
                    </label>
                    <input
                      id={`${config.idPrefix}-code-input`}
                      type="text"
                      required
                      disabled={viewMode === "edit"}
                      value={formMaterialCode}
                      onChange={(e) => setFormMaterialCode(e.target.value)}
                      placeholder={config.itemType === "RAW_MATERIAL" ? "e.g. RM-0001" : "e.g. CN-0001"}
                      className={inputClass}
                    />
                  </div>

                  {/* Material Name */}
                  <div className="space-y-2">
                    <label className={labelClass}>
                      {config.nameLabel} <span className="text-rose-500">*</span>
                      {viewMode === "edit" && (
                        <span className="text-[10px] text-blue-400 font-normal normal-case ml-1 bg-blue-100 px-1.5 py-0.5 rounded">
                          locked
                        </span>
                      )}
                    </label>
                    <input
                      id={`${config.idPrefix}-name-input`}
                      type="text"
                      required
                      disabled={viewMode === "edit"}
                      value={formMaterialName}
                      onChange={(e) => setFormMaterialName(e.target.value)}
                      placeholder={config.itemType === "RAW_MATERIAL" ? "e.g. Mild Steel Plate" : "e.g. Welding Electrode 3.2mm"}
                      className={inputClass}
                    />
                  </div>

                  {/* Category */}
                  <div className="space-y-2">
                    <label className={labelClass}>
                      Category <span className="text-rose-500">*</span>
                      {viewMode === "edit" && (
                        <span className="text-[10px] text-blue-400 font-normal normal-case ml-1 bg-blue-100 px-1.5 py-0.5 rounded">
                          locked
                        </span>
                      )}
                    </label>
                    <SearchableSelect
                      id={`${config.idPrefix}-category-input`}
                      required
                      disabled={viewMode === "edit"}
                      value={formCategoryId}
                      onChange={(e) => setFormCategoryId(e.target.value)}
                      className={inputClass}
                    >
                      <option value="">Select category...</option>
                      {lookups.categories.map((o) => (
                        <option key={o.id} value={o.id}>{o.label}</option>
                      ))}
                    </SearchableSelect>
                  </div>

                  {viewMode === "add" && (
                    <>
                      {/* Shape — required by the Material Profile master */}
                      <div className="space-y-2">
                        <label className={labelClass}>
                          Shape <span className="text-rose-500">*</span>
                        </label>
                        <input
                          id={`${config.idPrefix}-shape-input`}
                          type="text"
                          required
                          value={formShape}
                          onChange={(e) => setFormShape(e.target.value)}
                          placeholder="e.g. PLATE, ROUND BAR"
                          className={inputClass}
                        />
                      </div>

                      {/* Size */}
                      <div className="space-y-2">
                        <label className={labelClass}>Size{optionalTag}</label>
                        <input
                          id={`${config.idPrefix}-size-input`}
                          type="text"
                          value={formSize}
                          onChange={(e) => setFormSize(e.target.value)}
                          placeholder="e.g. 50MM"
                          className={inputClass}
                        />
                      </div>
                    </>
                  )}
                </>
              )}

              {config.showMaterialTypeAndGrade && (
                <>
                  {/* Material Type */}
                  <div className="space-y-2">
                    <label className={labelClass}>Material Type{optionalTag}</label>
                    <SearchableSelect
                      id={`${config.idPrefix}-type-input`}
                      value={formMaterialTypeId}
                      onChange={(e) => setFormMaterialTypeId(e.target.value)}
                      className={inputClass}
                    >
                      <option value="">Select material type...</option>
                      {lookups.materialTypes.map((o) => (
                        <option key={o.id} value={o.id}>{o.label}</option>
                      ))}
                    </SearchableSelect>
                  </div>

                  {/* Grade */}
                  <div className="space-y-2">
                    <label className={labelClass}>Grade{optionalTag}</label>
                    <input
                      id={`${config.idPrefix}-grade-input`}
                      type="text"
                      value={formGrade}
                      onChange={(e) => setFormGrade(e.target.value)}
                      placeholder="e.g. S355JR"
                      className={inputClass}
                    />
                  </div>
                </>
              )}

              {/* UOM */}
              <div className="space-y-2">
                <label className={labelClass}>
                  UOM <span className="text-rose-500">*</span>
                </label>
                <SearchableSelect
                  id={`${config.idPrefix}-uom-input`}
                  required
                  value={formUomId}
                  onChange={(e) => setFormUomId(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Select UOM...</option>
                  {lookups.uoms.map((o) => (
                    <option key={o.id} value={o.id}>{o.label}</option>
                  ))}
                </SearchableSelect>
              </div>

              {/* Opening Stock */}
              <div className="space-y-2">
                <label className={labelClass}>Opening Stock</label>
                <input
                  id={`${config.idPrefix}-opening-stock-input`}
                  type="number"
                  step="0.01"
                  value={formOpeningStock}
                  onChange={(e) => setFormOpeningStock(e.target.value)}
                  className={inputClass}
                />
              </div>

              {/* Reorder Level */}
              <div className="space-y-2">
                <label className={labelClass}>Reorder Level</label>
                <input
                  id={`${config.idPrefix}-reorder-level-input`}
                  type="number"
                  step="0.01"
                  min="0"
                  value={formReorderLevel}
                  onChange={(e) => setFormReorderLevel(e.target.value)}
                  className={inputClass}
                />
              </div>

              {/* Unit / Standard Cost */}
              <div className="space-y-2">
                <label className={labelClass}>{config.costLabel}</label>
                <input
                  id={`${config.idPrefix}-cost-input`}
                  type="number"
                  step="0.01"
                  min="0"
                  value={formUnitCost}
                  onChange={(e) => setFormUnitCost(e.target.value)}
                  className={inputClass}
                />
              </div>

              {/* Supplier */}
              <div className="space-y-2">
                <label className={labelClass}>Supplier{optionalTag}</label>
                <SearchableSelect
                  id={`${config.idPrefix}-supplier-input`}
                  value={formSupplierId}
                  onChange={(e) => setFormSupplierId(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Select supplier...</option>
                  {lookups.suppliers.map((o) => (
                    <option key={o.id} value={o.id}>{o.label}</option>
                  ))}
                </SearchableSelect>
              </div>

              {/* Warehouse */}
              <div className="space-y-2">
                <label className={labelClass}>Warehouse{optionalTag}</label>
                <input
                  id={`${config.idPrefix}-warehouse-input`}
                  type="text"
                  value={formWarehouse}
                  onChange={(e) => setFormWarehouse(e.target.value)}
                  placeholder="e.g. Main Store"
                  className={inputClass}
                />
              </div>

              {/* Status */}
              <div className="space-y-2">
                <label className={labelClass}>Status</label>
                <SearchableSelect
                  id={`${config.idPrefix}-status-input`}
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as "Active" | "Inactive")}
                  className={inputClass}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Deactive</option>
                </SearchableSelect>
              </div>
            </div>

            {/* Derived-stock note */}
            <div className={`p-3.5 ${accent.tint} rounded-lg text-sm leading-relaxed`}>
              <strong>Note:</strong> Current Stock is not entered here. It is calculated as
              Opening Stock + Goods Received − Returns − Work Order demand, the same figure
              Inventory Summary reports.
              {viewMode === "add" && formMaterialSource === "new" && (
                <> Saving also adds this material to the Material Profile master.</>
              )}
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
                form={`${config.idPrefix}-form`}
                disabled={submitting}
                className={`px-6 py-2.5 text-sm font-semibold text-white ${accent.button} rounded-lg shadow-md active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2`}
              >
                {submitting ? (
                  <><Loader2 size={14} className="animate-spin" /> Saving...</>
                ) : (
                  <><Check size={14} /> {viewMode === "edit" ? `Update ${config.noun}` : `Save ${config.noun}`}</>
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
    const details: { label: string; value: string }[] = [
      { label: config.codeLabel, value: activeItem.code || "—" },
      { label: config.nameLabel, value: activeItem.name },
      { label: "Category",       value: activeItem.categoryName },
      ...(config.showMaterialTypeAndGrade
        ? [
            { label: "Material Type", value: activeItem.materialTypeName || "—" },
            { label: "Grade",         value: activeItem.grade || "—" },
          ]
        : []),
      { label: "UOM",            value: activeItem.uomName },
      { label: "Opening Stock",  value: `${activeItem.openingStock.toFixed(2)} ${activeItem.uomName}` },
      { label: "Current Stock",  value: `${activeItem.currentStock.toFixed(2)} ${activeItem.uomName}` },
      { label: "Reorder Level",  value: `${activeItem.reorderLevel.toFixed(2)} ${activeItem.uomName}` },
      { label: config.costLabel, value: `$${activeItem.unitCost.toFixed(2)}` },
      { label: "Supplier",       value: activeItem.supplierName || "—" },
      { label: "Warehouse",      value: activeItem.warehouse || "—" },
      { label: "Status",         value: activeItem.status === "Active" ? "Active" : "Deactive" },
      { label: "Created Date",   value: formatDate(activeItem.createdAt) },
      { label: "Updated Date",   value: formatDate(activeItem.updatedAt) },
    ];

    return (
      <div className="p-6 lg:p-8 space-y-6">
        {pageHeader}

        <div className="bg-white border border-blue-200 rounded-xl shadow-sm overflow-hidden">
          {/* View header bar */}
          <div className="px-6 py-4 border-b border-blue-100 bg-blue-50/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl ${accent.iconBg} ${accent.iconText} flex items-center justify-center`}>
                <Icon size={17} />
              </div>
              <div>
                <p className="font-bold text-base text-blue-900">{activeItem.code}</p>
                <p className="text-xs text-blue-400">{config.noun} Record — Read Only</p>
              </div>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                activeItem.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-blue-100 text-blue-600"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${activeItem.status === "Active" ? "bg-emerald-500" : "bg-blue-400"}`} />
              {activeItem.status === "Active" ? "Active" : "Deactive"}
            </span>
          </div>

          {/* Detail grid */}
          <div className="p-6">
            <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {details.map(({ label, value }) => (
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
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white ${accent.button} rounded-lg shadow-md active:scale-95 transition-all duration-200`}
            >
              <Edit2 size={14} /> Edit {config.noun}
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

  const hasFilters = Boolean(search) || statusFilter !== "All" || categoryFilter !== "All";

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {pageHeader}

      {/* ── Controls Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-white border border-blue-200 p-4 rounded-xl shadow-sm">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-blue-400" />
          <input
            id={`${config.idPrefix}-search`}
            type="text"
            placeholder="Search code, name, supplier, warehouse..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full pl-9 pr-4 py-2 text-sm bg-blue-50 border border-blue-200 rounded-lg focus:outline-none ${accent.ring} transition-colors`}
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-blue-500 uppercase tracking-wider shrink-0">Category</label>
          <SearchableSelect
            id={`${config.idPrefix}-category-filter`}
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
            className={`text-sm bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 focus:outline-none ${accent.ring} text-blue-700`}
          >
            <option value="All">All</option>
            {lookups.categories.map((o) => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </SearchableSelect>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-blue-500 uppercase tracking-wider shrink-0">Status</label>
          <SearchableSelect
            id={`${config.idPrefix}-status-filter`}
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as StatusFilter); setPage(1); }}
            className={`text-sm bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 focus:outline-none ${accent.ring} text-blue-700`}
          >
            <option value="All">All</option>
            <option value="Active">Active</option>
            <option value="Inactive">Deactive</option>
          </SearchableSelect>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <ArrowUpDown size={14} className="text-blue-400 shrink-0" />
          <SearchableSelect
            id={`${config.idPrefix}-sort`}
            value={sortKey}
            onChange={(e) => { setSortKey(e.target.value as SortKey); setPage(1); }}
            className={`text-sm bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 focus:outline-none ${accent.ring} text-blue-700`}
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
          <Loader2 className={`h-8 w-8 animate-spin ${accent.spinner}`} />
          <p className="text-sm text-blue-500">Loading {config.nounPlural.toLowerCase()}...</p>
        </div>
      ) : errorMsg ? (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 flex items-center gap-3 text-rose-700">
          <AlertCircle size={18} />
          <p className="text-sm font-medium">{errorMsg}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-blue-200 rounded-xl p-12 text-center shadow-sm">
          <div className={`mx-auto w-12 h-12 rounded-full ${accent.iconBg} flex items-center justify-center mb-4`}>
            <Icon size={22} className={accent.iconText} />
          </div>
          <p className="text-blue-600 font-semibold">
            {hasFilters ? `No ${config.nounPlural.toLowerCase()} match your filters.` : `No ${config.nounPlural.toLowerCase()} yet.`}
          </p>
          <p className="text-xs text-blue-400 mt-1">
            {hasFilters
              ? "Try adjusting your search or filter."
              : `Click "Add ${config.noun}" to create your first record.`}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-blue-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm text-blue-600 whitespace-nowrap">
              <thead className="bg-blue-50 text-xs font-bold uppercase tracking-wider text-blue-500 border-b border-blue-200">
                <tr>
                  <th className="px-5 py-4">{config.noun}</th>
                  <th className="px-5 py-4">Category</th>
                  {config.showMaterialTypeAndGrade && <th className="px-5 py-4">Type</th>}
                  {config.showMaterialTypeAndGrade && <th className="px-5 py-4">Grade</th>}
                  <th className="px-5 py-4 text-right">Current Stock</th>
                  <th className="px-5 py-4 text-right">Reorder Level</th>
                  <th className="px-5 py-4 text-right">{config.costLabel}</th>
                  <th className="px-5 py-4">Supplier</th>
                  <th className="px-5 py-4">Warehouse</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-100">
                {pageItems.map((item) => (
                  <tr key={item.id} className="hover:bg-blue-50/50 transition-colors group">

                    {/* Item — clickable to Edit */}
                    <td className="px-5 py-4">
                      <button
                        onClick={() => goEdit(item)}
                        className="inline-flex items-center gap-2.5 text-left group/name"
                        title="Click to edit"
                      >
                        <span className={`w-8 h-8 rounded-lg ${accent.iconBg} ${accent.iconText} flex items-center justify-center shrink-0 ${accent.hoverBg} transition-all duration-200`}>
                          <Icon size={14} />
                        </span>
                        <span>
                          <span className={`block font-semibold text-blue-900 ${accent.hoverText} transition-colors`}>
                            {item.code || "—"}
                          </span>
                          <span className="block text-xs text-blue-500">{item.name}</span>
                        </span>
                        <Edit2 size={12} className="text-blue-300 opacity-0 group-hover/name:opacity-100 transition-all -ml-1" />
                      </button>
                    </td>

                    <td className="px-5 py-4 text-blue-700">{item.categoryName || "—"}</td>
                    {config.showMaterialTypeAndGrade && (
                      <td className="px-5 py-4 text-blue-700">{item.materialTypeName || "—"}</td>
                    )}
                    {config.showMaterialTypeAndGrade && (
                      <td className="px-5 py-4 text-blue-500">{item.grade || "—"}</td>
                    )}

                    {/* Current Stock — derived; flagged at or below the reorder level */}
                    <td className={`px-5 py-4 text-right font-bold ${isLowStock(item) ? "text-rose-600" : "text-blue-900"}`}>
                      {item.currentStock.toFixed(2)} {item.uomName}
                    </td>

                    <td className="px-5 py-4 text-right text-blue-700">
                      {item.reorderLevel.toFixed(2)} {item.uomName}
                    </td>
                    <td className="px-5 py-4 text-right text-blue-700">${item.unitCost.toFixed(2)}</td>
                    <td className="px-5 py-4 text-blue-700">{item.supplierName || "—"}</td>
                    <td className="px-5 py-4 text-blue-500">{item.warehouse || "—"}</td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        item.status === "Active"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                          : "bg-blue-100 text-blue-600 border border-blue-200"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${item.status === "Active" ? "bg-emerald-500" : "bg-blue-400"}`} />
                        {item.status === "Active" ? "Active" : "Deactive"}
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
                id={`${config.idPrefix}-prev-page`}
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
                        page === p ? `${accent.pageActive} text-white shadow-sm` : "border border-blue-200 hover:bg-blue-100"
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}
              <button
                id={`${config.idPrefix}-next-page`}
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
