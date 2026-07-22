"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface JointProfile {
  id: string;
  joint: string;
  remark: string | null;
  status: string;
}

interface JointProfileFormProps {
  editingProfile?: JointProfile | null;
}

export default function JointProfileForm({ editingProfile }: JointProfileFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form Fields State
  const [formjoint, setFormjoint] = useState("");
  const [formRemark, setFormRemark] = useState("");
  const [formStatus, setFormStatus] = useState("Active");

  // Initialize fields if editing
  useEffect(() => {
    if (editingProfile) {
      setFormjoint(editingProfile.joint);
      setFormRemark(editingProfile.remark || "");
      setFormStatus(editingProfile.status || "Active");
    }
  }, [editingProfile]);

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSaving(true);

    if (!formjoint.trim()) {
      setErrorMessage("Validation Error: Joint Name is a mandatory field.");
      setSaving(false);
      return;
    }

    // Prepare body
    const body = {
      joint: formjoint.trim(),
      remark: formRemark.trim() || null,
      status: formStatus,
    };

    try {
      const url = editingProfile 
        ? `/api/profiles/joint-profiles/${editingProfile.id}` 
        : "/api/profiles/joint-profiles";
      
      const method = editingProfile ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to save Joint Profile.");
      }

      // Navigate back with success toast query parameter
      const msg = editingProfile ? "updated" : "created";
      router.push(`/dashboard/profiles/joint-profiles?toast=${msg}`);
      router.refresh();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to save joint configuration.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full bg-white border border-blue-200 rounded-2xl shadow-sm overflow-hidden animate-fade-in">
      <form onSubmit={handleSubmit} className="flex flex-col py-8 px-8 space-y-6">

        {/* Error Banner */}
        {errorMessage && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800 ">
            {errorMessage}
          </div>
        )}

        {/* Fields */}
        <div className="space-y-6">
          
          {/* Joint (Text) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-blue-700 uppercase tracking-wide">
              Joint Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formjoint}
              onChange={(e) => setFormjoint(e.target.value)}
              placeholder="e.g. Stainless Steel, Mild Steel"
              disabled={saving || !!editingProfile}
              className={`w-full rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2.5 text-sm font-semibold outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-blue-900 ${
                editingProfile ? "opacity-60 cursor-not-allowed bg-blue-100 " : ""
              }`}
            />
            <p className="text-[10px] text-blue-400">
              {editingProfile 
                ? "Specification Rule: Once saved, Joint name cannot be changed." 
                : "Enter a unique joint name."}
            </p>
          </div>

          {/* Remark (Multi-text) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-blue-700 uppercase tracking-wide">
              Remarks
            </label>
            <textarea
              value={formRemark}
              onChange={(e) => setFormRemark(e.target.value)}
              placeholder="Provide any additional notes or details about this joint..."
              disabled={saving}
              rows={4}
              className="w-full rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-blue-900 resize-none"
            />
            <p className="text-[10px] text-blue-400">
              Optional description for the Joint Profile.
            </p>
          </div>



        </div>

        {/* Footer */}
        <div className="border-t border-blue-100 pt-6 flex items-center justify-between ">
          <button
            type="button"
            onClick={() => router.push("/dashboard/profiles/joint-profiles")}
            disabled={saving}
            className="rounded-xl border border-blue-200 px-5 py-3 text-xs font-semibold text-blue-700 hover:bg-blue-50 :bg-blue-850 disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-xs font-bold text-white shadow-md hover:bg-indigo-500 transition disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                Saving...
              </>
            ) : (
              "Save joint"
            )}
          </button>
        </div>

      </form>
    </div>
  );
}
