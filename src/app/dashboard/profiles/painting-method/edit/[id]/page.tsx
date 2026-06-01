"use client";

import React, { useState, useEffect } from "react";
import PaintingMethodProfileForm from "../../components/PaintingMethodProfileForm";

interface PaintingMethodProfile {
  id: string;
  method: string;
  remark: string | null;
  status: string;
}

export default function EditPaintingMethodProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);

  const [category, setType] = useState<PaintingMethodProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch("/api/profiles/painting-method");
        if (!res.ok) {
          throw new Error("Failed to load Painting Method configuration.");
        }

        const types: PaintingMethodProfile[] = await res.json();

        // Find specific category matching the dynamic ID
        const matched = types.find((c) => c.id === id);
        if (!matched) {
          throw new Error(`Painting Method with ID "${id}" could not be found.`);
        }

        setType(matched);
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred while loading Painting Method.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  return (
    <div className="space-y-6 animate-fade-in relative min-h-screen">
      
      {/* Header section */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 uppercase tracking-wider">
          <a href="/dashboard/profiles" className="hover:underline">Master Profiles</a>
          <span>/</span>
          <a href="/dashboard/profiles/painting-method" className="hover:underline">Painting Method Profile</a>
          <span>/</span>
          <span>Modify Type</span>
        </div>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-blue-900 ">
          Modify Painting Method
        </h2>
        <p className="mt-1 text-xs text-blue-500 ">
          Modify description remarks or status parameters for this category. Type name is immutable.
        </p>
      </div>

      {loading ? (
        <div className="w-full flex h-64 flex-col items-center justify-center rounded-2xl border border-blue-200 bg-white shadow-sm">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <span className="mt-4 text-xs font-medium text-blue-500">Retrieving Painting Method details...</span>
        </div>
      ) : error ? (
        <div className="w-full rounded-2xl border border-rose-200 bg-rose-50/50 p-6 text-center text-rose-800 shadow-sm">
          <p className="text-sm font-semibold">{error}</p>
          <a
            href="/dashboard/profiles/painting-method"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500"
          >
            Return to Categories List
          </a>
        </div>
      ) : (
        <PaintingMethodProfileForm editingProfile={category} />
      )}

    </div>
  );
}
