"use client";
import { useParams } from "next/navigation";
import { customConfirm } from "@/lib/customConfirm";
import { toast as hotToast } from "react-hot-toast";

import React, { useState, useEffect, useTransition, use } from "react";
import Link from "next/link";
import {
  getSupplierDetail,
  updateSupplierRemarks,
  addContactPerson,
  updateContactPerson,
  toggleContactPersonStatus,
  setContactPersonDefault,
  deleteContactPerson,
  addAddress,
  updateAddress,
  toggleAddressStatus,
  setAddressDefault,
  deleteAddress,
} from "../actions";

interface ContactPerson {
  id: string;
  supplierId: string;
  contactPersonName: string;
  telNo: string | null;
  mobileNo: string | null;
  faxNo: string | null;
  email: string | null;
  designation: string | null;
  status: string;
  isDefault: boolean;
}

interface SupplierAddress {
  id: string;
  supplierId: string;
  address: string;
  status: string;
  isDefault: boolean;
}

interface SupplierFullDetail {
  id: string;
  supplierCode: string;
  supplierName: string;
  remarks: string | null;
  status: string;
  contactPersons: ContactPerson[];
  addresses: SupplierAddress[];
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ManageSupplierPage() {
  const params = useParams();
  const id = params?.id as string;
  const supplierId = id;

  const [supplierDetail, setSupplierDetail] = useState<SupplierFullDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<"general" | "contacts" | "addresses">("general");

  // Remarks edit states
  const [remarksEdit, setRemarksEdit] = useState("");
  const [remarksSuccess, setRemarksSuccess] = useState(false);

  // Contact form states
  const [isContactFormOpen, setIsContactFormOpen] = useState(false);
  const [contactEditId, setContactEditId] = useState<string | null>(null);
  const [contactName, setContactName] = useState("");
  const [contactTel, setContactTel] = useState("");
  const [contactMobile, setContactMobile] = useState("");
  const [contactFax, setContactFax] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactDesignation, setContactDesignation] = useState("");
  const [contactIsDefault, setContactIsDefault] = useState(false);
  const [contactFormError, setContactFormError] = useState<string | null>(null);

