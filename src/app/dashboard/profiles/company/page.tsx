"use client";
import { customConfirm } from "@/lib/customConfirm";
import { toast as hotToast } from "react-hot-toast";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

interface CompanyProfile {
  id: string;
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

export default function CompanyProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [profiles, setProfiles] = useState<CompanyProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/profiles/company");
      if (!res.ok) {
        throw new Error("Failed to load company profiles.");
      }
      const data = await res.json();
      setProfiles(data);
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred while loading profiles.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const toastType = searchParams.get("toast");
  useEffect(() => {
    if (toastType === "created") {
      triggerToast("New company profile created successfully.");
      router.replace("/dashboard/profiles/company");
    } else if (toastType === "updated") {
      triggerToast("Company profile updated successfully.");
      router.replace("/dashboard/profiles/company");
    }
  }, [toastType, router]);

  const handleCreateOpen = () => {
    router.push("/dashboard/profiles/company/create");
  };

  const handleEditOpen = (profile: CompanyProfile) => {
    router.push(`/dashboard/profiles/company/edit/${profile.id}`);
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === "Active" ? "Inactive" : "Active";
    try {
      const res = await fetch(`/api/profiles/company/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!res.ok) throw new Error("Failed to update status.");
      
      setProfiles((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: nextStatus } : p))
      );
      triggerToast(`Company status successfully set to ${nextStatus}.`);
    } catch (err: any) {
      hotToast.error(err.message || "Could not toggle status.");
    }
  };

  const handleVoidProfile = async (id: string) => {
    if (!await customConfirm("Are you sure you want to VOID this company profile? Voided profiles cannot be restored.")) {
      return;
    }

    try {
      const res = await fetch(`/api/profiles/company/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to void profile.");

      setProfiles((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: "Void" } : p))
      );
      triggerToast("Company profile voided successfully.");
    } catch (err: any) {
      hotToast.error(err.message || "Failed to void profile.");
    }
  };

  const activeProfiles = profiles.filter((p) => p.status !== "Void");
  const voidedProfiles = profiles.filter((p) => p.status === "Void");

  return (
    <div className="space-y-6 animate-fade-in relative">
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 rounded-xl bg-blue-900 px-4 py-3.5 text-xs font-bold text-white shadow-xl border border-blue-800 transition-all duration-300 transform translate-y-0">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
          {toastMessage}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 uppercase tracking-wider">
            <a href="/dashboard/profiles" className="hover:underline">Master Profiles</a>
            <span>/</span>
            <span>Company Profile</span>
          </div>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-blue-900">
            Company Profile Configuration
          </h2>
          <p className="mt-1 text-xs text-blue-500">
            Maintain company basic information (used in the printout, report and purchased-related modules).
          </p>
        </div>
        <button
          onClick={handleCreateOpen}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/10 hover:bg-indigo-500 transition-all cursor-pointer"
        >
          <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Create Company
        </button>
      </div>

      {loading ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-blue-200 bg-white shadow-sm">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <span className="mt-4 text-xs font-medium text-blue-500">Retrieving company profiles...</span>
        </div>
      ) : errorMessage && profiles.length === 0 ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-6 text-center text-rose-800 shadow-sm">
          <p className="text-sm font-semibold">{errorMessage}</p>
          <button
            onClick={loadData}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-500"
          >
            Retry Connection
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="overflow-hidden rounded-2xl border border-blue-200 bg-white shadow-sm">
            <div className="border-b border-blue-100 bg-blue-50/50 px-6 py-4.5">
              <h3 className="text-sm font-bold text-blue-900">Active Companies</h3>
              <p className="text-[11px] text-blue-500">Manage legal tenant identities, logos, and features</p>
            </div>
            
            {activeProfiles.length === 0 ? (
              <div className="p-8 text-center text-xs text-blue-500">
                No active companies configured. Click "Create Company" to add one.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-blue-200 text-left">
                  <thead className="bg-blue-50 text-xs font-semibold text-blue-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3.5">Company Name</th>
                      <th className="px-6 py-3.5">Phone / Email</th>
                      <th className="px-6 py-3.5">GST Reg No</th>
                      <th className="px-6 py-3.5 text-center">Status</th>
                      <th className="px-6 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-blue-100 bg-white text-xs text-blue-700">
                    {activeProfiles.map((profile) => (
                      <tr key={profile.id} className="hover:bg-blue-50/40">
                        <td className="px-6 py-4">
                          <span className="font-bold text-blue-900 block">{profile.companyName}</span>
                          <span className="text-blue-400 mt-0.5 block">{profile.rocNo || "No ROC"}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="block font-semibold">{profile.phoneNo}</span>
                          <span className="block text-blue-400 mt-0.5">{profile.email || "No Email"}</span>
                        </td>
                        <td className="px-6 py-4 font-mono font-semibold">
                          {profile.gstRegistrationNo}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleToggleStatus(profile.id, profile.status)}
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition hover:opacity-85 ${
                              profile.status === "Active"
                                ? "bg-emerald-50 text-emerald-600"
                                : "bg-amber-50 text-amber-600"
                            }`}
                            title="Click to toggle status"
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${profile.status === "Active" ? "bg-emerald-500" : "bg-amber-500"}`}></span>
                            {profile.status}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2.5">
                            <button
                              onClick={() => handleEditOpen(profile)}
                              className="rounded-lg p-1.5 text-blue-400 hover:bg-blue-100 hover:text-blue-700 cursor-pointer"
                              title="Edit config"
                            >
                              <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleVoidProfile(profile.id)}
                              className="rounded-lg p-1.5 text-rose-400 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                              title="Void record"
                            >
                              <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {voidedProfiles.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-blue-200 bg-white shadow-sm opacity-60">
              <div className="border-b border-blue-100 bg-blue-50/50 px-6 py-3.5 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-blue-700">Voided Companies</h3>
                </div>
                <span className="rounded-full bg-blue-200 px-2 py-0.5 text-[9px] font-bold text-blue-500">
                  {voidedProfiles.length} voided
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-blue-200 text-left">
                  <thead className="bg-blue-50 text-xs font-semibold text-blue-500">
                    <tr>
                      <th className="px-6 py-2">Company Name</th>
                      <th className="px-6 py-2">GST Reg No</th>
                      <th className="px-6 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-blue-100 bg-white text-xs text-blue-600">
                    {voidedProfiles.map((profile) => (
                      <tr key={profile.id}>
                        <td className="px-6 py-2.5 font-semibold">{profile.companyName}</td>
                        <td className="px-6 py-2.5 font-mono text-[10px]">{profile.gstRegistrationNo}</td>
                        <td className="px-6 py-2.5">
                          <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[9px] font-bold text-rose-600 uppercase">
                            {profile.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
