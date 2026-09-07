"use server";

import { revalidatePath } from "next/cache";
import {
  getTermsConditions,
  createTermsCondition,
  updateTermsCondition,
  deleteTermsCondition,
} from "@/lib/terms-condition";

export async function getTermsConditionsList() {
  try {
    const data = await getTermsConditions();
    return { success: true, data };
  } catch (error: any) {
    console.error("Error fetching terms and conditions:", error);
    return { success: false, error: "Failed to fetch terms and conditions." };
  }
}

export async function getTermsConditionDetail(id: string) {
  try {
    const data = await getTermsConditions();
    const item = data.find((d: any) => d.id === id);
    if (!item) return { success: false, error: "Profile not found." };
    return { success: true, data: item };
  } catch (error: any) {
    console.error("Error fetching terms and condition detail:", error);
    return { success: false, error: "Failed to fetch details." };
  }
}

export async function createTermsConditionProfile(data: { name: string; content: string; remark?: string }) {
  try {
    const newItem = await createTermsCondition(data);
    revalidatePath("/dashboard/master-profile/terms-condition");
    return { success: true, data: newItem };
  } catch (error: any) {
    console.error("Error creating terms and condition:", error);
    return { success: false, error: error.message || "Failed to create profile." };
  }
}

export async function updateTermsConditionProfile(id: string, data: { name?: string; content?: string; remark?: string; status?: string }) {
  try {
    const updated = await updateTermsCondition(id, data);
    revalidatePath("/dashboard/master-profile/terms-condition");
    return { success: true, data: updated };
  } catch (error: any) {
    console.error("Error updating terms and condition:", error);
    return { success: false, error: error.message || "Failed to update profile." };
  }
}

export async function toggleTermsConditionStatus(id: string) {
  try {
    const items = await getTermsConditions();
    const item = items.find((i: any) => i.id === id);
    if (!item) return { success: false, error: "Profile not found." };

    const newStatus = item.status === "Active" ? "Inactive" : "Active";
    const updated = await updateTermsCondition(id, {
      status: newStatus,
    });
    revalidatePath("/dashboard/master-profile/terms-condition");
    return { success: true, data: updated };
  } catch (error: any) {
    console.error("Error toggling status:", error);
    return { success: false, error: error.message || "Failed to update status." };
  }
}

export async function deleteTermsConditionProfile(id: string) {
  try {
    await deleteTermsCondition(id);
    revalidatePath("/dashboard/master-profile/terms-condition");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting terms and condition:", error);
    return { success: false, error: error.message || "Failed to delete profile." };
  }
}
