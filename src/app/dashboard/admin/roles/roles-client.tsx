"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Plus, Trash2, Edit, Shield, Copy } from "lucide-react";

interface RoleProfile {
  id: string;
  name: string;
  remark: string | null;
  status: string;
}

export default function RolesClient({ roles }: { roles: RoleProfile[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return roles.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()));
  }, [roles, search]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this role?")) return;
    try {
      const res = await fetch(`/api/admin/roles/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to delete role.");
        return;
      }
      router.refresh();
    } catch {
      alert("Error deleting role.");
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-slate-50/50">
      <div className="flex-none border-b border-blue-100 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-blue-900">
              <Shield className="text-amber-500" size={24} />
              Enterprise Roles
            </h1>
            <p className="mt-1 text-sm text-blue-500">
              Manage user roles and their granular access permissions.
            </p>
          </div>
          <Link
            href="/dashboard/admin/roles/new"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:from-cyan-600 hover:to-blue-700 active:scale-95"
          >
            <Plus size={16} />
            Add Custom Role
          </Link>
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
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-blue-200 p-16 text-center text-blue-500">
            <Shield size={48} className="mb-4 text-blue-200" />
            <p className="text-sm">No roles found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((role) => (
              <div
                key={role.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-blue-100 bg-white p-5 shadow-sm transition-all hover:border-blue-300 hover:shadow-md"
              >
                <div>
                  <div className="mb-3 flex items-center justify-between">
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
                  <p className="line-clamp-2 text-sm text-blue-600">
                    {role.remark || "No remarks provided."}
                  </p>
                </div>

                <div className="mt-5 flex items-center justify-end gap-2 border-t border-blue-50 pt-4">
                  <Link
                    href={`/dashboard/admin/roles/new?cloneFrom=${role.id}`}
                    title="Clone Role"
                    className="rounded-lg p-2 text-cyan-500 transition-colors hover:bg-cyan-50 hover:text-cyan-700"
                  >
                    <Copy size={16} />
                  </Link>
                  <Link
                    href={`/dashboard/admin/roles/${role.id}/edit`}
                    title="Edit Role"
                    className="rounded-lg p-2 text-blue-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                  >
                    <Edit size={16} />
                  </Link>
                  <button
                    onClick={() => handleDelete(role.id)}
                    title="Delete Role"
                    className="rounded-lg p-2 text-rose-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
