"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface TaxProfileInput {
  taxType: string;
  taxRate: number;
}

export async function getTaxProfiles() {
  try {
    const profiles = await prisma.taxProfile.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
    // Serialize Decimals if any, though here they are stored as Floats (Numbers)
    return { success: true, data: profiles };
  } catch (error) {
    console.error("Failed to fetch tax profiles:", error);
    return { success: false, error: "Failed to fetch tax profiles." };
  }
}

export async function createTaxProfile(data: TaxProfileInput) {
  try {
    const taxType = data.taxType.trim();
    const taxRate = Number(data.taxRate);

    if (!taxType) {
      return { success: false, error: "Tax Type is required." };
    }

    if (isNaN(taxRate) || taxRate < 0) {
      return { success: false, error: "Tax Rate must be a valid positive number." };
    }

    // Check uniqueness
    const existing = await prisma.taxProfile.findUnique({
      where: { taxType },
    });

    if (existing) {
      return { success: false, error: `Tax Type "${taxType}" already exists.` };
    }

    const newProfile = await prisma.taxProfile.create({
      data: {
        taxType,
        taxRate,
        status: "Active", // Default Active
      },
    });

    revalidatePath("/dashboard/admin/master-profile/tax");
    return { success: true, data: newProfile };
  } catch (error) {
    console.error("Failed to create tax profile:", error);
    return { success: false, error: (error as Error).message || "Failed to create tax profile." };
  }
}

export async function updateTaxProfileRate(id: string, taxRate: number) {
  try {
    const rate = Number(taxRate);

    if (isNaN(rate) || rate < 0) {
      return { success: false, error: "Tax Rate must be a valid positive number." };
    }

    const existing = await prisma.taxProfile.findUnique({
      where: { id },
    });

    if (!existing) {
      return { success: false, error: "Tax Profile not found." };
    }

    const updatedProfile = await prisma.taxProfile.update({
      where: { id },
      data: {
        taxRate: rate,
      },
    });

    revalidatePath("/dashboard/admin/master-profile/tax");
    return { success: true, data: updatedProfile };
  } catch (error) {
    console.error("Failed to update tax rate:", error);
    return { success: false, error: (error as Error).message || "Failed to update tax rate." };
  }
}

export async function toggleTaxProfileStatus(id: string) {
  try {
    const existing = await prisma.taxProfile.findUnique({
      where: { id },
    });

    if (!existing) {
      return { success: false, error: "Tax Profile not found." };
    }

    const newStatus = existing.status === "Active" ? "Inactive" : "Active";

    const updatedProfile = await prisma.taxProfile.update({
      where: { id },
      data: {
        status: newStatus,
      },
    });

    revalidatePath("/dashboard/admin/master-profile/tax");
    return { success: true, data: updatedProfile };
  } catch (error) {
    console.error("Failed to toggle status:", error);
    return { success: false, error: (error as Error).message || "Failed to toggle status." };
  }
}

export async function deleteTaxProfile(id: string) {
  try {
    const existing = await prisma.taxProfile.findUnique({
      where: { id },
    });

    if (!existing) {
      return { success: false, error: "Tax Profile not found." };
    }

    await prisma.taxProfile.delete({
      where: { id },
    });

    revalidatePath("/dashboard/admin/master-profile/tax");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete tax profile:", error);
    return { success: false, error: (error as Error).message || "Failed to delete tax profile." };
  }
}

