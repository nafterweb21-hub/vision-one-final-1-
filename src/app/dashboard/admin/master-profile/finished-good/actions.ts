"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface FinishedGoodProfileInput {
  partNo?: string;
  description: string;
  remark?: string;
}

export async function getFinishedGoodProfiles() {
  try {
    const profiles = await prisma.finishedGoodProfile.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
    return { success: true, data: profiles };
  } catch (error: any) {
    console.error("Failed to fetch finished good profiles:", error);
    return { success: false, error: "Failed to fetch finished good profiles." };
  }
}

export async function createFinishedGoodProfile(data: FinishedGoodProfileInput) {
  try {
    const partNo = data.partNo?.trim() || null;
    const description = data.description.trim();
    const remark = data.remark?.trim() || null;

    if (!description) {
      return { success: false, error: "Description is required." };
    }

    // Check unique partNo if provided
    if (partNo) {
      const existingPart = await prisma.finishedGoodProfile.findUnique({
        where: { partNo },
      });
      if (existingPart) {
        return { success: false, error: `Part No "${partNo}" already exists.` };
      }
    }

    // Check unique description
    const existingDesc = await prisma.finishedGoodProfile.findUnique({
      where: { description },
    });
    if (existingDesc) {
      return { success: false, error: `Description already exists.` };
    }

    const newProfile = await prisma.finishedGoodProfile.create({
      data: {
        partNo,
        description,
        remark,
        status: "Active", // Default Active
      },
    });

    revalidatePath("/dashboard/admin/master-profile/finished-good");
    return { success: true, data: newProfile };
  } catch (error: any) {
    console.error("Failed to create finished good profile:", error);
    return { success: false, error: error.message || "Failed to create finished good profile." };
  }
}

export async function updateFinishedGoodRemark(id: string, remark: string) {
  try {
    const cleanRemark = remark.trim() || null;

    const existing = await prisma.finishedGoodProfile.findUnique({
      where: { id },
    });

    if (!existing) {
      return { success: false, error: "Finished Good Profile not found." };
    }

    const updatedProfile = await prisma.finishedGoodProfile.update({
      where: { id },
      data: {
        remark: cleanRemark,
      },
    });

    revalidatePath("/dashboard/admin/master-profile/finished-good");
    return { success: true, data: updatedProfile };
  } catch (error: any) {
    console.error("Failed to update remark:", error);
    return { success: false, error: error.message || "Failed to update remark." };
  }
}

export async function toggleFinishedGoodStatus(id: string) {
  try {
    const existing = await prisma.finishedGoodProfile.findUnique({
      where: { id },
    });

    if (!existing) {
      return { success: false, error: "Finished Good Profile not found." };
    }

    const newStatus = existing.status === "Active" ? "Inactive" : "Active";

    const updatedProfile = await prisma.finishedGoodProfile.update({
      where: { id },
      data: {
        status: newStatus,
      },
    });

    revalidatePath("/dashboard/admin/master-profile/finished-good");
    return { success: true, data: updatedProfile };
  } catch (error: any) {
    console.error("Failed to toggle status:", error);
    return { success: false, error: error.message || "Failed to toggle status." };
  }
}

export async function deleteFinishedGoodProfile(id: string) {
  try {
    const existing = await prisma.finishedGoodProfile.findUnique({
      where: { id },
    });

    if (!existing) {
      return { success: false, error: "Finished Good Profile not found." };
    }

    await prisma.finishedGoodProfile.delete({
      where: { id },
    });

    revalidatePath("/dashboard/admin/master-profile/finished-good");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete finished good profile:", error);
    return { success: false, error: error.message || "Failed to delete finished good profile." };
  }
}
