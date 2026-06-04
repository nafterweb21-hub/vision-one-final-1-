"use client";
import { SearchableSelect } from "@/components/SearchableSelect";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
export default function NewEmployeePage() {
  const router = useRouter();
  const [designations, setDesignations] = useState<{ id: string; designation: string }[]>([]);

  // Form fields
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    nricFin: "",
    designation: "",
    email: "",
    mobileNo: "",
    gender: "Male",
    contactNo: "",
    employmentType: "Citizen",
    status: "ACTIVE",
  });

  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);


  const showToast = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  useEffect(() => {
    const fetchDesignations = async () => {
      try {
        const { getDesignationProfileItems } = await import("../../designation/actions");
        const res = await getDesignationProfileItems();
        if (res.success && res.data) {
          setDesignations(res.data.filter((d: any) => d.status === "Active"));
        }
      } catch (error) {
        console.error("Failed to load designations", error);
      }
    };
    fetchDesignations();
  }, []);

  // Form validation
  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    if (!formData.code.trim()) errors.code = "Employee Code is required.";
    if (!formData.name.trim()) errors.name = "Employee Name is required.";

    if (!formData.nricFin.trim()) {
      errors.nricFin = "NRIC / FIN is required.";
    } else if (!/^[STFG]\d{7}[A-Z]$/i.test(formData.nricFin.trim())) {
      errors.nricFin = "Invalid NRIC / FIN format (e.g. S1234567A).";
    }

    if (!formData.email.trim()) {
      errors.email = "Email is required.";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Invalid email address format.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await res.json();

      if (res.ok) {
        showToast("success", `Employee "${formData.name}" successfully created.`);
        setTimeout(() => {
          router.push("/dashboard/master-profile/employee");
          router.refresh();
        }, 1200);
      } else {
        showToast("error", result.error || "Failed to create employee profile.");
      }
    } catch (error) {
      console.error(error);
      showToast("error", "Network error while saving employee.");
    } finally {
      setIsSaving(false);
    }
  };

  const employmentTypes = [
    "Citizen",
    "PR",
    "Employment Pass",
    "S Pass",
    "Work Permit",
  ];

  return (
    <div className="flex-1 p-6 space-y-6 max-w-3xl mx-auto w-full">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl border text-sm transition-all duration-300 transform scale-100 ${notification.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800 "
              : "bg-rose-50 border-rose-200 text-rose-800 "
            }`}
        >
          {notification.type === "success" ? (
            <svg className="h-5 w-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="h-5 w-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          <span className="font-semibold">{notification.message}</span>
        </div>
      )}

      {/* Breadcrumb Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/master-profile/employee"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-200 text-blue-500 hover:text-blue-950 :text-white hover:bg-blue-50 :bg-blue-800 transition-colors"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-blue-900 ">
            Create Employee Profile
          </h1>
          <p className="text-xs text-blue-500 mt-0.5">
            Add a new personnel record to FITPRISE EMS master database.
          </p>
        </div>
      </div>

      {/* Main card */}
      <div className="bg-white p-6 rounded-2xl border border-blue-200 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Code */}
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-blue-700 uppercase tracking-wide">
                  Employee Code <span className="text-rose-500">*</span>
                </label>
              </div>
              <input
                type="text"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
                placeholder="e.g. EMP001"
                className={`mt-1.5 w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all text-blue-900 bg-blue-50/50 font-mono font-bold ${formErrors.code
                    ? "border-rose-400 "
                    : "border-blue-200 "
                  }`}
              />
              {formErrors.code && (
                <p className="text-xs text-rose-500 mt-1 font-semibold">
                  {formErrors.code}
                </p>
              )}
            </div>

            {/* Name */}
            <div>
              <label className="block text-xs font-bold text-blue-700 uppercase tracking-wide">
                Employee Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g. Christopher Robin"
                className={`mt-1.5 w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all text-blue-900 bg-blue-50/50 ${formErrors.name
                    ? "border-rose-400 "
                    : "border-blue-200 "
                  }`}
              />
              {formErrors.name && (
                <p className="text-xs text-rose-500 mt-1 font-semibold">
                  {formErrors.name}
                </p>
              )}
            </div>

            {/* NRIC/FIN */}
            <div>
              <label className="block text-xs font-bold text-blue-700 uppercase tracking-wide">
                NRIC / FIN <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.nricFin}
                onChange={(e) =>
                  setFormData({ ...formData, nricFin: e.target.value })
                }
                placeholder="e.g. S1234567A"
                className={`mt-1.5 w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all text-blue-900 bg-blue-50/50 ${formErrors.nricFin
                    ? "border-rose-400 "
                    : "border-blue-200 "
                  }`}
              />
              {formErrors.nricFin && (
                <p className="text-xs text-rose-500 mt-1 font-semibold">
                  {formErrors.nricFin}
                </p>
              )}
            </div>

            {/* Designation */}
            <div>
              <label className="block text-xs font-bold text-blue-700 uppercase tracking-wide">
                Designation
              </label>
              <SearchableSelect
                value={formData.designation}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    designation: e.target.value,
                  })
                }
                className="mt-1.5 w-full px-3.5 py-2.5 rounded-xl border border-blue-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all text-blue-900 bg-blue-50/50 "
              >
                <option value="">-- Select Designation --</option>
                {designations.map((d) => (
                  <option key={d.id} value={d.designation}>
                    {d.designation}
                  </option>
                ))}
              </SearchableSelect>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-blue-700 uppercase tracking-wide">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="e.g. user@visionone.com"
                className={`mt-1.5 w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all text-blue-900 bg-blue-50/50 ${formErrors.email
                    ? "border-rose-400 "
                    : "border-blue-200 "
                  }`}
              />
              {formErrors.email && (
                <p className="text-xs text-rose-500 mt-1 font-semibold">
                  {formErrors.email}
                </p>
              )}
            </div>

            {/* Employment Type */}
            <div>
              <label className="block text-xs font-bold text-blue-700 uppercase tracking-wide">
                Employment Type
              </label>
              <SearchableSelect
                value={formData.employmentType}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    employmentType: e.target.value,
                  })
                }
                className="mt-1.5 w-full px-3.5 py-2.5 rounded-xl border border-blue-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all text-blue-900 bg-blue-50/50 "
              >
                {employmentTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </SearchableSelect>
            </div>

            {/* Mobile No */}
            <div>
              <label className="block text-xs font-bold text-blue-700 uppercase tracking-wide">
                Mobile No
              </label>
              <input
                type="text"
                value={formData.mobileNo}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    mobileNo: e.target.value,
                  })
                }
                placeholder="e.g. 98765432"
                className="mt-1.5 w-full px-3.5 py-2.5 rounded-xl border border-blue-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all text-blue-900 bg-blue-50/50 "
              />
            </div>

            {/* Contact No */}
            <div>
              <label className="block text-xs font-bold text-blue-700 uppercase tracking-wide">
                Contact No
              </label>
              <input
                type="text"
                value={formData.contactNo}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    contactNo: e.target.value,
                  })
                }
                placeholder="e.g. 61234567"
                className="mt-1.5 w-full px-3.5 py-2.5 rounded-xl border border-blue-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all text-blue-900 bg-blue-50/50 "
              />
            </div>

            {/* Gender */}
            <div>
              <label className="block text-xs font-bold text-blue-700 uppercase tracking-wide">
                Gender
              </label>
              <SearchableSelect
                value={formData.gender}
                onChange={(e) =>
                  setFormData({ ...formData, gender: e.target.value })
                }
                className="mt-1.5 w-full px-3.5 py-2.5 rounded-xl border border-blue-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all text-blue-900 bg-blue-50/50 "
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </SearchableSelect>
            </div>

            {/* Status Toggle */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-blue-50 border border-blue-200 ">
              <div>
                <h4 className="text-xs font-bold text-blue-800 ">
                  Active Status
                </h4>
                <p className="text-[10px] text-blue-400 mt-0.5">
                  Toggled off set the employee profile to inactive.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setFormData({
                    ...formData,
                    status:
                      formData.status === "ACTIVE"
                        ? "INACTIVE"
                        : "ACTIVE",
                  })
                }
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${formData.status === "ACTIVE"
                    ? "bg-emerald-500"
                    : "bg-blue-300 "
                  }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${formData.status === "ACTIVE"
                      ? "translate-x-5"
                      : "translate-x-0"
                    }`}
                />
              </button>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-blue-200 ">
            <Link
              href="/dashboard/master-profile/employee"
              className="px-5 py-2.5 rounded-xl border border-blue-200 hover:bg-blue-200/40 :bg-blue-800 text-xs font-bold text-blue-700 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-xs font-bold text-white shadow-md shadow-blue-500/10 hover:shadow-lg hover:shadow-blue-500/20 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? "Creating..." : "Save Profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