  // Address form states
  const [isAddressFormOpen, setIsAddressFormOpen] = useState(false);
  const [addressEditId, setAddressEditId] = useState<string | null>(null);
  const [addressText, setAddressText] = useState("");
  const [addressIsDefault, setAddressIsDefault] = useState(false);
  const [addressFormError, setAddressFormError] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!id) return;
    const loadSupplierData = async () => {
      setIsLoading(true);
      setErrorMsg(null);
      const res = await getSupplierDetail(supplierId);
      if (res.success && res.data) {
        const data = res.data as SupplierFullDetail;
        setSupplierDetail(data);
        setRemarksEdit(data.remarks || "");
      } else {
        setErrorMsg(res.error || "Failed to load supplier details.");
      }
      setIsLoading(false);
    };

    const run = async () => {
      await loadSupplierData();
    };
    run();
  }, [supplierId]);

  const handleSaveRemarks = async () => {
    setRemarksSuccess(false);
    startTransition(async () => {
      const res = await updateSupplierRemarks(supplierId, remarksEdit);
      if (res.success) {
        setRemarksSuccess(true);
        // Refresh local details
        const updated = await getSupplierDetail(supplierId);
        if (updated.success && updated.data) {
          setSupplierDetail(updated.data as SupplierFullDetail);
        }
      } else {
        hotToast.error(res.error || "Failed to update remarks.");
      }
    });
  };

  // Contact Persons action handlers
  const handleOpenAddContact = () => {
    setContactEditId(null);
    setContactName("");
    setContactTel("");
    setContactMobile("");
    setContactFax("");
    setContactEmail("");
    setContactDesignation("");
    setContactIsDefault(false);
    setContactFormError(null);
    setIsContactFormOpen(true);
  };

  const handleOpenEditContact = (c: ContactPerson) => {
    setContactEditId(c.id);
    setContactName(c.contactPersonName);
    setContactTel(c.telNo || "");
    setContactMobile(c.mobileNo || "");
    setContactFax(c.faxNo || "");
    setContactEmail(c.email || "");
    setContactDesignation(c.designation || "");
    setContactIsDefault(c.isDefault);
    setContactFormError(null);
    setIsContactFormOpen(true);
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactFormError(null);
    const name = contactName.trim();
    if (!name) {
      setContactFormError("Contact Person name is required.");
      return;
    }

    startTransition(async () => {
      let res;
      if (contactEditId) {
        res = await updateContactPerson(contactEditId, {
          contactPersonName: name,
          telNo: contactTel.trim() || undefined,
          mobileNo: contactMobile.trim() || undefined,
          faxNo: contactFax.trim() || undefined,
          email: contactEmail.trim() || undefined,
          designation: contactDesignation.trim() || undefined,
        });
      } else {
        res = await addContactPerson(supplierId, {
          contactPersonName: name,
          telNo: contactTel.trim() || undefined,
          mobileNo: contactMobile.trim() || undefined,
          faxNo: contactFax.trim() || undefined,
          email: contactEmail.trim() || undefined,
          designation: contactDesignation.trim() || undefined,
          isDefault: contactIsDefault,
        });
      }

      if (res.success) {
        setIsContactFormOpen(false);
        // Reload details
        const updated = await getSupplierDetail(supplierId);
        if (updated.success && updated.data) {
          setSupplierDetail(updated.data as SupplierFullDetail);
        }
      } else {
        setContactFormError(res.error || "Failed to save contact person.");
      }
    });
  };

  const handleToggleContactStatus = async (id: string) => {
    startTransition(async () => {
      const res = await toggleContactPersonStatus(id);
      if (res.success) {
        const updated = await getSupplierDetail(supplierId);
        if (updated.success && updated.data) {
          setSupplierDetail(updated.data as SupplierFullDetail);
        }
      } else {
        hotToast.error(res.error || "Failed to toggle status.");
      }
    });
  };

  const handleSetContactDefault = async (id: string) => {
    startTransition(async () => {
      const res = await setContactPersonDefault(id, supplierId);
      if (res.success) {
        const updated = await getSupplierDetail(supplierId);
        if (updated.success && updated.data) {
          setSupplierDetail(updated.data as SupplierFullDetail);
        }
      } else {
        hotToast.error(res.error || "Failed to set default contact.");
      }
    });
  };

  const handleDeleteContact = async (id: string) => {
    if (await customConfirm("Are you sure you want to delete this contact person?")) {
      startTransition(async () => {
        const res = await deleteContactPerson(id);
        if (res.success) {
          const updated = await getSupplierDetail(supplierId);
          if (updated.success && updated.data) {
            setSupplierDetail(updated.data as SupplierFullDetail);
          }
        } else {
          hotToast.error(res.error || "Failed to delete contact.");
        }
      });
    }
  };

  // Address action handlers
  const handleOpenAddAddress = () => {
    setAddressEditId(null);
    setAddressText("");
    setAddressIsDefault(false);
    setAddressFormError(null);
    setIsAddressFormOpen(true);
  };

  const handleOpenEditAddress = (a: SupplierAddress) => {
    setAddressEditId(a.id);
    setAddressText(a.address);
    setAddressIsDefault(a.isDefault);
    setAddressFormError(null);
    setIsAddressFormOpen(true);
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddressFormError(null);
    const txt = addressText.trim();
    if (!txt) {
      setAddressFormError("Address text is required.");
      return;
    }

    startTransition(async () => {
      let res;
      if (addressEditId) {
        res = await updateAddress(addressEditId, txt);
      } else {
        res = await addAddress(supplierId, {
          address: txt,
          isDefault: addressIsDefault,
        });
      }

      if (res.success) {
        setIsAddressFormOpen(false);
        const updated = await getSupplierDetail(supplierId);
        if (updated.success && updated.data) {
          setSupplierDetail(updated.data as SupplierFullDetail);
        }
      } else {
        setAddressFormError(res.error || "Failed to save address.");
      }
    });
  };

  const handleToggleAddressStatus = async (id: string) => {
    startTransition(async () => {
      const res = await toggleAddressStatus(id);
      if (res.success) {
        const updated = await getSupplierDetail(supplierId);
        if (updated.success && updated.data) {
          setSupplierDetail(updated.data as SupplierFullDetail);
        }
      } else {
        hotToast.error(res.error || "Failed to toggle status.");
      }
    });
  };

  const handleSetAddressDefault = async (id: string) => {
    startTransition(async () => {
      const res = await setAddressDefault(id, supplierId);
      if (res.success) {
        const updated = await getSupplierDetail(supplierId);
        if (updated.success && updated.data) {
          setSupplierDetail(updated.data as SupplierFullDetail);
        }
      } else {
        hotToast.error(res.error || "Failed to set default address.");
      }
    });
  };

  const handleDeleteAddress = async (id: string) => {
    if (await customConfirm("Are you sure you want to delete this address?")) {
      startTransition(async () => {
        const res = await deleteAddress(id);
        if (res.success) {
          const updated = await getSupplierDetail(supplierId);
          if (updated.success && updated.data) {
            setSupplierDetail(updated.data as SupplierFullDetail);
          }
        } else {
          hotToast.error(res.error || "Failed to delete address.");
        }
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-72 items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
      </div>
    );
  }

  if (errorMsg || !supplierDetail) {
    return (
      <div className="w-full space-y-6 bg-white py-6 text-center text-black">
        <h2 className="text-xl font-bold text-red-600">Error loading details</h2>
        <p className="text-sm text-blue-600">{errorMsg || "Supplier not found."}</p>
        <Link
          href="/dashboard/admin/master-profile/supplier"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-blue-600 hover:text-blue-500 transition-colors"
        >
          Back to Suppliers
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 bg-white text-black p-6 md:p-8 rounded-2xl shadow-sm border border-blue-100">
      {/* Navigation & Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <Link
            href="/dashboard/admin/master-profile/supplier"
            className="inline-flex items-center gap-1.5 text-base font-bold text-blue-600 hover:text-blue-600 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back to Suppliers
          </Link>
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold tracking-tight text-black">
              Manage Supplier
            </h1>
            <span className="rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-base font-bold text-blue-700">
              {supplierDetail.supplierCode}
            </span>
          </div>
          <p className="text-base text-blue-500">
            {supplierDetail.supplierName}
          </p>
        </div>
      </div>

      {/* Main Layout - Centered Tab Selector */}
      <div className="flex border-b border-blue-200 mb-8 shrink-0 justify-center gap-4">
        <button
          onClick={() => {
            setDetailTab("general");
            setIsContactFormOpen(false);
            setIsAddressFormOpen(false);
          }}
          className={`px-8 py-4 text-base md:text-lg font-bold border-b-2 transition-all cursor-pointer ${
            detailTab === "general"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-blue-500 hover:text-blue-800"
          }`}
        >
          General Info
        </button>
        <button
          onClick={() => {
            setDetailTab("contacts");
            setIsContactFormOpen(false);
            setIsAddressFormOpen(false);
          }}
          className={`px-8 py-4 text-base md:text-lg font-bold border-b-2 transition-all cursor-pointer ${
            detailTab === "contacts"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-blue-500 hover:text-blue-800"
          }`}
        >
          Contact Persons ({supplierDetail.contactPersons.length})
        </button>
        <button
          onClick={() => {
            setDetailTab("addresses");
            setIsContactFormOpen(false);
            setIsAddressFormOpen(false);
          }}
          className={`px-8 py-4 text-base md:text-lg font-bold border-b-2 transition-all cursor-pointer ${
            detailTab === "addresses"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-blue-500 hover:text-blue-800"
          }`}
        >
          Addresses ({supplierDetail.addresses.length})
        </button>
      </div>

      {/* Tab Content Areas */}
      <div className="w-full min-h-[460px]">
        
        {/* GENERAL INFO TAB */}
        {detailTab === "general" && (
          <div className="flex flex-col gap-6 w-full">
            <h3 className="text-xl font-bold text-black border-b border-blue-150 pb-3">
              General Info
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <span className="text-sm font-bold text-blue-500 uppercase tracking-wider">Supplier Code</span>
                <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-base font-bold text-blue-800">
                  {supplierDetail.supplierCode}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-sm font-bold text-blue-500 uppercase tracking-wider">Supplier Name</span>
                <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-base font-medium text-blue-850">
                  {supplierDetail.supplierName}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-blue-500 uppercase tracking-wider">Remarks</label>
              <textarea
                placeholder="Enter remarks..."
                value={remarksEdit}
                onChange={(e) => setRemarksEdit(e.target.value)}
                className="rounded-lg glossy-input px-4 py-3 text-base outline-hidden resize-none w-full min-h-[160px] focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="flex items-center gap-4 pt-3">
              <button
                onClick={handleSaveRemarks}
                disabled={isPending}
                className="rounded-lg glossy-button-blue px-5 py-2.5 text-base font-bold text-white shadow-xs cursor-pointer"
              >
                Save Remarks
              </button>
              {remarksSuccess && (
                <span className="text-sm text-green-600 font-bold flex items-center gap-1.5">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  Saved Successfully
                </span>
              )}
            </div>
          </div>
        )}

        {/* CONTACT PERSONS TAB */}
        {detailTab === "contacts" && (
          <div className="flex-1 flex flex-col gap-6">
            <div className="flex justify-between items-center shrink-0">
              <h3 className="text-xl font-bold text-black uppercase tracking-wider">
                Contact Persons List
              </h3>
              {!isContactFormOpen && (
                <button
                  onClick={handleOpenAddContact}
                  className="rounded-lg glossy-button-blue px-5 py-2.5 text-sm font-bold text-white shadow-xs cursor-pointer"
                >
                  Add Contact Person
                </button>
              )}
            </div>

            {isContactFormOpen ? (
              <form onSubmit={handleContactSubmit} className="border-b border-blue-200 pb-6 mb-6 space-y-6 w-full">
                <h4 className="text-base font-bold uppercase tracking-wider text-blue-700">
                  {contactEditId ? "Edit Contact Details" : "Add New Contact"}
                </h4>
                {contactFormError && (
                  <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-800">
                    {contactFormError}
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-blue-600">Contact Person <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      required
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className="rounded-lg glossy-input px-4 py-2.5 text-base"
                      placeholder="e.g. John Doe"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-blue-600">Tel No</label>
                    <input
                      type="text"
                      value={contactTel}
                      onChange={(e) => setContactTel(e.target.value)}
                      className="rounded-lg glossy-input px-4 py-2.5 text-base"
                      placeholder="Tel number"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-blue-600">Mobile No</label>
                    <input
                      type="text"
                      value={contactMobile}
                      onChange={(e) => setContactMobile(e.target.value)}
                      className="rounded-lg glossy-input px-4 py-2.5 text-base"
                      placeholder="Mobile number"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-blue-600">Fax No</label>
                    <input
                      type="text"
                      value={contactFax}
                      onChange={(e) => setContactFax(e.target.value)}
                      className="rounded-lg glossy-input px-4 py-2.5 text-base"
                      placeholder="Fax number"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-blue-600">Email</label>
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="rounded-lg glossy-input px-4 py-2.5 text-base"
                      placeholder="Email address"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-blue-600">Designation</label>
                    <input
                      type="text"
                      value={contactDesignation}
                      onChange={(e) => setContactDesignation(e.target.value)}
                      className="rounded-lg glossy-input px-4 py-2.5 text-base"
                      placeholder="e.g. Sales Executive"
                    />
                  </div>
                </div>
                {!contactEditId && (
                  <div className="flex items-center gap-3 pt-2">
                    <input
                      type="checkbox"
                      id="manageContactDefault"
                      checked={contactIsDefault}
                      onChange={(e) => setContactIsDefault(e.target.checked)}
                      className="h-5 w-5 rounded border-blue-300 text-blue-600 cursor-pointer"
                    />
                    <label htmlFor="manageContactDefault" className="text-sm font-semibold text-blue-700 cursor-pointer select-none">
                      Set as Default Contact Person
                    </label>
                  </div>
                )}
                <div className="flex items-center gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setIsContactFormOpen(false)}
                    className="rounded-lg glossy-button-white px-5 py-2.5 text-sm font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="rounded-lg glossy-button-blue px-5 py-2.5 text-sm font-bold text-white cursor-pointer"
                  >
                    Save Contact
                  </button>
                </div>
              </form>
            ) : supplierDetail.contactPersons.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-dashed border-blue-200 rounded-lg">
                <p className="text-base font-semibold text-blue-800">No contacts defined</p>
                <p className="text-sm text-blue-550 mt-1">Click Add Contact Person to define supplier contacts.</p>
              </div>
            ) : (
              <div className="flex-1 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-blue-200 bg-blue-50 font-bold text-blue-700 sticky top-0">
                      <th className="px-4 py-3.5 text-sm font-bold">Name</th>
                      <th className="px-4 py-3.5 text-sm font-bold">Phone Details</th>
                      <th className="px-4 py-3.5 text-sm font-bold">Email</th>
                      <th className="px-4 py-3.5 text-sm font-bold">Designation</th>
                      <th className="px-4 py-3.5 text-center text-sm font-bold">Default</th>
                      <th className="px-4 py-3.5 text-center text-sm font-bold">Status</th>
                      <th className="px-4 py-3.5 text-right text-sm font-bold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-blue-100">
                    {supplierDetail.contactPersons.map((contact) => (
                      <tr key={contact.id} className="hover:bg-blue-50 transition-colors">
                        <td className="px-4 py-4 text-base font-bold text-black">{contact.contactPersonName}</td>
                        <td className="px-4 py-4 text-sm text-blue-800 space-y-1">
                          {contact.telNo && <div>Tel: {contact.telNo}</div>}
                          {contact.mobileNo && <div>Mob: {contact.mobileNo}</div>}
                          {contact.faxNo && <div>Fax: {contact.faxNo}</div>}
                          {!contact.telNo && !contact.mobileNo && !contact.faxNo && <span className="text-blue-400">—</span>}
                        </td>
                        <td className="px-4 py-4 text-sm text-blue-850 truncate max-w-[180px]" title={contact.email || undefined}>
                          {contact.email || "—"}
                        </td>
                        <td className="px-4 py-4 text-sm text-blue-800">{contact.designation || "—"}</td>
                        <td className="px-4 py-4 text-center">
                          {contact.isDefault ? (
                            <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 border border-blue-200">
                              Default
                            </span>
                          ) : (
                            <button
                              onClick={() => handleSetContactDefault(contact.id)}
                              className="text-xs font-bold text-blue-600 hover:text-blue-500 cursor-pointer"
                            >
                              Set Default
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold border ${
                            contact.status === "Active"
                              ? "bg-blue-55/10 text-blue-700 border-blue-200"
                              : "bg-blue-50 text-blue-650 border-blue-200"
                          }`}>
                            {contact.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEditContact(contact)}
                              className="rounded-md border border-blue-200 bg-white hover:bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-800 cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleToggleContactStatus(contact.id)}
                              className={`rounded-md px-3 py-1.5 text-xs font-bold border cursor-pointer ${
                                contact.status === "Active"
                                  ? "bg-red-50 hover:bg-red-100 border-red-200 text-red-700"
                                  : "bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
                              }`}
                            >
                              {contact.status === "Active" ? "Deact" : "Act"}
                            </button>
                            <button
                              onClick={() => handleDeleteContact(contact.id)}
                              className="rounded-md border border-red-200 bg-red-50 hover:bg-red-100 px-3 py-1.5 text-xs font-bold text-red-700 cursor-pointer"
                            >
                              Del
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ADDRESSES TAB */}
        {detailTab === "addresses" && (
          <div className="flex-1 flex flex-col gap-6">
            <div className="flex justify-between items-center shrink-0">
              <h3 className="text-xl font-bold text-black uppercase tracking-wider">
                Addresses List
              </h3>
              {!isAddressFormOpen && (
                <button
                  onClick={handleOpenAddAddress}
                  className="rounded-lg glossy-button-blue px-5 py-2.5 text-sm font-bold text-white shadow-xs cursor-pointer"
                >
                  Add Address
                </button>
              )}
            </div>

            {isAddressFormOpen ? (
              <form onSubmit={handleAddressSubmit} className="border-b border-blue-200 pb-6 mb-6 space-y-6 w-full">
                <h4 className="text-base font-bold uppercase tracking-wider text-blue-700">
                  {addressEditId ? "Edit Address Details" : "Add New Address"}
                </h4>
                {addressFormError && (
                  <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-800">
                    {addressFormError}
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-blue-655">Address Details <span className="text-red-500">*</span></label>
                  <textarea
                    required
                    rows={3}
                    value={addressText}
                    onChange={(e) => setAddressText(e.target.value)}
                    className="rounded-lg glossy-input px-4 py-3 text-base resize-none w-full"
                    placeholder="Enter full physical address..."
                  />
                </div>
                {!addressEditId && (
                  <div className="flex items-center gap-3 pt-2">
                    <input
                      type="checkbox"
                      id="manageAddressDefault"
                      checked={addressIsDefault}
                      onChange={(e) => setAddressIsDefault(e.target.checked)}
                      className="h-5 w-5 rounded border-blue-300 text-blue-600 cursor-pointer"
                    />
                    <label htmlFor="manageAddressDefault" className="text-sm font-semibold text-blue-700 cursor-pointer select-none">
                      Set as Default Address
                    </label>
                  </div>
                )}
                <div className="flex items-center gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddressFormOpen(false)}
                    className="rounded-lg glossy-button-white px-5 py-2.5 text-sm font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="rounded-lg glossy-button-blue px-5 py-2.5 text-sm font-bold text-white cursor-pointer"
                  >
                    Save Address
                  </button>
                </div>
              </form>
            ) : supplierDetail.addresses.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-dashed border-blue-200 rounded-lg">
                <p className="text-base font-semibold text-blue-800">No addresses defined</p>
                <p className="text-sm text-blue-550 mt-1">Click Add Address to define supplier shipping/billing locations.</p>
              </div>
            ) : (
              <div className="flex-1 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-blue-200 bg-blue-50 font-bold text-blue-700 sticky top-0">
                      <th className="px-4 py-3.5 text-sm font-bold">Address</th>
                      <th className="px-4 py-3.5 text-center text-sm font-bold">Default</th>
                      <th className="px-4 py-3.5 text-center text-sm font-bold">Status</th>
                      <th className="px-4 py-3.5 text-right text-sm font-bold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-blue-100">
                    {supplierDetail.addresses.map((addr) => (
                      <tr key={addr.id} className="hover:bg-blue-50 transition-colors">
                        <td className="px-4 py-4 text-base text-blue-850 whitespace-pre-wrap max-w-lg">
                          {addr.address}
                        </td>
                        <td className="px-4 py-4 text-center">
                          {addr.isDefault ? (
                            <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 border border-blue-200">
                              Default
                            </span>
                          ) : (
                            <button
                              onClick={() => handleSetAddressDefault(addr.id)}
                              className="text-xs font-bold text-blue-600 hover:text-blue-500 cursor-pointer"
                            >
                              Set Default
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold border ${
                            addr.status === "Active"
                              ? "bg-blue-55/10 text-blue-700 border-blue-200"
                              : "bg-blue-50 text-blue-650 border-blue-200"
                          }`}>
                            {addr.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEditAddress(addr)}
                              className="rounded-md border border-blue-200 bg-white hover:bg-blue-55 px-3 py-1.5 text-xs font-semibold text-blue-800 cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleToggleAddressStatus(addr.id)}
                              className={`rounded-md px-3 py-1.5 text-xs font-bold border cursor-pointer ${
                                addr.status === "Active"
                                  ? "bg-red-50 hover:bg-red-100 border-red-200 text-red-700"
                                  : "bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
                              }`}
                            >
                              {addr.status === "Active" ? "Deact" : "Act"}
                            </button>
                            <button
                              onClick={() => handleDeleteAddress(addr.id)}
                              className="rounded-md border border-red-200 bg-red-50 hover:bg-red-100 px-3 py-1.5 text-xs font-bold text-red-700 cursor-pointer"
                            >
                              Del
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
