"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

import { nextDocumentNo, getPreviewNextDocumentNo } from "@/lib/document-numbering";

export interface SupplierProfileInput {
  supplierCode?: string;
  supplierName: string;
  remarks?: string;
}

export interface ContactPersonInput {
  contactPersonName: string;
  telNo?: string;
  mobileNo?: string;
  faxNo?: string;
  email?: string;
  designation?: string;
  isDefault?: boolean;
}

export interface AddressInput {
  address: string;
  isDefault?: boolean;
}

const REVALIDATE_PATH = "/dashboard/admin/master-profile/supplier";

// ==========================================
// SUPPLIER PROFILE CRUD
// ==========================================

export async function getSupplierCodePreview() {
  try {
    return await getPreviewNextDocumentNo("SUPPLIER");
  } catch (error) {
    console.error("Failed to fetch supplier code preview:", error);
    return "";
  }
}

export async function getSupplierProfiles() {
  try {
    const suppliers = await prisma.supplierProfile.findMany({
      include: {
        _count: {
          select: {
            contactPersons: true,
            addresses: true,
          },
        },
      },
      orderBy: { supplierCode: "asc" },
    });
    return { success: true, data: suppliers };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getSupplierDetail(id: string) {
  try {
    const supplier = await prisma.supplierProfile.findUnique({
      where: { id },
      include: {
        contactPersons: { orderBy: { createdAt: "asc" } },
        addresses: { orderBy: { createdAt: "asc" } },
      },
    });
    if (!supplier) return { success: false, error: "Supplier not found." };
    return { success: true, data: supplier };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createSupplierProfile(input: SupplierProfileInput) {
  try {
    const existingName = await prisma.supplierProfile.findUnique({
      where: { supplierName: input.supplierName },
    });
    if (existingName) return { success: false, error: "Supplier Name already exists." };

    await prisma.$transaction(async (tx) => {
      const isTaken = async (code: string) => {
        const existing = await tx.supplierProfile.findUnique({ where: { supplierCode: code } });
        return existing !== null;
      };
      
      const generatedCode = await nextDocumentNo(tx, "SUPPLIER", { isTaken });

      await tx.supplierProfile.create({
        data: {
          supplierCode: generatedCode,
          supplierName: input.supplierName.trim(),
          remarks: input.remarks?.trim() || null,
        },
      });
    });

    revalidatePath(REVALIDATE_PATH);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createSupplierProfileWithDetails(
  supplierData: SupplierProfileInput,
  contactData?: ContactPersonInput,
  addressData?: AddressInput
) {
  try {
    const existingName = await prisma.supplierProfile.findUnique({
      where: { supplierName: supplierData.supplierName },
    });
    if (existingName) return { success: false, error: "Supplier Name already exists." };

    // Create supplier + optional contact person + optional address in one transaction
    await prisma.$transaction(async (tx: any) => {
      const isTaken = async (code: string) => {
        const existing = await tx.supplierProfile.findUnique({ where: { supplierCode: code } });
        return existing !== null;
      };
      
      const generatedCode = await nextDocumentNo(tx, "SUPPLIER", { isTaken });

      const supplier = await tx.supplierProfile.create({
        data: {
          supplierCode: generatedCode,
          supplierName: supplierData.supplierName.trim(),
          remarks: supplierData.remarks?.trim() || null,
        },
      });

      if (contactData && contactData.contactPersonName.trim()) {
        await tx.supplierContactPerson.create({
          data: {
            supplierId: supplier.id,
            contactPersonName: contactData.contactPersonName.trim(),
            telNo: contactData.telNo?.trim() || null,
            mobileNo: contactData.mobileNo?.trim() || null,
            faxNo: contactData.faxNo?.trim() || null,
            email: contactData.email?.trim() || null,
            designation: contactData.designation?.trim() || null,
            isDefault: true,
            status: "Active",
          },
        });
      }

      if (addressData && addressData.address.trim()) {
        await tx.supplierAddress.create({
          data: {
            supplierId: supplier.id,
            address: addressData.address.trim(),
            isDefault: true,
            status: "Active",
          },
        });
      }
    });

    revalidatePath(REVALIDATE_PATH);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}


export async function updateSupplierRemarks(id: string, remarks: string) {
  try {
    await prisma.supplierProfile.update({
      where: { id },
      data: { remarks: remarks.trim() || null },
    });
    revalidatePath(REVALIDATE_PATH);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function toggleSupplierStatus(id: string) {
  try {
    const supplier = await prisma.supplierProfile.findUnique({ where: { id } });
    if (!supplier) return { success: false, error: "Supplier not found." };
    await prisma.supplierProfile.update({
      where: { id },
      data: { status: supplier.status === "Active" ? "Inactive" : "Active" },
    });
    revalidatePath(REVALIDATE_PATH);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteSupplierProfile(id: string) {
  try {
    await prisma.supplierProfile.delete({ where: { id } });
    revalidatePath(REVALIDATE_PATH);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ==========================================
// CONTACT PERSON CRUD
// ==========================================

export async function addContactPerson(supplierId: string, input: ContactPersonInput) {
  try {
    const count = await prisma.supplierContactPerson.count({ where: { supplierId } });
    const isFirst = count === 0;
    const shouldBeDefault = isFirst || !!input.isDefault;

    if (shouldBeDefault && !isFirst) {
      await prisma.supplierContactPerson.updateMany({
        where: { supplierId },
        data: { isDefault: false },
      });
    }

    await prisma.supplierContactPerson.create({
      data: {
        supplierId,
        contactPersonName: input.contactPersonName.trim(),
        telNo: input.telNo?.trim() || null,
        mobileNo: input.mobileNo?.trim() || null,
        faxNo: input.faxNo?.trim() || null,
        email: input.email?.trim() || null,
        designation: input.designation?.trim() || null,
        isDefault: shouldBeDefault,
        status: "Active",
      },
    });
    revalidatePath(REVALIDATE_PATH);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateContactPerson(id: string, input: Omit<ContactPersonInput, "isDefault">) {
  try {
    await prisma.supplierContactPerson.update({
      where: { id },
      data: {
        contactPersonName: input.contactPersonName.trim(),
        telNo: input.telNo?.trim() || null,
        mobileNo: input.mobileNo?.trim() || null,
        faxNo: input.faxNo?.trim() || null,
        email: input.email?.trim() || null,
        designation: input.designation?.trim() || null,
      },
    });
    revalidatePath(REVALIDATE_PATH);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function toggleContactPersonStatus(id: string) {
  try {
    const contact = await prisma.supplierContactPerson.findUnique({ where: { id } });
    if (!contact) return { success: false, error: "Contact person not found." };
    await prisma.supplierContactPerson.update({
      where: { id },
      data: { status: contact.status === "Active" ? "Inactive" : "Active" },
    });
    revalidatePath(REVALIDATE_PATH);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function setContactPersonDefault(id: string, supplierId: string) {
  try {
    await prisma.supplierContactPerson.updateMany({
      where: { supplierId },
      data: { isDefault: false },
    });
    await prisma.supplierContactPerson.update({
      where: { id },
      data: { isDefault: true },
    });
    revalidatePath(REVALIDATE_PATH);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteContactPerson(id: string) {
  try {
    const contact = await prisma.supplierContactPerson.findUnique({ where: { id } });
    if (!contact) return { success: false, error: "Contact person not found." };

    await prisma.supplierContactPerson.delete({ where: { id } });

    // If deleted was default, promote the next one
    if (contact.isDefault) {
      const next = await prisma.supplierContactPerson.findFirst({
        where: { supplierId: contact.supplierId },
        orderBy: { createdAt: "asc" },
      });
      if (next) {
        await prisma.supplierContactPerson.update({
          where: { id: next.id },
          data: { isDefault: true },
        });
      }
    }
    revalidatePath(REVALIDATE_PATH);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ==========================================
// ADDRESS CRUD
// ==========================================

export async function addAddress(supplierId: string, input: AddressInput) {
  try {
    const count = await prisma.supplierAddress.count({ where: { supplierId } });
    const isFirst = count === 0;
    const shouldBeDefault = isFirst || !!input.isDefault;

    if (shouldBeDefault && !isFirst) {
      await prisma.supplierAddress.updateMany({
        where: { supplierId },
        data: { isDefault: false },
      });
    }

    await prisma.supplierAddress.create({
      data: {
        supplierId,
        address: input.address.trim(),
        isDefault: shouldBeDefault,
        status: "Active",
      },
    });
    revalidatePath(REVALIDATE_PATH);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateAddress(id: string, address: string) {
  try {
    await prisma.supplierAddress.update({
      where: { id },
      data: { address: address.trim() },
    });
    revalidatePath(REVALIDATE_PATH);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function toggleAddressStatus(id: string) {
  try {
    const addr = await prisma.supplierAddress.findUnique({ where: { id } });
    if (!addr) return { success: false, error: "Address not found." };
    await prisma.supplierAddress.update({
      where: { id },
      data: { status: addr.status === "Active" ? "Inactive" : "Active" },
    });
    revalidatePath(REVALIDATE_PATH);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function setAddressDefault(id: string, supplierId: string) {
  try {
    await prisma.supplierAddress.updateMany({
      where: { supplierId },
      data: { isDefault: false },
    });
    await prisma.supplierAddress.update({
      where: { id },
      data: { isDefault: true },
    });
    revalidatePath(REVALIDATE_PATH);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteAddress(id: string) {
  try {
    const addr = await prisma.supplierAddress.findUnique({ where: { id } });
    if (!addr) return { success: false, error: "Address not found." };

    await prisma.supplierAddress.delete({ where: { id } });

    // If deleted was default, promote the next one
    if (addr.isDefault) {
      const next = await prisma.supplierAddress.findFirst({
        where: { supplierId: addr.supplierId },
        orderBy: { createdAt: "asc" },
      });
      if (next) {
        await prisma.supplierAddress.update({
          where: { id: next.id },
          data: { isDefault: true },
        });
      }
    }
    revalidatePath(REVALIDATE_PATH);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
