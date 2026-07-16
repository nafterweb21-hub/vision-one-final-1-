"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { updateMainProcessAction, getMainProcessesAction } from "../../actions";

export default function EditMainProcessPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [roles, setRoles] = useState<{ id: string; name: string }[]>([]);
  const [allowedRoleIds, setAllowedRoleIds] = useState<string[]>([]);

  const toggleRole = (rid: string) =>
    setAllowedRoleIds((prev) =>
      prev.includes(rid) ? prev.filter((r) => r !== rid) : [...prev, rid],
    );

  const [formData, setFormData] = useState({
    process: "",
    remark: "",
  });

  useEffect(() => {
    if (!id) return;
    const fetchRecord = async () => {
      setIsLoading(true);
      const res = await getMainProcessesAction();
      if (res.success && res.data) {
        const record = res.data.find((r: any) => r.id === id);
        if (record) {
          setFormData({
            process: record.process,
            remark: record.remark || "",
          });
          setAllowedRoleIds((record.allowedRoles ?? []).map((r: any) => r.id));
        } else {
          setErrorMsg("Record not found.");
        }
      } else {
        setErrorMsg("Failed to load record.");
      }
      setIsLoading(false);
    };

    if (id) {
      fetchRecord();
    }

    (async () => {
      try {
        const { getActiveRoleProfiles } = await import("@/lib/roles.actions");
        setRoles(await getActiveRoleProfiles());
      } catch (error) {
        console.error("Failed to load roles", error);
      }
    })();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    startTransition(async () => {
      const res = await updateMainProcessAction(id, {
        remark: formData.remark,
        allowedRoleIds,
      });

      if (res.success) {
        router.push("/dashboard/master-profile/main-process");
      } else {
        setErrorMsg(res.error || "Failed to update main process");
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-cyan-600" />
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 max-w-4xl mx-auto w-full">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/dashboard/master-profile/main-process"
          className="p-2 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-blue-900">
            Edit Main Process Profile
          </h1>
          <p className="text-sm text-blue-500">
            Update routing process category remarks.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-blue-200 shadow-sm overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errorMsg && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-600 text-sm font-medium">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                Main Process <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                disabled
                value={formData.process}
                className="w-full rounded-lg border border-blue-200 px-4 py-2.5 text-sm text-blue-900 outline-none bg-blue-50 cursor-not-allowed"
              />
              <p className="text-[10px] text-blue-400">Once saved, cannot be changed.</p>
            </div>
            
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                Remark
              </label>
              <textarea
                rows={3}
                value={formData.remark}
                onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                className="w-full rounded-lg border border-blue-200 px-4 py-2.5 text-sm text-blue-900 outline-none focus:ring-2 focus:ring-cyan-500 transition-all bg-white"
                placeholder="Enter remarks..."
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                Allowed Roles
              </label>
              <p className="text-[10px] text-blue-400 mb-2">
                Only operators with a selected role may run this process in the terminal. Leave all unchecked to allow everyone.
              </p>
              {roles.length === 0 ? (
                <p className="text-xs text-blue-400">No active roles found.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {roles.map((r) => {
                    const checked = allowedRoleIds.includes(r.id);
                    return (
                      <button
                        type="button"
                        key={r.id}
                        onClick={() => toggleRole(r.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                          checked
                            ? "bg-cyan-600 text-white border-cyan-600"
                            : "bg-white text-blue-700 border-blue-200 hover:bg-blue-50"
                        }`}
                      >
                        {r.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="pt-6 border-t border-blue-100 flex items-center justify-end gap-3">
            <Link
              href="/dashboard/master-profile/main-process"
              className="px-4 py-2.5 text-sm font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isPending}
              className="px-6 py-2.5 text-sm font-bold text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
