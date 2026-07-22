"use client";

import React from "react";
import CompanyProfileForm from "../components/CompanyProfileForm";

export default function CreateCompanyProfilePage() {
  return (
    <div className="space-y-6 animate-fade-in relative min-h-screen">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 uppercase tracking-wider">
          <a href="/dashboard/profiles" className="hover:underline">Master Profiles</a>
          <span>/</span>
          <a href="/dashboard/profiles/company" className="hover:underline">Company Profile</a>
          <span>/</span>
          <span>Create New Company</span>
        </div>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-blue-900">
          Create Company Configuration
        </h2>
        <p className="mt-1 text-xs text-blue-500">
          Maintain basic information for a new legal entity.
        </p>
      </div>

      <CompanyProfileForm />
    </div>
  );
}
