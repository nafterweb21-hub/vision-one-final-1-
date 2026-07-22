"use client";
import { SearchableSelect } from "@/components/SearchableSelect";
import React, { useState, useEffect } from "react";
import { getJointProfileItems } from "@/app/dashboard/master-profile/joint/actions";
import Link from "next/link";
interface JointProfileDropdownProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function JointProfileDropdown({ value, onChange, disabled }: JointProfileDropdownProps) {
  const [items, setItems] = useState<{ id: string; joint: string; status: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const res = await getJointProfileItems();
      if (res.success && res.data) {
        // Only fetch Active Joint records per workflow requirements
        setItems(res.data.filter((i: any) => i.status === "Active"));
      }
      setIsLoading(false);
    }
    loadData();
  }, []);

  return (
    <div className="relative">
      {isLoading ? (
        <SearchableSelect
          disabled
          className="w-full rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm text-blue-500 outline-none opacity-50"
        >
          <option>Loading joint profiles...</option>
        </SearchableSelect>
      ) : items.length === 0 ? (
        <div className="flex flex-col gap-2">
          <SearchableSelect
            disabled
            className="w-full rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-500 outline-none opacity-80"
          >
            <option>No active joint profiles found</option>
          </SearchableSelect>
          <Link
            href="/dashboard/master-profile/joint/new"
            target="_blank"
            className="text-sm font-semibold text-cyan-600 hover:text-cyan-500"
          >
            + Create New Joint
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <SearchableSelect
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="w-full rounded-lg border border-blue-200 bg-white px-4 py-2.5 text-sm text-blue-900 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 disabled:bg-blue-50 disabled:opacity-50 transition-colors"
          >
            <option value="" disabled>Select a joint profile</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.joint}
              </option>
            ))}
          </SearchableSelect>
          
          <div className="flex justify-end">
            <Link
              href="/dashboard/master-profile/joint/new"
              target="_blank"
              className="text-xs font-semibold text-cyan-600 hover:text-cyan-500 transition-colors"
            >
              + Create New Joint
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
