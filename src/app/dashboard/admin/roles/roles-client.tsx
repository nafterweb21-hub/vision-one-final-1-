"use client";
import { SearchableSelect } from "@/components/SearchableSelect";
import { useEffect, useState, useCallback, useMemo } from "react";
import { Search, Plus, Trash2, Edit, Loader2, AlertCircle, Shield, X, Check } from "lucide-react";
interface RoleProfile {
  id: string;
  name: string;
  remark: string | null;
  status: "Active" | "Inactive";
  createdAt: string;
}

export default function RolesClient({ currentUserId }: { currentUserId: string }) {
  const [roles, setRoles] = useState<RoleProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<{ id?: string; name: string; remark: string; status: "Active" | "Inactive" }>({
    name: "",
    remark: "",
    status: "Active",
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/roles");
    if (res.ok) setRoles(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const filtered = useMemo(() => {
    return roles.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()));
  }, [roles, search]);

  const openNew = () => {
    setForm({ name: "", remark: "", status: "Active" });
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEdit = (role: RoleProfile) => {
    setForm({ id: role.id, name: role.name, remark: role.remark || "", status: role.status });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this role?")) return;
    try {
      const res = await fetch(`/api/admin/roles/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to delete role.");
        return;
      }
      fetchRoles();
    } catch (e) {
      alert("Error deleting role.");
    }
  };

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

      setIsModalOpen(false);
      fetchRoles();
    } catch (err) {
      setFormError("An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-slate-50/50">
      <div className="flex-none border-b border-blue-100 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-blue-900">
              <Shield className="text-amber-500" size={24} />
              Master Profile for Roles
            </h1>
            <p className="mt-1 text-sm text-blue-500">
              Manage user roles, custom profiles, and their status.
            </p>
          </div>
          <button
            onClick={openNew}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:from-cyan-600 hover:to-blue-700 active:scale-95 transition-all"
          >
            <Plus size={16} />
            Add Role
          </button>
        </div>

        <div className="mt-6 flex items-center gap-4">
          <div className="relative flex max-w-sm flex-1 items-center">
            <Search className="absolute left-3 text-blue-400" size={16} />
            <input
              type="text"
              placeholder="Search roles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-blue-200 bg-blue-50/50 py-2.5 pl-10 pr-4 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="animate-spin text-blue-400" size={32} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-blue-200 p-16 text-center text-blue-500">
            <Shield size={48} className="mb-4 text-blue-200" />
            <p className="text-sm">No roles found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((role) => (
              <div
                key={role.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-blue-100 bg-white p-5 shadow-sm transition-all hover:border-blue-300 hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-blue-900">{role.name}</h3>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        role.status === "Active"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-rose-100 text-rose-700"
                      }`}
                    >
                      {role.status}
                    </span>
                  </div>
                  <p className="text-sm text-blue-600 line-clamp-2">
                    {role.remark || "No remarks provided."}
                  </p>
                </div>

                <div className="mt-5 flex items-center justify-end gap-2 border-t border-blue-50 pt-4">
                  <button
                    onClick={() => openEdit(role)}
                    className="rounded-lg p-2 text-blue-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(role.id)}
                    className="rounded-lg p-2 text-rose-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md animate-in zoom-in-95 rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-blue-50 bg-blue-50/50 px-6 py-4">
              <h2 className="text-lg font-bold text-blue-900">
                {form.id ? "Edit Role" : "Add New Role"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-full p-1 text-blue-400 hover:bg-white hover:text-blue-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {formError && (
                <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-sm font-medium text-rose-700 border border-rose-200">
                  <AlertCircle size={16} />
                  {formError}
                </div>
              )}

              <div>
                <label className="mb-1 block text-sm font-semibold text-blue-700">
                  Role Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value.toUpperCase() })}
                  className="w-full rounded-xl border border-blue-200 bg-blue-50/50 px-4 py-2.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 uppercase"
                  placeholder="e.g. SUPERVISOR"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-blue-700">Remarks</label>
                <textarea
                  value={form.remark}
                  onChange={(e) => setForm({ ...form, remark: e.target.value })}
                  className="w-full rounded-xl border border-blue-200 bg-blue-50/50 px-4 py-2.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 min-h-[80px]"
                  placeholder="Optional details about this role..."
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

              <div className="mt-8 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                  className="rounded-xl border border-blue-200 px-5 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 px-6 py-2 text-sm font-semibold text-white hover:from-cyan-600 hover:to-blue-700 disabled:opacity-60 shadow-md transition-all"
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  {form.id ? "Save Changes" : "Create Role"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
