"use client";

import React from "react";
import WeldingTypeForm from "../components/WeldingTypeForm";

export default function CreateWeldingTypePage() {
  return (
    <div className="space-y-6 animate-fade-in relative min-h-screen">
      
      {/* Header section */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 uppercase tracking-wider">
          <a href="/dashboard/profiles" className="hover:underline">Master Profiles</a>
          <span>/</span>
          <a href="/dashboard/profiles/welding-types" className="hover:underline">Welding Type Profile</a>
          <span>/</span>
          <span>Create New Type</span>
        </div>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-blue-900 ">
          Create Welding Type
        </h2>
        <p className="mt-1 text-xs text-blue-500 ">
          Configure a new Welding Type to be used across material profile catalogs.
        </p>
      </div>

      <WeldingTypeForm editingProfile={null} />

    </div>
  );
}
