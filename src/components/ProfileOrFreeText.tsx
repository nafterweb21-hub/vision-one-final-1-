"use client";
import React, { useState } from "react";
import { SearchableSelect } from "@/components/SearchableSelect";

export interface ProfileOrFreeTextProps {
  label: string;
  required?: boolean;
  options: { id: string; label: string }[];
  fields: { name: string; label: string; required?: boolean }[];
  value: {
    type: "profile" | "freetext";
    profileId?: string;
    freeTextData?: Record<string, string>;
  };
  onChange: (value: any) => void;
}

export function ProfileOrFreeText({
  label,
  required,
  options,
  fields,
  value,
  onChange,
}: ProfileOrFreeTextProps) {
  const isFreeText = value?.type === "freetext";

  const handleTypeChange = (type: "profile" | "freetext") => {
    if (type === "profile") {
      onChange({ type: "profile", profileId: "" });
    } else {
      onChange({ type: "freetext", freeTextData: {} });
    }
  };

  const handleProfileChange = (profileId: string) => {
    onChange({ type: "profile", profileId });
  };

  const handleFreeTextChange = (fieldName: string, fieldValue: string) => {
    onChange({
      type: "freetext",
      freeTextData: {
        ...(value?.freeTextData || {}),
        [fieldName]: fieldValue,
      },
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-blue-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="flex items-center gap-4 text-sm">
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="radio"
              checked={!isFreeText}
              onChange={() => handleTypeChange("profile")}
              className="text-indigo-600 focus:ring-indigo-500"
            />
            Select Existing
          </label>
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="radio"
              checked={isFreeText}
              onChange={() => handleTypeChange("freetext")}
              className="text-indigo-600 focus:ring-indigo-500"
            />
            Free Text
          </label>
        </div>
      </div>

      {!isFreeText ? (
        <SearchableSelect
          value={value?.profileId || ""}
          onChange={(e) => handleProfileChange(e.target.value)}
          className="w-full px-3 py-2 text-sm bg-blue-50 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
        >
          <option value="">Select {label}</option>
          {options.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </SearchableSelect>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          {fields.map((f) => (
            <div key={f.name}>
              <label className="block text-xs font-medium text-blue-700 mb-1">
                {f.label} {f.required && <span className="text-red-500">*</span>}
              </label>
              <input
                type="text"
                value={value?.freeTextData?.[f.name] || ""}
                onChange={(e) => handleFreeTextChange(f.name, e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
