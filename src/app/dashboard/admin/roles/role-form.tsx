"use client";
import { SearchableSelect } from "@/components/SearchableSelect";
import { Fragment, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2, Check, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { MODULE_GROUP_ORDER } from "@/lib/modules.config";

export type Perms = { v: boolean; c: boolean; e: boolean; d: boolean; a: boolean; x: boolean };
export const EMPTY_PERMS: Perms = { v: false, c: false, e: false, d: false, a: false, x: false };

export interface AppModule {
  id: string;
  code: string;
  name: string;
  group: string;
}

export interface RoleFormValues {
  id?: string;
  name: string;
  remark: string;
  status: "Active" | "Inactive";
  permissions: Record<string, Perms>;
}

const ACTIONS: { key: keyof Perms; label: string }[] = [
  { key: "v", label: "View" },
  { key: "c", label: "Create" },
  { key: "e", label: "Edit" },
  { key: "d", label: "Delete" },
  { key: "a", label: "Approve" },
  { key: "x", label: "Export" },
];

const LIST_URL = "/dashboard/admin/roles";

export default function RoleForm({
  modules,
  initial,
  title,
  submitLabel,
}: {
  modules: AppModule[];
  initial: RoleFormValues;
  title: string;
  submitLabel: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState<RoleFormValues>(initial);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const groupedModules = useMemo(() => {
    const groups = new Map<string, AppModule[]>();
    for (const m of modules) {
      if (!groups.has(m.group)) groups.set(m.group, []);
      groups.get(m.group)!.push(m);
    }
    return [...groups.entries()].sort(
      ([a], [b]) => MODULE_GROUP_ORDER.indexOf(a) - MODULE_GROUP_ORDER.indexOf(b),
    );
  }, [modules]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    const isEdit = !!form.id;
    const url = isEdit ? `/api/admin/roles/${form.id}` : "/api/admin/roles";
    const method = isEdit ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        setFormError(data.error || "Request failed");
        setSubmitting(false);
        return;
      }

      router.push(LIST_URL);
      router.refresh();
    } catch {
      setFormError("An unexpected error occurred.");
      setSubmitting(false);
    }
  };

  const handlePermChange = (code: string, action: keyof Perms, checked: boolean) => {
    setForm((prev) => {
      const current = prev.permissions[code] ?? EMPTY_PERMS;
      const next = { ...current, [action]: checked };
      // Every other action is meaningless without View, so keep them consistent.
      if (action === "v" && !checked) {
        for (const { key } of ACTIONS) next[key] = false;
      } else if (action !== "v" && checked) {
        next.v = true;
      }
      return { ...prev, permissions: { ...prev.permissions, [code]: next } };
    });
  };

  /** Toggle every action of every module in a group. */
  const handleGroupToggle = (groupModules: AppModule[], checked: boolean) => {
    setForm((prev) => {
      const permissions = { ...prev.permissions };
      for (const m of groupModules) {
        permissions[m.code] = checked
          ? { v: true, c: true, e: true, d: true, a: true, x: true }
          : { ...EMPTY_PERMS };
      }
      return { ...prev, permissions };
    });
  };

  return (
    <form onSubmit={handleSubmit} className="pb-24">
      <div className="mb-6">
        <Link
          href={LIST_URL}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-500 hover:text-blue-700 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Roles
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-blue-900">{title}</h1>
      </div>

      <div className="space-y-5 rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
        {formError && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-700">
            <AlertCircle size={16} />
            {formError}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-semibold text-blue-700">
              Role Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value.toUpperCase() })}
              className="w-full rounded-xl border border-blue-200 bg-blue-50/50 px-4 py-2.5 text-sm uppercase focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
              placeholder="e.g. SUPERVISOR"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-blue-700">Status</label>
            <SearchableSelect
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as "Active" | "Inactive" })}
              className="w-full rounded-xl border border-blue-200 bg-blue-50/50 px-4 py-2.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </SearchableSelect>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-blue-700">Remarks</label>
          <input
            value={form.remark}
            onChange={(e) => setForm({ ...form, remark: e.target.value })}
            className="w-full rounded-xl border border-blue-200 bg-blue-50/50 px-4 py-2.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
            placeholder="Optional details about this role..."
          />
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
        <h2 className="mb-3 border-b border-blue-100 pb-2 text-md font-bold text-blue-900">
          Module Permissions
        </h2>
        <div className="overflow-hidden rounded-xl border border-blue-100">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-blue-50/80 text-xs font-semibold uppercase text-blue-900">
              <tr>
                <th className="px-4 py-3">Module</th>
                {ACTIONS.map(({ key, label }) => (
                  <th key={key} className="px-4 py-3 text-center">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-50 bg-white">
              {groupedModules.map(([group, groupModules]) => {
                const allOn = groupModules.every((m) =>
                  ACTIONS.every(({ key }) => form.permissions[m.code]?.[key]),
                );
                return (
                  <Fragment key={group}>
                    <tr>
                      <td colSpan={ACTIONS.length + 1} className="bg-slate-50 px-4 py-2">
                        <label className="flex cursor-pointer items-center gap-2 text-xs font-bold uppercase text-slate-500">
                          <input
                            type="checkbox"
                            checked={allOn}
                            onChange={(e) => handleGroupToggle(groupModules, e.target.checked)}
                            className="h-4 w-4 cursor-pointer rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                          />
                          {group}
                        </label>
                      </td>
                    </tr>
                    {groupModules.map((mod) => {
                      const perms = form.permissions[mod.code] ?? EMPTY_PERMS;
                      return (
                        <tr key={mod.code} className="transition-colors hover:bg-blue-50/50">
                          <td className="px-4 py-2 font-medium text-slate-800">{mod.name}</td>
                          {ACTIONS.map(({ key, label }) => (
                            <td key={key} className="px-4 py-2 text-center">
                              <input
                                type="checkbox"
                                aria-label={`${label} ${mod.name}`}
                                checked={perms[key]}
                                onChange={(e) => handlePermChange(mod.code, key, e.target.checked)}
                                className="h-4 w-4 cursor-pointer rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                              />
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pinned so Save stays reachable without scrolling past all 59 modules. */}
      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-blue-100 bg-white/95 px-6 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl justify-end gap-3">
          <Link
            href={LIST_URL}
            className="rounded-xl border border-blue-200 px-5 py-2 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-md transition-all hover:from-cyan-600 hover:to-blue-700 disabled:opacity-60"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            {submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
}
