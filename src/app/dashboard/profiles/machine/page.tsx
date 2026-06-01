"use client";
import { SearchableSelect } from "@/components/SearchableSelect";
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
  Cpu,
  ArrowLeft,
  Edit2,
  Paperclip,
  UploadCloud,
  FileText,
  Eye,
  Trash2,
} from "lucide-react";
import Link from "next/link";
// ─── Types ────────────────────────────────────────────────────────────────────

interface MachineItem {
  id: string;
  machineCode: string;
  machineNo: string;
  brand: string;
  model: string;
  current: string | null;
  serialNo: string | null; // S/No
  machineType: string | null; // CNC / Convention
  operationType: string | null; // Milling / Turning
  remark: string | null;
  uploadUrl: string | null;
  machineCategory: string; // Welding Machine / Machine
  status: "Active" | "Inactive";
  createdAt: string;
  updatedAt: string;
}

type SortKey = "createdAt_desc" | "createdAt_asc" | "machineCode_asc" | "machineCode_desc";
type StatusFilter = "All" | "Active" | "Inactive";
type CategoryFilter = "All" | "Welding Machine" | "Machine";
type ViewMode = "list" | "add" | "edit" | "view";
type UserRole = "Admin" | "User";

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "createdAt_desc", label: "Newest First" },
  { value: "createdAt_asc",  label: "Oldest First" },
  { value: "machineCode_asc",   label: "Machine Code A → Z" },
  { value: "machineCode_desc",  label: "Machine Code Z → A" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function MachineProfilePage() {
  // ── Role state ──
  const [role, setRole] = useState<UserRole>("Admin");

  // ── Data state ──
  const [items, setItems]       = useState<MachineItem[]>([]);
  const [loading, setLoading]   = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // ── View mode ──
  const [viewMode, setViewMode]     = useState<ViewMode>("list");
  const [activeItem, setActiveItem] = useState<MachineItem | null>(null);

  // ── List controls ──
  const [search, setSearch]             = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("All");
  const [sortKey, setSortKey]           = useState<SortKey>("createdAt_desc");
  const [page, setPage]                 = useState(1);

  // ── Form state ──
  const [formMachineCode, setFormMachineCode] = useState("");
  const [formMachineNo, setFormMachineNo]     = useState("");
  const [formBrand, setFormBrand]             = useState("");
  const [formModel, setFormModel]             = useState("");
  const [formCurrent, setFormCurrent]         = useState("");
  const [formSerialNo, setFormSerialNo]       = useState("");
  const [formMachineType, setFormMachineType] = useState(""); // "" or CNC or Convention
  const [formOperationType, setFormOperationType] = useState(""); // "" or Milling or Turning
  const [formRemark, setFormRemark]           = useState("");
  const [formUploadUrl, setFormUploadUrl]     = useState("");
  const [formMachineCategory, setFormMachineCategory] = useState("Machine"); // Default is Machine
  
  const [uploadingFile, setUploadingFile]     = useState(false);
  const [submitting, setSubmitting]           = useState(false);
  const [formError, setFormError]             = useState("");

  // ── Deactivation Confirmation state ──
  const [deactivateTarget, setDeactivateTarget] = useState<MachineItem | null>(null);
  const [isDeactivating, setIsDeactivating] = useState(false);

  // ─────────────────────────────────────────────────────────────────────────────
  // Fetch
  // ─────────────────────────────────────────────────────────────────────────────

  const fetchItems = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch(`/api/profiles/machine?search=${encodeURIComponent(search)}`);
      if (!res.ok) throw new Error("Failed to load Machine records");
      const data: MachineItem[] = await res.json();
      setItems(data);
      setPage(1);
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : "Failed to load Machine records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Client-side filter / sort / paginate
  // ─────────────────────────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    let list = [...items];
    if (statusFilter !== "All") {
      list = list.filter((i) => i.status === statusFilter);
    }
    if (categoryFilter !== "All") {
      list = list.filter((i) => i.machineCategory === categoryFilter);
    }
    list.sort((a, b) => {
      switch (sortKey) {
        case "machineCode_asc":   return a.machineCode.localeCompare(b.machineCode);
        case "machineCode_desc":  return b.machineCode.localeCompare(a.machineCode);
        case "createdAt_asc":  return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "createdAt_desc": return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
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

  const goList = () => { 
    setViewMode("list"); 
    setActiveItem(null); 
    setFormError(""); 
  };

  const goAdd = () => {
    if (role !== "Admin") return;
    setActiveItem(null);
    setFormMachineCode("");
    setFormMachineNo("");
    setFormBrand("");
    setFormModel("");
    setFormCurrent("");
    setFormSerialNo("");
    setFormMachineType("");
    setFormOperationType("");
    setFormRemark("");
    setFormUploadUrl("");
    setFormMachineCategory("Machine");
    setFormError("");
    setViewMode("add");
  };

  const goEdit = (item: MachineItem) => {
    if (role !== "Admin") {
      goView(item);
      return;
    }
    setActiveItem(item);
    setFormMachineCode(item.machineCode);
    setFormMachineNo(item.machineNo);
    setFormBrand(item.brand);
    setFormModel(item.model);
    setFormCurrent(item.current ?? "");
    setFormSerialNo(item.serialNo ?? "");
    setFormMachineType(item.machineType ?? "");
    setFormOperationType(item.operationType ?? "");
    setFormRemark(item.remark ?? "");
    setFormUploadUrl(item.uploadUrl ?? "");
    setFormMachineCategory(item.machineCategory);
    setFormError("");
    setViewMode("edit");
  };

  const goView = (item: MachineItem) => {
    setActiveItem(item);
    setViewMode("view");
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // File Upload handler
  // ─────────────────────────────────────────────────────────────────────────────

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type (PDF/Image)
    const allowedTypes = ["application/pdf", "image/png", "image/jpeg", "image/jpg", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      setFormError("Invalid file type. Only PDF and Image files are allowed.");
      return;
    }

    setUploadingFile(true);
    setFormError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to upload file.");
      }

      const data = await res.json();
      setFormUploadUrl(data.url);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "File upload failed.");
    } finally {
      setUploadingFile(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Form submit
  // ─────────────────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (role !== "Admin") return;
    setSubmitting(true);
    setFormError("");

    const payload: Record<string, string | null> = {
      machineCode: formMachineCode.trim(),
      machineNo:   formMachineNo.trim(),
      brand:       formBrand.trim(),
      model:       formModel.trim(),
      current:     formCurrent.trim() || null,
      serialNo:    formSerialNo.trim() || null,
      machineType: formMachineType || null,
      operationType: formOperationType || null,
      remark:      formRemark.trim() || null,
      uploadUrl:   formUploadUrl || null,
      machineCategory: formMachineCategory,
    };

    if (viewMode === "edit" && activeItem) {
      payload.id = activeItem.id;
    }

    try {
      const method = viewMode === "edit" ? "PUT" : "POST";
      const res = await fetch("/api/profiles/machine", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save Machine Profile.");
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
  // Toggle Status and Confirmation Dialog
  // ─────────────────────────────────────────────────────────────────────────────

  const triggerToggleStatus = async (item: MachineItem) => {
    if (item.status === "Active") {
      // Deactivation requires custom confirmation dialog
      setDeactivateTarget(item);
    } else {
      // Activation is processed directly
      await processToggleStatus(item.id);
    }
  };

  const confirmDeactivate = async () => {
    if (!deactivateTarget) return;
    setIsDeactivating(true);
    try {
      await processToggleStatus(deactivateTarget.id);
      setDeactivateTarget(null);
    } catch (err: unknown) {
      hotToast.error(err instanceof Error ? err.message : "An error occurred during deactivation.");
    } finally {
      setIsDeactivating(false);
    }
  };

  const processToggleStatus = async (id: string) => {
    try {
      const res = await fetch("/api/profiles/machine", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to toggle status");
      }
      fetchItems();
    } catch (e: unknown) {
      throw new Error(e instanceof Error ? e.message : "An error occurred");
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Shared page header
  // ─────────────────────────────────────────────────────────────────────────────

  const isForm = viewMode === "add" || viewMode === "edit";
  const isView = viewMode === "view";

  const pageHeader = (
    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 pb-6 border-b border-blue-200 ">
      <div>
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-blue-400 font-semibold tracking-wider uppercase mb-1">
          <Link href="/dashboard" className="hover:text-blue-600 :text-blue-300">Dashboard</Link>
          <span>/</span>
          <Link href="/dashboard/profiles" className="hover:text-blue-600 :text-blue-300">Profiles</Link>
          <span>/</span>
          {isForm || isView ? (
            <>
              <button onClick={goList} className="hover:text-blue-600 :text-blue-300">Machine Profile</button>
              <span>/</span>
              <span className="text-blue-500 ">
                {viewMode === "add" ? "Add Machine" : viewMode === "edit" ? "Edit Machine" : "View Machine"}
              </span>
            </>
          ) : (
            <span className="text-blue-500 ">Machine Profile</span>
          )}
        </div>

        {/* Title row */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
            <Cpu size={20} />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-blue-900 ">
              {viewMode === "add" ? "Add Machine" : viewMode === "edit" ? "Edit Machine" : "Machine Profile"}
            </h2>
            <p className="text-sm text-blue-500 mt-0.5">
              {isForm
                ? "Fill in the specifications, categories, and upload files below."
                : "Manage machines, CNC parameters, conventional mills, and welding parameters."}
            </p>
          </div>
        </div>
      </div>

      {/* Mock Role Switcher and Actions */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Mock Role Dropdown */}
        <div className="flex items-center gap-2 bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200 ">
          <label className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">Role</label>
          <SearchableSelect
            value={role}
            onChange={(e) => {
              const selectedRole = e.target.value as UserRole;
              setRole(selectedRole);
              // If we change role to User while editing/adding, redirect back to list
              if (selectedRole === "User" && isForm) {
                goList();
              }
            }}
            className="text-xs font-semibold bg-transparent border-none focus:outline-none text-blue-700 cursor-pointer"
          >
            <option value="Admin">Admin (Full CRUD)</option>
            <option value="User">User (View Only)</option>
          </SearchableSelect>
        </div>

        {viewMode === "list" && role === "Admin" && (
          <button
            id="btn-add-machine"
            onClick={goAdd}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 rounded-lg shadow-md shadow-amber-500/20 active:scale-95 transition-all duration-200 shrink-0"
          >
            <Plus size={16} /> Add Machine
          </button>
        )}

        {(isForm || isView) && (
          <button
            onClick={goList}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-blue-600 bg-white border border-blue-200 rounded-lg hover:bg-blue-100 :bg-blue-800 transition-colors shrink-0"
          >
            <ArrowLeft size={16} /> Back to List
          </button>
        )}
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // Render — Add / Edit Form (inline)
  // ─────────────────────────────────────────────────────────────────────────────

  if (isForm) {
    return (
      <div className="p-6 lg:p-8 space-y-6">
        {pageHeader}

        <div className="bg-white border border-blue-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-blue-100 bg-blue-50/60 flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
              <Cpu size={15} />
            </div>
            <span className="font-semibold text-sm text-blue-700 ">
              Machine Specification Form
            </span>
          </div>

          <form id="machine-form" onSubmit={handleSubmit} className="p-6 space-y-6">
            {formError && (
              <div className="p-3 bg-rose-50 text-rose-700 text-sm font-medium rounded-lg flex items-center gap-2 border border-rose-200 animate-shake">
                <AlertCircle size={15} />
                <span>{formError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Machine Code */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-blue-500 ">
                  Machine Code <span className="text-rose-500">*</span>
                  {viewMode === "edit" && (
                    <span className="text-[10px] text-blue-400 font-normal normal-case ml-1 bg-blue-100 px-1.5 py-0.5 rounded">
                      locked
                    </span>
                  )}
                </label>
                <input
                  id="machine-code-input"
                  type="text"
                  required
                  disabled={viewMode === "edit"}
                  value={formMachineCode}
                  onChange={(e) => setFormMachineCode(e.target.value.toUpperCase())}
                  placeholder="e.g. CNC-01"
                  className="w-full px-3 py-2.5 text-sm bg-blue-50 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                />
              </div>

              {/* Machine No */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-blue-500 ">
                  Machine No <span className="text-rose-500">*</span>
                </label>
                <input
                  id="machine-no-input"
                  type="text"
                  required
                  value={formMachineNo}
                  onChange={(e) => setFormMachineNo(e.target.value)}
                  placeholder="e.g. M-9982"
                  className="w-full px-3 py-2.5 text-sm bg-blue-50 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors"
                />
              </div>

              {/* Machine Category */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-blue-500 ">
                  Machine Category <span className="text-rose-500">*</span>
                </label>
                <SearchableSelect
                  id="machine-category-select"
                  value={formMachineCategory}
                  onChange={(e) => setFormMachineCategory(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm bg-blue-50 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-blue-700 transition-colors"
                >
                  <option value="Machine">Machine</option>
                  <option value="Welding Machine">Welding Machine</option>
                </SearchableSelect>
              </div>

              {/* Brand */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-blue-500 ">
                  Brand <span className="text-rose-500">*</span>
                </label>
                <input
                  id="machine-brand-input"
                  type="text"
                  required
                  value={formBrand}
                  onChange={(e) => setFormBrand(e.target.value)}
                  placeholder="e.g. Mazak"
                  className="w-full px-3 py-2.5 text-sm bg-blue-50 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors"
                />
              </div>

              {/* Model */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-blue-500 ">
                  Model <span className="text-rose-500">*</span>
                </label>
                <input
                  id="machine-model-input"
                  type="text"
                  required
                  value={formModel}
                  onChange={(e) => setFormModel(e.target.value)}
                  placeholder="e.g. Quick Turn 250"
                  className="w-full px-3 py-2.5 text-sm bg-blue-50 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors"
                />
              </div>

              {/* S/No (Serial No) */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-blue-500 ">
                  S/No (Serial No) <span className="text-[10px] font-normal normal-case text-blue-400">(optional)</span>
                </label>
                <input
                  id="machine-serial-input"
                  type="text"
                  value={formSerialNo}
                  onChange={(e) => setFormSerialNo(e.target.value)}
                  placeholder="e.g. SN-883719"
                  className="w-full px-3 py-2.5 text-sm bg-blue-50 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors"
                />
              </div>

              {/* Machine Type */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-blue-500 ">
                  Machine Type <span className="text-[10px] font-normal normal-case text-blue-400">(optional)</span>
                </label>
                <SearchableSelect
                  id="machine-type-select"
                  value={formMachineType}
                  onChange={(e) => setFormMachineType(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm bg-blue-50 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-blue-700 transition-colors"
                >
                  <option value="">Select...</option>
                  <option value="CNC">CNC</option>
                  <option value="Convention">Convention</option>
                </SearchableSelect>
              </div>

              {/* Operation Type */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-blue-500 ">
                  Operation Type <span className="text-[10px] font-normal normal-case text-blue-400">(optional)</span>
                </label>
                <SearchableSelect
                  id="machine-operation-select"
                  value={formOperationType}
                  onChange={(e) => setFormOperationType(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm bg-blue-50 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-blue-700 transition-colors"
                >
                  <option value="">Select...</option>
                  <option value="Milling">Milling</option>
                  <option value="Turning">Turning</option>
                </SearchableSelect>
              </div>

              {/* Current */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-blue-500 ">
                  Current <span className="text-[10px] font-normal normal-case text-blue-400">(optional)</span>
                </label>
                <input
                  id="machine-current-input"
                  type="text"
                  value={formCurrent}
                  onChange={(e) => setFormCurrent(e.target.value)}
                  placeholder="e.g. 400A"
                  className="w-full px-3 py-2.5 text-sm bg-blue-50 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors"
                />
              </div>
            </div>

            {/* Remarks */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-blue-500 ">
                Remarks <span className="text-[10px] font-normal normal-case text-blue-400">(optional)</span>
              </label>
              <textarea
                id="machine-remark-input"
                value={formRemark}
                onChange={(e) => setFormRemark(e.target.value)}
                placeholder="Enter details about machine operation tolerances, maintenance schedule, or calibration values..."
                rows={3}
                className="w-full px-3 py-2.5 text-sm bg-blue-50 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-none transition-colors"
              />
            </div>

            {/* File Upload Component */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-blue-500 ">
                Upload Specification Sheet / Image <span className="text-[10px] font-normal normal-case text-blue-400">(optional, PDF or Image)</span>
              </label>
              
              <div className="border border-dashed border-blue-200 rounded-xl p-4 bg-blue-50/50 flex flex-col items-center justify-center gap-3">
                {formUploadUrl ? (
                  <div className="flex items-center justify-between w-full max-w-lg p-3 bg-white border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 text-sm font-medium text-blue-700 ">
                      <FileText size={16} className="text-amber-500" />
                      <a href={formUploadUrl} target="_blank" rel="noopener noreferrer" className="hover:underline truncate max-w-xs">
                        {formUploadUrl.split("/").pop()}
                      </a>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormUploadUrl("")}
                      className="p-1.5 text-blue-400 hover:text-rose-500 rounded-md hover:bg-blue-50 :bg-blue-900 transition-colors"
                      title="Remove file"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ) : uploadingFile ? (
                  <div className="flex flex-col items-center gap-2 py-4">
                    <Loader2 size={24} className="text-amber-500 animate-spin" />
                    <span className="text-xs font-semibold text-blue-500">Uploading attachment...</span>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center gap-2 cursor-pointer w-full py-4 text-center group">
                    <UploadCloud size={28} className="text-blue-400 group-hover:text-amber-500 transition-colors" />
                    <div>
                      <p className="text-sm font-semibold text-blue-700 group-hover:text-amber-500 transition-colors">
                        Click to upload specification
                      </p>
                      <p className="text-[10px] text-blue-400 mt-0.5">Supports PDF, PNG, JPG, JPEG, GIF up to 5MB</p>
                    </div>
                    <input
                      id="machine-file-upload"
                      type="file"
                      accept=".pdf,image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700 leading-relaxed">
              <strong>Note:</strong> The Machine Code is unique and cannot be modified once saved. Please ensure it aligns with your asset tracking code.
            </div>

            {/* Form actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-blue-100 ">
              <button
                type="button"
                onClick={goList}
                className="px-5 py-2.5 text-sm font-semibold text-blue-600 bg-white border border-blue-200 rounded-lg hover:bg-blue-100 :bg-blue-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="machine-form"
                disabled={submitting || uploadingFile}
                className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 rounded-lg shadow-md shadow-amber-500/20 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                {submitting ? (
                  <><Loader2 size={14} className="animate-spin" /> Saving...</>
                ) : (
                  <><Check size={14} /> {viewMode === "edit" ? "Update Machine" : "Save Machine"}</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Render — View Detail (inline, read-only)
  // ─────────────────────────────────────────────────────────────────────────────

  if (isView && activeItem) {
    return (
      <div className="p-6 lg:p-8 space-y-6">
        {pageHeader}

        <div className="bg-white border border-blue-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-blue-100 bg-blue-50/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Cpu size={17} />
              </div>
              <div>
                <p className="font-bold text-base text-blue-900 ">{activeItem.machineCode}</p>
                <p className="text-xs text-blue-400">Machine Specifications — {activeItem.machineCategory}</p>
              </div>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                activeItem.status === "Active"
                  ? "bg-emerald-50 text-emerald-700 "
                  : "bg-blue-100 text-blue-600 "
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${activeItem.status === "Active" ? "bg-emerald-500" : "bg-blue-400"}`} />
              {activeItem.status === "Active" ? "Active" : "Deactive"}
            </span>
          </div>

          <div className="p-6 space-y-8">
            <dl className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {[
                { label: "Machine Code", value: activeItem.machineCode },
                { label: "Machine No", value: activeItem.machineNo },
                { label: "Machine Category", value: activeItem.machineCategory },
                { label: "Brand", value: activeItem.brand },
                { label: "Model", value: activeItem.model },
                { label: "S/No (Serial No)", value: activeItem.serialNo || <span className="text-blue-300 italic">None</span> },
                { label: "Machine Type", value: activeItem.machineType || <span className="text-blue-300 italic">N/A</span> },
                { label: "Operation Type", value: activeItem.operationType || <span className="text-blue-300 italic">N/A</span> },
                { label: "Current", value: activeItem.current || <span className="text-blue-300 italic">N/A</span> },
                { label: "Created Date", value: formatDate(activeItem.createdAt) },
                { label: "Updated Date", value: formatDate(activeItem.updatedAt) },
              ].map(({ label, value }) => (
                <div key={label} className="space-y-1">
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-blue-400 ">{label}</dt>
                  <dd className="text-sm font-semibold text-blue-800 ">{value}</dd>
                </div>
              ))}

              {/* Uploaded attachment */}
              <div className="space-y-1 sm:col-span-2">
                <dt className="text-[11px] font-bold uppercase tracking-wider text-blue-400 ">Specification Sheet / Image</dt>
                <dd className="text-sm font-semibold text-blue-850 mt-1">
                  {activeItem.uploadUrl ? (
                    <a
                      href={activeItem.uploadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-amber-600 hover:text-amber-700 hover:border-amber-500/30 transition-all"
                    >
                      <Paperclip size={14} />
                      <span className="truncate max-w-xs">{activeItem.uploadUrl.split("/").pop()}</span>
                    </a>
                  ) : (
                    <span className="text-blue-300 italic text-xs">No attachment uploaded</span>
                  )}
                </dd>
              </div>

              {/* Remark spans full width */}
              <div className="space-y-1 sm:col-span-3">
                <dt className="text-[11px] font-bold uppercase tracking-wider text-blue-400 ">Remarks</dt>
                <dd className="text-sm font-medium text-blue-600 leading-relaxed whitespace-pre-wrap">
                  {activeItem.remark || <span className="text-blue-300 italic">No remarks provided</span>}
                </dd>
              </div>
            </dl>
          </div>

          <div className="px-6 pb-6 flex items-center gap-3">
            {role === "Admin" && (
              <button
                onClick={() => goEdit(activeItem)}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 rounded-lg shadow-md shadow-amber-500/20 active:scale-95 transition-all duration-200"
              >
                <Edit2 size={14} /> Edit Machine
              </button>
            )}
            <button
              onClick={goList}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-blue-600 bg-white border border-blue-200 rounded-lg hover:bg-blue-100 :bg-blue-800 transition-colors"
            >
              <X size={14} /> Close View
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Render — List View
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {pageHeader}

      {/* ── Controls Bar ── */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3 bg-white border border-blue-200 p-4 rounded-xl shadow-sm">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-blue-400 " />
          <input
            id="machine-search"
            type="text"
            placeholder="Search code, number, brand, model..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-blue-50 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-bold text-blue-500 uppercase tracking-wider shrink-0">Category</label>
            <SearchableSelect
              id="machine-category-filter"
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value as CategoryFilter); setPage(1); }}
              className="text-sm bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-blue-700 cursor-pointer"
            >
              <option value="All">All Categories</option>
              <option value="Machine">Machine</option>
              <option value="Welding Machine">Welding Machine</option>
            </SearchableSelect>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-bold text-blue-500 uppercase tracking-wider shrink-0">Status</label>
            <SearchableSelect
              id="machine-status-filter"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as StatusFilter); setPage(1); }}
              className="text-sm bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-blue-700 cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Deactive</option>
            </SearchableSelect>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <ArrowUpDown size={14} className="text-blue-400 shrink-0" />
            <SearchableSelect
              id="machine-sort"
              value={sortKey}
              onChange={(e) => { setSortKey(e.target.value as SortKey); setPage(1); }}
              className="text-sm bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-blue-700 cursor-pointer"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </SearchableSelect>
          </div>
        </div>
      </div>

      {/* ── Table Area ── */}
      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
          <p className="text-sm text-blue-500">Loading machine profiles...</p>
        </div>
      ) : errorMsg ? (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 flex items-center gap-3 text-rose-700 ">
          <AlertCircle size={18} />
          <p className="text-sm font-medium">{errorMsg}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-blue-200 rounded-xl p-12 text-center shadow-sm">
          <div className="mx-auto w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mb-4">
            <Cpu size={22} className="text-amber-500" />
          </div>
          <p className="text-blue-600 font-semibold">
            {search ? "No Machines Found" : "No Machine Profile records found."}
          </p>
          <p className="text-xs text-blue-400 mt-1">
            {search || statusFilter !== "All" || categoryFilter !== "All"
              ? "Try adjusting your search or filters."
              : 'Click "Add Machine" in Admin mode to configure your first record.'}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-blue-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm text-blue-600 ">
              <thead className="bg-blue-50 text-xs font-bold uppercase tracking-wider text-blue-500 border-b border-blue-200 ">
                <tr>
                  <th className="px-5 py-4">Machine Code</th>
                  <th className="px-5 py-4">Machine No</th>
                  <th className="px-5 py-4">Brand</th>
                  <th className="px-5 py-4">Model</th>
                  <th className="px-5 py-4">Machine Type</th>
                  <th className="px-5 py-4">Operation Type</th>
                  <th className="px-5 py-4">Category</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-100 ">
                {pageItems.map((item) => (
                  <tr key={item.id} className="hover:bg-blue-50/50 :bg-blue-800/20 transition-colors group">
                    {/* Machine Code — Click to View or Edit depending on role */}
                    <td className="px-5 py-4">
                      <button
                        onClick={() => role === "Admin" ? goEdit(item) : goView(item)}
                        className="inline-flex items-center gap-2 text-left group/code cursor-pointer"
                        title={role === "Admin" ? "Click to edit" : "Click to view"}
                      >
                        <span className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 group-hover/code:bg-amber-600 group-hover/code:text-white transition-all duration-200">
                          <Cpu size={14} />
                        </span>
                        <span className="font-bold text-blue-900 group-hover/code:text-amber-600 :text-amber-400 transition-colors">
                          {item.machineCode}
                        </span>
                        {role === "Admin" && (
                          <Edit2 size={10} className="text-blue-300 group-hover/code:text-amber-500 opacity-0 group-hover/code:opacity-100 transition-all -ml-0.5" />
                        )}
                      </button>
                    </td>

                    {/* Machine No */}
                    <td className="px-5 py-4 font-medium text-blue-700 ">
                      {item.machineNo}
                    </td>

                    {/* Brand */}
                    <td className="px-5 py-4 font-semibold text-blue-900 ">
                      {item.brand}
                    </td>

                    {/* Model */}
                    <td className="px-5 py-4 text-blue-750 ">
                      {item.model}
                    </td>

                    {/* Machine Type */}
                    <td className="px-5 py-4 text-xs font-semibold text-blue-500 ">
                      {item.machineType ? (
                        <span className="inline-block bg-blue-100 px-1.5 py-0.5 rounded font-bold">
                          {item.machineType}
                        </span>
                      ) : (
                        <span className="text-blue-350 italic">—</span>
                      )}
                    </td>

                    {/* Operation Type */}
                    <td className="px-5 py-4 text-xs text-blue-500 ">
                      {item.operationType ? (
                        <span className="inline-block bg-blue-100 px-1.5 py-0.5 rounded">
                          {item.operationType}
                        </span>
                      ) : (
                        <span className="text-blue-350 italic">—</span>
                      )}
                    </td>

                    {/* Category */}
                    <td className="px-5 py-4 text-xs font-semibold text-blue-500 ">
                      {item.machineCategory}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        item.status === "Active"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60 "
                          : "bg-blue-100 text-blue-600 border border-blue-200 "
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${item.status === "Active" ? "bg-emerald-500" : "bg-blue-400"}`} />
                        {item.status === "Active" ? "Active" : "Deactive"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => goView(item)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-blue-200 hover:bg-blue-100 :bg-blue-800 text-blue-700 transition-all active:scale-95 cursor-pointer"
                          title="View Details"
                        >
                          <Eye size={12} /> View
                        </button>

                        {role === "Admin" && (
                          <>
                            <button
                              onClick={() => goEdit(item)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-blue-200 hover:bg-blue-100 :bg-blue-800 text-blue-700 transition-all active:scale-95 cursor-pointer"
                              title="Edit Record"
                            >
                              <Edit2 size={12} /> Edit
                            </button>
                            <button
                              id={`btn-toggle-${item.id}`}
                              onClick={() => triggerToggleStatus(item)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all active:scale-95 cursor-pointer ${
                                item.status === "Active"
                                  ? "text-rose-600 border-rose-200 hover:bg-rose-50 :bg-rose-500/10"
                                  : "text-emerald-600 border-emerald-200 hover:bg-emerald-50 :bg-emerald-500/10"
                              }`}
                              title={item.status === "Active" ? "Deactivate" : "Activate"}
                            >
                              <Power size={12} />
                              {item.status === "Active" ? "Deactivate" : "Activate"}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination footer */}
          <div className="px-5 py-3 border-t border-blue-100 flex items-center justify-between text-xs text-blue-500 bg-blue-50/50 ">
            <span>
              Showing{" "}
              <span className="font-semibold text-blue-700 ">
                {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-blue-700 ">{filtered.length}</span>{" "}
              records
            </span>
            <div className="flex items-center gap-1">
              <button
                id="machine-prev-page"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-blue-200 hover:bg-blue-100 :bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
                          ? "bg-amber-600 text-white shadow-sm"
                          : "border border-blue-200 hover:bg-blue-100 :bg-blue-800"
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}
              <button
                id="machine-next-page"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg border border-blue-200 hover:bg-blue-100 :bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Custom Deactivation Confirmation Modal ── */}
      {deactivateTarget && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-blue-950/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-blue-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 text-rose-600 ">
                <AlertCircle size={24} />
                <h3 className="text-lg font-bold">Confirm Deactivation</h3>
              </div>
              <p className="text-sm text-blue-600 leading-relaxed">
                Are you sure you want to deactivate machine <strong className="text-blue-900 ">{deactivateTarget.machineCode}</strong> (<strong className="text-blue-900 ">{deactivateTarget.machineNo}</strong>)?
                This will make it unavailable for production orders.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-blue-50 border-t border-blue-100 ">
              <button
                onClick={() => setDeactivateTarget(null)}
                className="px-4 py-2 text-sm font-semibold text-blue-600 bg-white border border-blue-200 rounded-lg hover:bg-blue-100 :bg-blue-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeactivate}
                disabled={isDeactivating}
                className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-md shadow-rose-500/20 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
              >
                {isDeactivating ? (
                  <><Loader2 size={14} className="animate-spin" /> Deactivating...</>
                ) : (
                  <>Deactivate Machine</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
