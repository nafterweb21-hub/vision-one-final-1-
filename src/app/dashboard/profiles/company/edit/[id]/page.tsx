"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import CompanyProfileForm from "../../components/CompanyProfileForm";

export default function EditCompanyProfilePage() {
  const params = useParams();
  const id = params?.id as string;

  const [initialData, setInitialData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/profiles/company/${id}`);
        if (!res.ok) throw new Error("Failed to load company profile");
        const data = await res.json();
        setInitialData(data);
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  return (
    <div className="space-y-6 animate-fade-in relative min-h-screen">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 uppercase tracking-wider">
          <a href="/dashboard/profiles" className="hover:underline">Master Profiles</a>
          <span>/</span>
          <a href="/dashboard/profiles/company" className="hover:underline">Company Profile</a>
          <span>/</span>
          <span>Edit Company</span>
        </div>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-blue-900">
          Edit Company Configuration
        </h2>
        <p className="mt-1 text-xs text-blue-500">
          Update basic information for this legal entity.
        </p>
      </div>

      {loading ? (
        <div className="w-full flex h-64 flex-col items-center justify-center rounded-2xl border border-blue-200 bg-white shadow-sm">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <span className="mt-4 text-xs font-medium text-blue-500">Retrieving company data...</span>
        </div>
      ) : error ? (
        <div className="w-full rounded-2xl border border-rose-200 bg-rose-50/50 p-6 text-center text-rose-800 shadow-sm">
          <p className="text-sm font-semibold">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-500"
          >
            Retry Connection
          </button>
        </div>
      ) : (
        <CompanyProfileForm initialData={initialData} />
      )}
    </div>
  );
}
