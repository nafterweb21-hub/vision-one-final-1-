"use server";

import { revalidatePath } from "next/cache";
import {
  getFailureModeProfiles,
  createFailureModeProfile,
  updateFailureModeProfile,
  deleteFailureModeProfile,
} from "@/lib/failure-mode-profiles";

export async function getFailureModeProfileItems() {
  try {
    const data = await getFailureModeProfiles();
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to get failure mode profiles" };
  }
}

export async function createFailureModeProfileItem(formData: FormData) {
  try {
    const failureMode = formData.get("failureMode")?.toString().trim();
    const remark = formData.get("remark")?.toString().trim();

    if (!failureMode) {
      return { success: false, error: "Failure Mode is required" };
    }

    const createdBy = "Admin"; 

    const data = await createFailureModeProfile({ failureMode, remark, createdBy });
    revalidatePath("/dashboard/master-profile/failure-mode");
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create failure mode profile" };
  }
}

export async function updateFailureModeProfileItem(id: string, formData: FormData) {
  try {
    const remark = formData.get("remark")?.toString().trim();
    
    // Failure Mode name is not updatable according to requirements
    const updatedBy = "Admin";

    const data = await updateFailureModeProfile(id, { remark, updatedBy });
    revalidatePath("/dashboard/master-profile/failure-mode");
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update failure mode profile" };
  }
}

export async function toggleFailureModeProfileStatus(id: string) {
  try {
    const items = await getFailureModeProfiles();
    const item = items.find((i: any) => i.id === id);
    if (!item) throw new Error("Not found");

    const newStatus = item.status === "Active" ? "Inactive" : "Active";
    const updatedBy = "Admin";
    await updateFailureModeProfile(id, { status: newStatus, updatedBy });
    revalidatePath("/dashboard/master-profile/failure-mode");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to toggle status" };
  }
}

export async function deleteFailureModeProfileItem(id: string) {
  try {
    const updatedBy = "Admin";
    await deleteFailureModeProfile(id, updatedBy);
    revalidatePath("/dashboard/master-profile/failure-mode");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete failure mode profile" };
  }
}
