"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

interface CompanyProfile {
  id?: string;
  companyName: string;
  address: string;
  phoneNo: string;
  faxNo: string;
  email: string | null;
  website: string | null;
  rocNo: string | null;
  gstRegistrationNo: string;
  uploadUrl: string;
  logoName: string;
  footerName: string;
  allowPoForWo: boolean;
  as9100RequirementNote: boolean;
  status: string;
}

interface CompanyProfileFormProps {
  initialData?: CompanyProfile | null;
}

export default function CompanyProfileForm({ initialData }: CompanyProfileFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);

  const [formData, setFormData] = useState<CompanyProfile>(
    initialData || {
      companyName: "",
      address: "",
      phoneNo: "",
      faxNo: "",
      email: "",
      website: "",
      rocNo: "",
      gstRegistrationNo: "",
      uploadUrl: "",
      logoName: "",
      footerName: "",
      allowPoForWo: false,
      as9100RequirementNote: false,
      status: "Active",
    }
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLogoUploading(true);
    setError(null);
    try {
      const data = new FormData();
      data.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: data });
      
      let json;
      try {
        json = await res.json();
      } catch (parseError) {
        throw new Error("Server returned an invalid response.");
      }

      if (!res.ok) throw new Error(json?.error || "Upload failed");
      
      setFormData(prev => ({
        ...prev,
        uploadUrl: json.url,
        logoName: prev.logoName || file.name,
      }));
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(err.message || "Logo upload failed.");
    } finally {
      setLogoUploading(false);
      // Reset input so the same file can be selected again
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Basic validation
    if (!formData.companyName.trim()) {
      setError("Company Name is required.");
      setLoading(false);
      return;
    }
    if (!formData.address.trim()) {
      setError("Address is required.");
      setLoading(false);
      return;
    }
    if (!formData.phoneNo.trim() || !formData.faxNo.trim() || !formData.gstRegistrationNo.trim() || !formData.logoName.trim() || !formData.footerName.trim() || !formData.uploadUrl.trim()) {
      setError("Please fill all mandatory fields.");
      setLoading(false);
      return;
    }

    const payload = {
      ...formData,
    };

    try {
      const isEdit = !!initialData?.id;
      const url = isEdit ? `/api/profiles/company/${initialData.id}` : "/api/profiles/company";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save profile.");
      }

      router.push(`/dashboard/profiles/company?toast=${isEdit ? 'updated' : 'created'}`);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4 text-sm font-semibold text-rose-800">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Left Column */}
        <div className="space-y-5 rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-wider text-blue-900 border-b border-blue-100 pb-3">
            General Information
          </h3>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-blue-700">Company Name <span className="text-rose-500">*</span></label>
            <input
              type="text"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              disabled={!!initialData?.id}
              className={`w-full rounded-lg border px-3 py-2 text-sm text-blue-900 placeholder:text-blue-300 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${!!initialData?.id ? 'bg-blue-50/50 border-blue-200 text-blue-500' : 'border-blue-200 bg-white'}`}
              placeholder="e.g. Vision One Pte Ltd"
              required
            />
            {!!initialData?.id && <p className="text-[10px] text-blue-400">Company Name cannot be changed after creation.</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-blue-700">Address <span className="text-rose-500">*</span></label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows={3}
              className="w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm text-blue-900 placeholder:text-blue-300 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="Full registered address"
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-blue-700">Phone No <span className="text-rose-500">*</span></label>
              <input
                type="text"
                name="phoneNo"
                value={formData.phoneNo}
                onChange={handleChange}
                className="w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm text-blue-900 placeholder:text-blue-300 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="+65 ..."
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-blue-700">Fax No <span className="text-rose-500">*</span></label>
              <input
                type="text"
                name="faxNo"
                value={formData.faxNo}
                onChange={handleChange}
                className="w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm text-blue-900 placeholder:text-blue-300 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="+65 ..."
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-blue-700">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email || ""}
              onChange={handleChange}
              className="w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm text-blue-900 placeholder:text-blue-300 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="info@company.com"
            />
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-5 rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-wider text-blue-900 border-b border-blue-100 pb-3">
            Registration & Assets
          </h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-blue-700">ROC No</label>
              <input
                type="text"
                name="rocNo"
                value={formData.rocNo || ""}
                onChange={handleChange}
                className="w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm text-blue-900 placeholder:text-blue-300 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Registration No"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-blue-700">GST Registration No <span className="text-rose-500">*</span></label>
              <input
                type="text"
                name="gstRegistrationNo"
                value={formData.gstRegistrationNo}
                onChange={handleChange}
                className="w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm text-blue-900 placeholder:text-blue-300 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="GST No"
                required
              />
            </div>
          </div>

          {/* Company Logo Upload */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-blue-700">
              Company Logo <span className="text-rose-500">*</span>
            </label>

            {/* Preview */}
            {formData.uploadUrl && (
              <div className="flex items-center justify-center rounded-lg border border-blue-200 bg-blue-50 p-3 h-24">
                <img
                  src={formData.uploadUrl.startsWith("/uploads") ? `/api${formData.uploadUrl}?t=${Date.now()}` : `${formData.uploadUrl}?t=${Date.now()}`}
                  alt="Company Logo Preview"
                  className="max-h-20 max-w-full object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "https://via.placeholder.com/150?text=No+Image";
                  }}
                />
              </div>
            )}

            <label className={`flex items-center gap-3 w-full cursor-pointer rounded-lg border-2 border-dashed px-4 py-3 transition-colors ${logoUploading ? 'border-indigo-300 bg-indigo-50' : 'border-blue-200 bg-white hover:border-indigo-400 hover:bg-indigo-50/30'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span className="text-sm text-blue-600 font-medium">
                {logoUploading ? "Uploading..." : formData.uploadUrl ? "Change Logo" : "Upload Logo Image"}
              </span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/gif"
                className="hidden"
                onChange={handleLogoUpload}
                disabled={logoUploading}
              />
            </label>
            <p className="text-[10px] text-blue-500">Upload PNG, JPG or GIF. This logo will appear on printed documents.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-blue-700">Logo Name <span className="text-rose-500">*</span></label>
              <input
                type="text"
                name="logoName"
                value={formData.logoName}
                onChange={handleChange}
                className="w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm text-blue-900 placeholder:text-blue-300 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Logo Filename"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-blue-700">Footer Name <span className="text-rose-500">*</span></label>
              <input
                type="text"
                name="footerName"
                value={formData.footerName}
                onChange={handleChange}
                className="w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm text-blue-900 placeholder:text-blue-300 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Footer Text"
                required
              />
            </div>
          </div>

          <div className="mt-6 space-y-4 border-t border-blue-100 pt-4">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  name="allowPoForWo"
                  checked={formData.allowPoForWo}
                  onChange={handleChange}
                  className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border-2 border-blue-300 checked:border-indigo-600 checked:bg-indigo-600 transition-all"
                />
                <svg className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <span className="text-sm font-bold text-blue-900 group-hover:text-indigo-700 transition-colors">Allow to create PO for WO</span>
                <p className="text-[10px] text-blue-500 leading-tight mt-0.5">Determines if this company can issue Purchase Orders for Work Orders.</p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  name="as9100RequirementNote"
                  checked={formData.as9100RequirementNote}
                  onChange={handleChange}
                  className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border-2 border-blue-300 checked:border-indigo-600 checked:bg-indigo-600 transition-all"
                />
                <svg className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <span className="text-sm font-bold text-blue-900 group-hover:text-indigo-700 transition-colors">AS9100 Requirement Note Required</span>
                <p className="text-[10px] text-blue-500 leading-tight mt-0.5">Toggles AS9100 supplier notes blocks on PO printouts.</p>
              </div>
            </label>
          </div>

        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={() => router.push("/dashboard/profiles/company")}
          className="rounded-xl px-5 py-2.5 text-sm font-bold text-blue-600 hover:bg-blue-50 hover:text-blue-800 transition-colors cursor-pointer"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || logoUploading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-500 hover:shadow-lg disabled:opacity-50 transition-all cursor-pointer"
        >
          {loading && <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>}
          {initialData?.id ? "Update Company" : "Save Company"}
        </button>
      </div>
    </form>
  );
}
