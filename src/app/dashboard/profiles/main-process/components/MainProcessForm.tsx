"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

interface MainProcess {
  id: string;
  process: string;
  remark: string | null;
  status: string;
}

interface MainProcessFormProps {
  editingProfile: MainProcess | null;
}

export default function MainProcessForm({ editingProfile }: MainProcessFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    process: editingProfile?.process || "",
    remark: editingProfile?.remark || "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const url = editingProfile
        ? `/api/profiles/main-process/${editingProfile.id}`
        : `/api/profiles/main-process`;

      const method = editingProfile ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save main process");
      }

      router.push(`/dashboard/profiles/main-process?toast=${editingProfile ? "updated" : "created"}`);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-blue-200 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-blue-100 bg-blue-50/50 px-6 py-4.5">
        <h3 className="text-sm font-bold text-blue-900">
          {editingProfile ? "Edit Configuration" : "New Configuration Details"}
        </h3>
        <p className="text-[11px] text-blue-500">
          {editingProfile
            ? "Update the remarks for this main process."
            : "Enter details for the new main process."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4 text-xs font-bold text-rose-800 shadow-sm">
            {error}
          </div>
        )}

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Main Process Name */}
          <div className="space-y-1.5 lg:col-span-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
              Main Process Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="process"
              value={formData.process}
              onChange={handleChange}
              disabled={!!editingProfile} // Immutable once saved
              required
              className="w-full rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-900 placeholder-blue-300 shadow-sm transition hover:border-indigo-300 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-50 disabled:text-slate-500 disabled:opacity-70 disabled:cursor-not-allowed"
              placeholder="e.g. Sizing of Materials"
            />
            {editingProfile && (
              <p className="text-[10px] text-amber-600 font-semibold mt-1 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                Process Name is immutable once created.
              </p>
            )}
          </div>
        </div>

        {/* Remark */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
            Remark
          </label>
          <textarea
            name="remark"
            value={formData.remark}
            onChange={handleChange}
            rows={3}
            className="w-full rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm font-medium text-blue-900 placeholder-blue-300 shadow-sm transition hover:border-indigo-300 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            placeholder="Optional internal remarks about this main process..."
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-blue-100">
          <button
            type="button"
            onClick={() => router.push("/dashboard/profiles/main-process")}
            className="rounded-xl border border-blue-200 bg-white px-5 py-2.5 text-xs font-bold text-blue-600 shadow-sm transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/20 transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-70"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Saving...
              </span>
            ) : editingProfile ? (
              "Save Changes"
            ) : (
              "Create Main Process"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
