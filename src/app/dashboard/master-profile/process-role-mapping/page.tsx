"use client";

import React, { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { SearchableSelect } from "@/components/SearchableSelect";
import { getMainProcessesAction, updateMainProcessAction } from "../main-process/actions";

type Role = { id: string; name: string };
type MainProcess = {
  id: string;
  process: string;
  remark: string | null;
  allowedRoles: Role[];
};

export default function ProcessRoleMappingPage() {
  const [isPending, startTransition] = useTransition();
  const [processes, setProcesses] = useState<MainProcess[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [allowedRoleIds, setAllowedRoleIds] = useState<string[]>([]);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  async function loadProcesses() {
    const res = await getMainProcessesAction();
    if (res.success && res.data) setProcesses(res.data as any);
  }

  useEffect(() => {
    loadProcesses();
    (async () => {
      try {
        const { getActiveRoleProfiles } = await import("@/lib/roles.actions");
        setRoles(await getActiveRoleProfiles());
      } catch (error) {
        console.error("Failed to load roles", error);
      }
    })();
  }, []);

  const selected = useMemo(
    () => processes.find((p) => p.id === selectedId) || null,
    [processes, selectedId],
  );

  // When a process is picked, prefill its current role set.
  function handleSelect(id: string) {
    setSelectedId(id);
    const proc = processes.find((p) => p.id === id);
    setAllowedRoleIds((proc?.allowedRoles ?? []).map((r) => r.id));
  }

  const toggleRole = (rid: string) =>
    setAllowedRoleIds((prev) =>
      prev.includes(rid) ? prev.filter((r) => r !== rid) : [...prev, rid],
    );

  function handleSave() {
    if (!selected) return;
    startTransition(async () => {
      const res = await updateMainProcessAction(selected.id, {
        remark: selected.remark,
        allowedRoleIds,
      });
      if (res.success) {
        showToast("success", `Roles updated for "${selected.process}".`);
        await loadProcesses();
      } else {
        showToast("error", res.error || "Failed to update roles.");
      }
    });
  }

  const dirty = useMemo(() => {
    if (!selected) return false;
    const current = new Set((selected.allowedRoles ?? []).map((r) => r.id));
    if (current.size !== allowedRoleIds.length) return true;
    return allowedRoleIds.some((id) => !current.has(id));
  }, [selected, allowedRoleIds]);

  return (
    <div className="flex-1 p-6 max-w-4xl mx-auto w-full space-y-6">
      {notification && (
        <div
          className={`fixed top-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border text-sm font-semibold ${
            notification.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          {notification.message}
        </div>
      )}

      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/master-profile/main-process"
          className="p-2 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-blue-900">Process Role Mapping</h1>
          <p className="text-sm text-blue-500">
            Select a main process, then choose which roles may run it in the production terminal.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-blue-200 shadow-sm p-6 space-y-6">
        <div className="space-y-1 max-w-md">
          <label className="text-xs font-bold text-blue-900 uppercase tracking-wider">
            Main Process <span className="text-rose-500">*</span>
          </label>
          <SearchableSelect
            value={selectedId}
            onChange={(e) => handleSelect(e.target.value)}
            className="w-full rounded-lg border border-blue-200 px-4 py-2.5 text-sm text-blue-900 outline-none focus:ring-2 focus:ring-cyan-500 transition-all bg-white"
          >
            <option value="">-- Select a Main Process --</option>
            {processes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.process}
                {p.allowedRoles.length ? ` (${p.allowedRoles.length} role${p.allowedRoles.length > 1 ? "s" : ""})` : ""}
              </option>
            ))}
          </SearchableSelect>
        </div>

        {selected ? (
          <div className="space-y-2 pt-2 border-t border-blue-100">
            <label className="text-xs font-bold text-blue-900 uppercase tracking-wider">
              Allowed Roles
            </label>
            <p className="text-[10px] text-blue-400">
              Only operators with a selected role may run this process. Leave all unchecked to allow everyone.
            </p>
            {roles.length === 0 ? (
              <p className="text-xs text-blue-400">No active roles found.</p>
            ) : (
              <div className="flex flex-wrap gap-2 pt-1">
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

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={handleSave}
                disabled={isPending || !dirty}
                className="px-6 py-2.5 text-sm font-bold text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? "Saving..." : "Save Roles"}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-blue-400 border-t border-blue-100 pt-6">
            Select a main process above to assign its roles.
          </p>
        )}
      </div>
    </div>
  );
}
