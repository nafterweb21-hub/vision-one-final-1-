"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import MainProcessForm from "../../components/MainProcessForm";

interface MainProcess {
  id: string;
  process: string;
  remark: string | null;
  status: string;
}

export default function EditMainProcessPage() {
  const params = useParams();
  const id = params.id as string;

  const [profile, setProfile] = useState<MainProcess | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    async function loadProfile() {
      try {
        const res = await fetch("/api/profiles/main-process");
        if (!res.ok) throw new Error("Failed to load configurations.");
        const data: MainProcess[] = await res.json();
        
        const found = data.find((p) => p.id === id);
        if (found) {
          setProfile(found);
        } else {
          setError("Main process not found.");
        }
      } catch (err: any) {
        setError(err.message || "An error occurred.");
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-64 flex-col items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
        <span className="mt-4 text-xs font-medium text-blue-500">Loading profile data...</span>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-800 shadow-sm">
        <p className="text-sm font-semibold">{error || "Profile not found."}</p>
        <a href="/dashboard/profiles/main-process" className="mt-4 inline-block font-bold text-indigo-600 hover:underline">
          &larr; Back to Main Process Profile
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in relative min-h-screen">
      
      {/* Header section */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 uppercase tracking-wider">
          <a href="/dashboard/profiles" className="hover:underline">Master Profiles</a>
          <span>/</span>
          <a href="/dashboard/profiles/main-process" className="hover:underline">Main Process Profile</a>
          <span>/</span>
          <span>Edit Configuration</span>
        </div>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-blue-900 ">
          Edit Main Process
        </h2>
        <p className="mt-1 text-xs text-blue-500 ">
          Modify remarks for this main process. The process name itself is immutable.
        </p>
      </div>

      <MainProcessForm editingProfile={profile} />

    </div>
  );
}
