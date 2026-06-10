"use client";
import { useParams } from "next/navigation";

import React, { useState, useEffect } from "react";
import ApprovalLevelForm from "../../components/ApprovalLevelForm";

interface User {
  id: string;
  name: string;
  email: string;
  status: string;
}

interface ApproverPerson {
  id: string;
  userId: string;
  status: string;
  user?: User;
}

interface ApprovalProfile {
  id: string;
  module: string;
  actionButton: string | null;
  minRange: number | null;
  maxRange: number | null;
  status: string;
  approvers: ApproverPerson[];
}

export default function EditApprovalLevelPage() {
  const params = useParams();
  const id = params?.id as string;


  const [users, setUsers] = useState<User[]>([]);
  const [profile, setProfile] = useState<ApprovalProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const loadData = async () => {
      try {
        const [profilesRes, usersRes] = await Promise.all([
          fetch("/api/profiles/approval-levels"),
          fetch("/api/users"),
        ]);

        if (!profilesRes.ok || !usersRes.ok) {
          throw new Error("Failed to load backend configurations.");
        }

        const profilesData: ApprovalProfile[] = await profilesRes.json();
        const usersData: User[] = await usersRes.json();

        // Find specific profile matching the dynamic ID
        const matchedProfile = profilesData.find((p) => p.id === id);
        if (!matchedProfile) {
          throw new Error(`Approval level profile with ID "${id}" could not be found.`);
        }

        setProfile(matchedProfile);
        setUsers(usersData);
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred while loading profile.");
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
          <a href="/dashboard/profiles/approval-levels" className="hover:underline">Approval Level Profile</a>
          <span>/</span>
          <span>Modify Tier</span>
        </div>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-blue-900 ">
          Modify Value Band Configuration
        </h2>
        <p className="mt-1 text-xs text-blue-500 ">
          Modify the value-banded approval level limits or assignees for this Purchase Order tier.
        </p>
      </div>

      {loading ? (
        <div className="w-full flex h-64 flex-col items-center justify-center rounded-2xl border border-blue-200 bg-white shadow-sm">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <span className="mt-4 text-xs font-medium text-blue-500">Retrieving approval tier details...</span>
        </div>
      ) : error ? (
        <div className="w-full rounded-2xl border border-rose-200 bg-rose-50/50 p-6 text-center text-rose-800 shadow-sm">
          <p className="text-sm font-semibold">{error}</p>
          <a
            href="/dashboard/profiles/approval-levels"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500"
          >
            Return to Profiles List
          </a>
        </div>
      ) : (
        <ApprovalLevelForm users={users} editingProfile={profile} />
      )}

    </div>
  );
}
