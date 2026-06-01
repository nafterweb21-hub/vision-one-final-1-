"use client";

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
  Box,
  ArrowLeft,
  Edit2,
  Trash2,
} from "lucide-react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FinishedGoodItem {
  id: string;
  partNo: string | null;
  description: string;
  remark: string | null;
  status: "Active" | "Inactive";
  createdAt: string;
  updatedAt: string;
}

type SortKey = "partNo_asc" | "partNo_desc" | "description_asc" | "description_desc" | "createdAt_desc" | "createdAt_asc";
type StatusFilter = "All" | "Active" | "Inactive";
type ViewMode = "list" | "add" | "edit" | "view";

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "createdAt_desc", label: "Newest First" },
  { value: "createdAt_asc",  label: "Oldest First" },
  { value: "partNo_asc",   label: "Part No A → Z" },
  { value: "partNo_desc",  label: "Part No Z → A" },
  { value: "description_asc",   label: "Description A → Z" },
  { value: "description_desc",  label: "Description Z → A" },
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

export default function FinishedGoodProfilePage() {
  // ── Data state ──
  const [items, setItems]       = useState<FinishedGoodItem[]>([]);
  const [loading, setLoading]   = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // ── View mode ──
  const [viewMode, setViewMode]     = useState<ViewMode>("list");
  const [activeItem, setActiveItem] = useState<FinishedGoodItem | null>(null);

  // ── List controls ──
  const [search, setSearch]             = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [sortKey, setSortKey]           = useState<SortKey>("createdAt_desc");
  const [page, setPage]                 = useState(1);

  // ── Form state ──
  const [formPartNo, setFormPartNo]           = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formRemark, setFormRemark]           = useState("");
  const [submitting, setSubmitting]           = useState(false);
  const [formError, setFormError]             = useState("");

  // ─────────────────────────────────────────────────────────────────────────────
  // Fetch
  // ─────────────────────────────────────────────────────────────────────────────

  const fetchItems = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch(`/api/profiles/finished-good?search=${encodeURIComponent(search)}`);
      if (!res.ok) throw new Error("Failed to load Finished Goods");
      const data: FinishedGoodItem[] = await res.json();
      setItems(data);
      setPage(1);
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : "Failed to load Finished Goods");
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
    if (statusFilter !== "All") list = list.filter((i) => i.status === statusFilter);
    list.sort((a, b) => {
      switch (sortKey) {
        case "partNo_asc":   return (a.partNo || "").localeCompare(b.partNo || "");
        case "partNo_desc":  return (b.partNo || "").localeCompare(a.partNo || "");
        case "description_asc":   return a.description.localeCompare(b.description);
        case "description_desc":  return b.description.localeCompare(a.description);
        case "createdAt_asc":  return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "createdAt_desc": return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
    return list;
  }, [items, statusFilter, sortKey]);

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
    setFormPartNo("");
    setFormDescription("");
    setFormRemark("");
    setFormError("");
    setViewMode("add");
  };

  const goEdit = (item: FinishedGoodItem) => {
    setActiveItem(item);
    setFormPartNo(item.partNo ?? "");
    setFormDescription(item.description);
    setFormRemark(item.remark ?? "");
    setFormError("");
    setViewMode("edit");
  };

  const goView = (item: FinishedGoodItem) => {
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

    const payload: { id?: string; partNo: string | null; description: string; remark: string | null } = {
      partNo: formPartNo.trim() || null,
      description: formDescription.trim(),
      remark:   formRemark.trim() || null,
    };
    if (viewMode === "edit" && activeItem) {
      payload.id = activeItem.id;
    }

    try {
      const method = viewMode === "edit" ? "PUT" : "POST";
      const res = await fetch("/api/profiles/finished-good", {
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
  // Actions
  // ─────────────────────────────────────────────────────────────────────────────

  const handleToggleStatus = async (item: FinishedGoodItem) => {
    const actionText = item.status === "Active" ? "deactivate" : "activate";
    if (!confirm(`Are you sure you want to ${actionText} this Finished Good (${item.description})?`)) {
      return;
    }
    try {
      const res = await fetch("/api/profiles/finished-good", {
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
      alert(e instanceof Error ? e.message : "An error occurred");
    }
  };

  const handleDelete = async (item: FinishedGoodItem) => {
    if (!confirm(`Are you sure you want to delete this Finished Good (${item.description})?`)) {
      return;
    }
    try {
      const res = await fetch("/api/profiles/finished-good", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete");
      }
      fetchItems();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "An error occurred");
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
          <Link href="/dashboard" className="hover:text-blue-600 :text-blue-300">Dashboard</Link>
          <span>/</span>
          <Link href="/dashboard/profiles" className="hover:text-blue-600 :text-blue-300">Profiles</Link>
          <span>/</span>
          {isForm || isView ? (
            <>
              <button onClick={goList} className="hover:text-blue-600 :text-blue-300">Finished Good Profile</button>
              <span>/</span>
              <span className="text-blue-500 ">
                {viewMode === "add" ? "Add Finished Good" : viewMode === "edit" ? "Edit Finished Good" : "View Finished Good"}
              </span>
            </>
          ) : (
            <span className="text-blue-500 ">Finished Good Profile</span>
          )}
        </div>

        {/* Title row */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
            <Box size={20} />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-blue-900 ">
              {viewMode === "add" ? "Add Finished Good" : viewMode === "edit" ? "Edit Finished Good" : "Finished Good Profile"}
            </h2>
            <p className="text-sm text-blue-500 mt-0.5">
              {isForm
                ? "Fill in the details below and click Save."
                : "Manage the list of finished goods to be used in sales orders."}
            </p>
          </div>
        </div>
      </div>

      {/* Right-side action */}
      {viewMode === "list" && (
        <button
          onClick={goAdd}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-lg shadow-md shadow-emerald-500/20 active:scale-95 transition-all duration-200 shrink-0"
        >
          <Plus size={16} /> Add Finished Good
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

  // ─────────────────────────────────────────────────────────────────────────────
  // Render — Add form
  // ─────────────────────────────────────────────────────────────────────────────

  if (isForm) {
    return (
      <div className="p-6 lg:p-8 space-y-6">
        {pageHeader}

        <div className="bg-white border border-blue-200 rounded-xl shadow-sm overflow-hidden">
          {/* Form header bar */}
          <div className="px-6 py-4 border-b border-blue-100 bg-emerald-50/60 flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600">
              <Box size={15} />
            </div>
            <span className="font-semibold text-sm text-emerald-800 ">
              Finished Good Information
            </span>
          </div>

          <form id="finished-good-form" onSubmit={handleSubmit} className="p-6 space-y-6">
            {formError && (
              <div className="p-3 bg-rose-50 text-rose-700 text-sm font-medium rounded-lg flex items-center gap-2 border border-rose-200 ">
                <AlertCircle size={15} />
                <span>{formError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 gap-6">
              {/* Part No */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-blue-500 flex items-center gap-1">
                  Part No
                  {viewMode === "edit" && (
                    <span className="text-[10px] text-blue-400 font-normal normal-case ml-1 bg-blue-100 px-1.5 py-0.5 rounded">
                      locked
                    </span>
                  )}
                  <span className="ml-1.5 text-[10px] font-normal normal-case text-blue-400">(optional)</span>
                </label>
                <input
                  type="text"
                  disabled={viewMode === "edit"}
                  value={formPartNo}
                  onChange={(e) => setFormPartNo(e.target.value)}
                  placeholder="e.g. FG-1001"
                  className="w-full px-3 py-2.5 text-sm bg-blue-50 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-blue-500 flex items-center gap-1">
                  Description <span className="text-rose-500">*</span>
                  {viewMode === "edit" && (
                    <span className="text-[10px] text-blue-400 font-normal normal-case ml-1 bg-blue-100 px-1.5 py-0.5 rounded">
                      locked
                    </span>
                  )}
                </label>
                <textarea
                  required
                  disabled={viewMode === "edit"}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Detailed description of the finished good..."
                  rows={2}
                  className="w-full px-3 py-2.5 text-sm bg-blue-50 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 resize-none disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                />
              </div>

              {/* Remark */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-blue-500 ">
                  Remark
                  <span className="ml-1.5 text-[10px] font-normal normal-case text-blue-400">(optional)</span>
                </label>
                <textarea
                  value={formRemark}
                  onChange={(e) => setFormRemark(e.target.value)}
                  placeholder="Optional notes..."
                  rows={3}
                  className="w-full px-3 py-2.5 text-sm bg-blue-50 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 resize-none transition-colors"
                />
              </div>
            </div>

            {/* Note banner */}
            <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700 leading-relaxed">
              <strong>Note:</strong> Part No and Description cannot be changed once the record is saved. Please double-check before submitting.
            </div>

            {/* Form action buttons */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-blue-100 ">
              <button
                type="button"
                onClick={goList}
                className="px-5 py-2.5 text-sm font-semibold text-blue-600 bg-white border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="finished-good-form"
                disabled={submitting}
                className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-lg shadow-md shadow-emerald-500/20 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                {submitting ? (
                  <><Loader2 size={14} className="animate-spin" /> Saving...</>
                ) : (
                  <><Check size={14} /> {viewMode === "edit" ? "Update Finished Good" : "Save Finished Good"}</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Render — View detail
  // ─────────────────────────────────────────────────────────────────────────────

  if (isView && activeItem) {
    return (
      <div className="p-6 lg:p-8 space-y-6">
        {pageHeader}

        <div className="bg-white border border-blue-200 rounded-xl shadow-sm overflow-hidden">
          {/* View header bar */}
          <div className="px-6 py-4 border-b border-blue-100 bg-emerald-50/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <Box size={17} />
              </div>
              <div>
                <p className="font-bold text-base text-blue-900 ">{activeItem.partNo || "N/A"}</p>
                <p className="text-xs text-blue-400">Finished Good Record — Read Only</p>
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
              {activeItem.status === "Active" ? "Active" : "Inactive"}
            </span>
          </div>

          {/* Detail grid */}
          <div className="p-6">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                { label: "Part No", value: activeItem.partNo || "N/A" },
                { label: "Status",  value: activeItem.status },
                { label: "Created Date", value: formatDate(activeItem.createdAt) },
                { label: "Updated Date", value: formatDate(activeItem.updatedAt) },
              ].map(({ label, value }) => (
                <div key={label} className="space-y-1">
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-blue-400 ">{label}</dt>
                  <dd className="text-sm font-semibold text-blue-800 ">{value}</dd>
                </div>
              ))}

              <div className="space-y-1 sm:col-span-2">
                <dt className="text-[11px] font-bold uppercase tracking-wider text-blue-400 ">Description</dt>
                <dd className="text-sm font-medium text-blue-600 leading-relaxed">
                  {activeItem.description}
                </dd>
              </div>

              <div className="space-y-1 sm:col-span-2">
                <dt className="text-[11px] font-bold uppercase tracking-wider text-blue-400 ">Remark</dt>
                <dd className="text-sm font-medium text-blue-600 leading-relaxed">
                  {activeItem.remark || <span className="text-blue-300 italic">No remark provided</span>}
                </dd>
              </div>
            </dl>
          </div>

          {/* View footer actions */}
          <div className="px-6 pb-6 flex items-center gap-3">
            <button
              onClick={() => goEdit(activeItem)}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-lg shadow-md shadow-emerald-500/20 active:scale-95 transition-all duration-200"
            >
              <Edit2 size={14} /> Edit Finished Good
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
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-blue-400 " />
          <input
            type="text"
            placeholder="Search part no, description, or remark..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-blue-50 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-blue-500 uppercase tracking-wider shrink-0">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as StatusFilter); setPage(1); }}
            className="text-sm bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-blue-700 "
          >
            <option value="All">All</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <ArrowUpDown size={14} className="text-blue-400 shrink-0" />
          <select
            value={sortKey}
            onChange={(e) => { setSortKey(e.target.value as SortKey); setPage(1); }}
            className="text-sm bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-blue-700 "
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Table Area ── */}
      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-sm text-emerald-600">Loading Finished Goods...</p>
        </div>
      ) : errorMsg ? (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 flex items-center gap-3 text-rose-700 ">
          <AlertCircle size={18} />
          <p className="text-sm font-medium">{errorMsg}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-blue-200 rounded-xl p-12 text-center shadow-sm">
          <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
            <Box size={22} className="text-emerald-500" />
          </div>
          <p className="text-blue-600 font-semibold">
            {search ? "No Finished Good Found" : statusFilter !== "All" ? "No records match your filters." : "No Finished Goods yet."}
          </p>
          <p className="text-xs text-blue-400 mt-1">
            {search || statusFilter !== "All"
              ? "Try adjusting your search or filter."
              : 'Click "Add Finished Good" to create your first record.'}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-blue-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm text-blue-600 ">
              <thead className="bg-blue-50 text-xs font-bold uppercase tracking-wider text-blue-500 border-b border-blue-200 ">
                <tr>
                  <th className="px-5 py-4">Part No</th>
                  <th className="px-5 py-4">Description</th>
                  <th className="px-5 py-4">Remark</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-100 ">
                {pageItems.map((item) => (
                  <tr key={item.id} className="hover:bg-blue-50/50 transition-colors group">
                    {/* Part No */}
                    <td className="px-5 py-4">
                      <button
                        onClick={() => goEdit(item)}
                        className="inline-flex items-center gap-2.5 text-left group/name"
                        title="Click to edit"
                      >
                        <span className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 group-hover/name:bg-emerald-600 group-hover/name:text-white transition-all duration-200">
                          <Box size={14} />
                        </span>
                        <span className="font-semibold text-blue-900 group-hover/name:text-emerald-600 transition-colors">
                          {item.partNo || <span className="text-blue-300 font-normal italic">N/A</span>}
                        </span>
                        <Edit2 size={12} className="text-blue-300 group-hover/name:text-emerald-500 opacity-0 group-hover/name:opacity-100 transition-all -ml-1" />
                      </button>
                    </td>

                    {/* Description */}
                    <td className="px-5 py-4">
                      <span className="font-semibold text-blue-900">{item.description}</span>
                    </td>

                    {/* Remark */}
                    <td className="px-5 py-4 text-blue-500 max-w-[200px]">
                      {item.remark ? (
                        <span className="truncate block text-sm" title={item.remark}>{item.remark}</span>
                      ) : (
                        <span className="text-blue-300 text-sm italic">—</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        item.status === "Active"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60 "
                          : "bg-blue-100 text-blue-600 border border-blue-200 "
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${item.status === "Active" ? "bg-emerald-500" : "bg-blue-400"}`} />
                        {item.status}
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
                        onClick={() => goEdit(item)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-blue-200 hover:bg-blue-100 text-blue-700 transition-all active:scale-95 cursor-pointer"
                        title="Edit Record"
                      >
                        <Edit2 size={12} />
                        Edit
                      </button>
                      <button
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
                        onClick={() => handleDelete(item)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-rose-200 hover:bg-rose-100 text-rose-700 transition-all active:scale-95 cursor-pointer"
                        title="Delete Record"
                      >
                        <Trash2 size={12} />
                        Delete
                      </button>
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
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "border border-blue-200 hover:bg-blue-100"
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}
              <button
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
