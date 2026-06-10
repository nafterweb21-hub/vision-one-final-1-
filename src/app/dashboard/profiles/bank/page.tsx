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
  Landmark,
  ArrowLeft,
  Edit2,
} from "lucide-react";
import Link from "next/link";

interface BankItem {
  id: string;
  bankName: string;
  accountName: string;
  accountNo: string;
  swiftCode: string | null;
  branchCode: string | null;
  remark: string | null;
  status: "Active" | "Inactive";
  createdAt: string;
  updatedAt: string;
}

type SortKey = "bankName_asc" | "bankName_desc" | "createdAt_desc" | "createdAt_asc";
type StatusFilter = "All" | "Active" | "Inactive";
type ViewMode = "list" | "add" | "edit" | "view";

const PAGE_SIZE = 10;

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "createdAt_desc", label: "Newest First" },
  { value: "createdAt_asc",  label: "Oldest First" },
  { value: "bankName_asc",   label: "Name A → Z" },
  { value: "bankName_desc",  label: "Name Z → A" },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function BankProfilePage() {
  const [items, setItems]       = useState<BankItem[]>([]);
  const [loading, setLoading]   = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const [viewMode, setViewMode]     = useState<ViewMode>("list");
  const [activeItem, setActiveItem] = useState<BankItem | null>(null);

  const [search, setSearch]             = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [sortKey, setSortKey]           = useState<SortKey>("createdAt_desc");
  const [page, setPage]                 = useState(1);

  const [formBankName, setFormBankName] = useState("");
  const [formAccountName, setFormAccountName] = useState("");
  const [formAccountNo, setFormAccountNo] = useState("");
  const [formSwiftCode, setFormSwiftCode] = useState("");
  const [formBranchCode, setFormBranchCode] = useState("");
  const [formRemark, setFormRemark] = useState("");
  const [formStatus, setFormStatus]   = useState<"Active" | "Inactive">("Active");
  const [submitting, setSubmitting]   = useState(false);
  const [formError, setFormError]     = useState("");

  const fetchItems = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch(`/api/profiles/bank?search=${encodeURIComponent(search)}`);
      if (!res.ok) throw new Error("Failed to load Bank records");
      const data: BankItem[] = await res.json();
      setItems(data);
      setPage(1);
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : "Failed to load Bank records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [search]);

  const filtered = useMemo(() => {
    let list = [...items];
    if (statusFilter !== "All") list = list.filter((i) => i.status === statusFilter);
    list.sort((a, b) => {
      switch (sortKey) {
        case "bankName_asc":    return a.bankName.localeCompare(b.bankName);
        case "bankName_desc":   return b.bankName.localeCompare(a.bankName);
        case "createdAt_asc":  return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "createdAt_desc": return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
    return list;
  }, [items, statusFilter, sortKey]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const goList = () => { setViewMode("list"); setActiveItem(null); setFormError(""); };

  const goAdd = () => {
    setActiveItem(null);
    setFormBankName("");
    setFormAccountName("");
    setFormAccountNo("");
    setFormSwiftCode("");
    setFormBranchCode("");
    setFormRemark("");
    setFormStatus("Active");
    setFormError("");
    setViewMode("add");
  };

  const goEdit = (item: BankItem) => {
    setActiveItem(item);
    setFormBankName(item.bankName);
    setFormAccountName(item.accountName);
    setFormAccountNo(item.accountNo);
    setFormSwiftCode(item.swiftCode ?? "");
    setFormBranchCode(item.branchCode ?? "");
    setFormRemark(item.remark ?? "");
    setFormStatus(item.status);
    setFormError("");
    setViewMode("edit");
  };

  const goView = (item: BankItem) => {
    setActiveItem(item);
    setViewMode("view");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");

    const payload: any = {
      bankName: formBankName.trim(),
      accountName: formAccountName.trim(),
      accountNo: formAccountNo.trim(),
      swiftCode: formSwiftCode.trim() || null,
      branchCode: formBranchCode.trim() || null,
      remark: formRemark.trim() || null,
      status:  formStatus,
    };
    if (viewMode === "edit" && activeItem) payload.id = activeItem.id;

    try {
      const method = viewMode === "edit" ? "PUT" : "POST";
      const res = await fetch("/api/profiles/bank", {
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

  const handleToggleStatus = async (item: BankItem) => {
    try {
      const res = await fetch("/api/profiles/bank", {
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

  const isForm = viewMode === "add" || viewMode === "edit";
  const isView = viewMode === "view";

  const pageHeader = (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-6 border-b border-blue-200">
      <div>
        <div className="flex items-center gap-2 text-xs text-blue-400 font-semibold tracking-wider uppercase mb-1">
          <Link href="/dashboard" className="hover:text-blue-600">Dashboard</Link>
          <span>/</span>
          <Link href="/dashboard/profiles" className="hover:text-blue-600">Profiles</Link>
          <span>/</span>
          {isForm || isView ? (
            <>
              <button onClick={goList} className="hover:text-blue-600">Bank Profile</button>
              <span>/</span>
              <span className="text-blue-500">
                {viewMode === "add" ? "Add Bank" : viewMode === "edit" ? "Edit Bank" : "View Bank"}
              </span>
            </>
          ) : (
            <span className="text-blue-500">Bank Profile</span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-violet-500/10 text-violet-500">
            <Landmark size={20} />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-blue-900">
              {viewMode === "add" ? "Add Bank" : viewMode === "edit" ? "Edit Bank" : "Bank Profile"}
            </h2>
            <p className="text-sm text-blue-500 mt-0.5">
              {isForm
                ? "Fill in the details below and click Save."
                : "Manage Bank Accounts to be used for Invoices."}
            </p>
          </div>
        </div>
      </div>

      {viewMode === "list" && (
        <button
          onClick={goAdd}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 rounded-lg shadow-md shadow-violet-500/20 active:scale-95 transition-all duration-200 shrink-0"
        >
          <Plus size={16} /> Add Bank
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

  if (isForm) {
    return (
      <div className="p-6 lg:p-8 space-y-6">
        {pageHeader}

        <div className="bg-white border border-blue-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-blue-100 bg-blue-50/60 flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-violet-500/10 text-violet-500">
              <Landmark size={15} />
            </div>
            <span className="font-semibold text-sm text-blue-700">
              Bank Information
            </span>
          </div>

          <form id="bank-form" onSubmit={handleSubmit} className="p-6 space-y-6">
            {formError && (
              <div className="p-3 bg-rose-50 text-rose-700 text-sm font-medium rounded-lg flex items-center gap-2 border border-rose-200">
                <AlertCircle size={15} />
                <span>{formError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-blue-500 flex items-center gap-1">
                  Bank Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formBankName}
                  onChange={(e) => setFormBankName(e.target.value)}
                  placeholder="e.g. DBS Bank Ltd"
                  className="w-full px-3 py-2.5 text-sm bg-blue-50 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-blue-500 flex items-center gap-1">
                  Account Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formAccountName}
                  onChange={(e) => setFormAccountName(e.target.value)}
                  placeholder="e.g. Vision One Pte Ltd"
                  className="w-full px-3 py-2.5 text-sm bg-blue-50 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-blue-500 flex items-center gap-1">
                  Account Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formAccountNo}
                  onChange={(e) => setFormAccountNo(e.target.value)}
                  placeholder="e.g. 123-456-789"
                  className="w-full px-3 py-2.5 text-sm bg-blue-50 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-blue-500 flex items-center gap-1">
                  SWIFT Code
                </label>
                <input
                  type="text"
                  value={formSwiftCode}
                  onChange={(e) => setFormSwiftCode(e.target.value)}
                  placeholder="e.g. DBSSXXXX"
                  className="w-full px-3 py-2.5 text-sm bg-blue-50 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-blue-500 flex items-center gap-1">
                  Branch Code
                </label>
                <input
                  type="text"
                  value={formBranchCode}
                  onChange={(e) => setFormBranchCode(e.target.value)}
                  placeholder="e.g. 001"
                  className="w-full px-3 py-2.5 text-sm bg-blue-50 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-blue-500">
                  Status
                </label>
                <SearchableSelect
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as "Active" | "Inactive")}
                  className="w-full px-3 py-2.5 text-sm bg-blue-50 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-blue-700 transition-colors"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Deactive</option>
                </SearchableSelect>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-blue-500">
                Remarks
                <span className="ml-1.5 text-[10px] font-normal normal-case text-blue-400">(optional)</span>
              </label>
              <textarea
                value={formRemark}
                onChange={(e) => setFormRemark(e.target.value)}
                placeholder="Optional description or notes about this bank profile..."
                rows={3}
                className="w-full px-3 py-2.5 text-sm bg-blue-50 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 resize-none transition-colors"
              />
            </div>

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
                form="bank-form"
                disabled={submitting}
                className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 rounded-lg shadow-md shadow-violet-500/20 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                {submitting ? (
                  <><Loader2 size={14} className="animate-spin" /> Saving...</>
                ) : (
                  <><Check size={14} /> {viewMode === "edit" ? "Update Bank" : "Save Bank"}</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (isView && activeItem) {
    return (
      <div className="p-6 lg:p-8 space-y-6">
        {pageHeader}

        <div className="bg-white border border-blue-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-blue-100 bg-blue-50/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-violet-500/10 text-violet-500 flex items-center justify-center">
                <Landmark size={17} />
              </div>
              <div>
                <p className="font-bold text-base text-blue-900">{activeItem.bankName}</p>
                <p className="text-xs text-blue-400">Bank Record — Read Only</p>
              </div>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                activeItem.status === "Active"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-blue-100 text-blue-600"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${activeItem.status === "Active" ? "bg-emerald-500" : "bg-blue-400"}`} />
              {activeItem.status === "Active" ? "Active" : "Deactive"}
            </span>
          </div>

          <div className="p-6">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                { label: "Bank Name",      value: activeItem.bankName },
                { label: "Account Name",   value: activeItem.accountName },
                { label: "Account Number", value: activeItem.accountNo },
                { label: "SWIFT Code",     value: activeItem.swiftCode || "—" },
                { label: "Branch Code",    value: activeItem.branchCode || "—" },
                { label: "Status",         value: activeItem.status === "Active" ? "Active" : "Deactive" },
                { label: "Created Date",   value: formatDate(activeItem.createdAt) },
                { label: "Updated Date",   value: formatDate(activeItem.updatedAt) },
              ].map(({ label, value }) => (
                <div key={label} className="space-y-1">
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-blue-400">{label}</dt>
                  <dd className="text-sm font-semibold text-blue-800">{value}</dd>
                </div>
              ))}

              <div className="space-y-1 sm:col-span-2">
                <dt className="text-[11px] font-bold uppercase tracking-wider text-blue-400">Remarks</dt>
                <dd className="text-sm font-medium text-blue-600 leading-relaxed">
                  {activeItem.remark || <span className="text-blue-300 italic">No remarks provided</span>}
                </dd>
              </div>
            </dl>
          </div>

          <div className="px-6 pb-6 flex items-center gap-3">
            <button
              onClick={() => goEdit(activeItem)}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 rounded-lg shadow-md shadow-violet-500/20 active:scale-95 transition-all duration-200"
            >
              <Edit2 size={14} /> Edit Bank
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

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {pageHeader}

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-white border border-blue-200 p-4 rounded-xl shadow-sm">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-blue-400" />
          <input
            type="text"
            placeholder="Search bank name, account no..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-blue-50 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-blue-500 uppercase tracking-wider shrink-0">Status</label>
          <SearchableSelect
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as StatusFilter); setPage(1); }}
            className="text-sm bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-blue-700"
          >
            <option value="All">All</option>
            <option value="Active">Active</option>
            <option value="Inactive">Deactive</option>
          </SearchableSelect>
        </div>

        <div className="flex items-center gap-2">
          <ArrowUpDown size={14} className="text-blue-400 shrink-0" />
          <SearchableSelect
            value={sortKey}
            onChange={(e) => { setSortKey(e.target.value as SortKey); setPage(1); }}
            className="text-sm bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-blue-700"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </SearchableSelect>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
          <p className="text-sm text-blue-500">Loading Bank records...</p>
        </div>
      ) : errorMsg ? (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 flex items-center gap-3 text-rose-700">
          <AlertCircle size={18} />
          <p className="text-sm font-medium">{errorMsg}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-blue-200 rounded-xl p-12 text-center shadow-sm">
          <div className="mx-auto w-12 h-12 rounded-full bg-violet-500/10 flex items-center justify-center mb-4">
            <Landmark size={22} className="text-violet-500" />
          </div>
          <p className="text-blue-600 font-semibold">
            {search || statusFilter !== "All" ? "No Bank records match your filters." : "No Bank records yet."}
          </p>
          <p className="text-xs text-blue-400 mt-1">
            {search || statusFilter !== "All"
              ? "Try adjusting your search or filter."
              : 'Click "Add Bank" to create your first record.'}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-blue-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm text-blue-600">
              <thead className="bg-blue-50 text-xs font-bold uppercase tracking-wider text-blue-500 border-b border-blue-200">
                <tr>
                  <th className="px-5 py-4">Bank & Account</th>
                  <th className="px-5 py-4">SWIFT / Branch</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-100">
                {pageItems.map((item) => (
                  <tr key={item.id} className="hover:bg-blue-50/50 transition-colors group">
                    <td className="px-5 py-4">
                      <button
                        onClick={() => goEdit(item)}
                        className="inline-flex items-start gap-2.5 text-left group/name"
                        title="Click to edit"
                      >
                        <span className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-600 flex items-center justify-center shrink-0 group-hover/name:bg-violet-600 group-hover/name:text-white transition-all duration-200">
                          <Landmark size={14} />
                        </span>
                        <div>
                          <span className="block font-semibold text-blue-900 group-hover/name:text-violet-600 transition-colors">
                            {item.bankName}
                          </span>
                          <span className="block text-xs text-blue-400 mt-0.5">
                            {item.accountName} • {item.accountNo}
                          </span>
                        </div>
                      </button>
                    </td>

                    <td className="px-5 py-4 text-blue-500 text-sm">
                      {item.swiftCode || item.branchCode ? (
                        <div>
                          {item.swiftCode && <span className="block">SWIFT: {item.swiftCode}</span>}
                          {item.branchCode && <span className="block">Branch: {item.branchCode}</span>}
                        </div>
                      ) : (
                        <span className="text-blue-300 text-sm italic">—</span>
                      )}
                    </td>

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

                    <td className="px-5 py-4 text-right flex items-center justify-end gap-2">
                      <button
                        onClick={() => goView(item)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-blue-200 hover:bg-blue-100 text-blue-700 transition-all active:scale-95 cursor-pointer"
                        title="View Details"
                      >
                        View
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

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
                          ? "bg-violet-600 text-white shadow-sm"
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
