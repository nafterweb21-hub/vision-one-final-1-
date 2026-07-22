"use server";

import { revalidatePath } from "next/cache";
import {
  getDesignationProfiles,
  createDesignationProfile,
  updateDesignationProfile,
  deleteDesignationProfile,
} from "@/lib/designation-profiles";

export async function getDesignationProfileItems() {
  try {
    const data = await getDesignationProfiles();
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to get designation profiles" };
  }
}

export async function createDesignationProfileItem(formData: FormData) {
  try {
    const designation = formData.get("designation")?.toString().trim();
    const remark = formData.get("remark")?.toString().trim();

    if (!designation) {
      return { success: false, error: "Designation is required" };
    }

    const createdBy = "Admin"; 

    const data = await createDesignationProfile({ designation, remark, createdBy });
    revalidatePath("/dashboard/master-profile/designation");
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create designation profile" };
  }
}

export async function updateDesignationProfileItem(id: string, formData: FormData) {
  try {
    const designation = formData.get("designation")?.toString().trim();
    const remark = formData.get("remark")?.toString().trim();
    
    if (!designation) {
      return { success: false, error: "Designation is required" };
    }

    const updatedBy = "Admin";

    const data = await updateDesignationProfile(id, { designation, remark, updatedBy });
    revalidatePath("/dashboard/master-profile/designation");
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update designation profile" };
  }
}

export async function toggleDesignationProfileStatus(id: string) {
  try {
    const items = await getDesignationProfiles();
    const item = items.find((i: any) => i.id === id);
    if (!item) throw new Error("Not found");

    const newStatus = item.status === "Active" ? "Inactive" : "Active";
    const updatedBy = "Admin";
    await updateDesignationProfile(id, { status: newStatus, updatedBy });
    revalidatePath("/dashboard/master-profile/designation");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to toggle status" };
  }
}

export async function deleteDesignationProfileItem(id: string) {
  try {
    const updatedBy = "Admin";
    await deleteDesignationProfile(id, updatedBy);
    revalidatePath("/dashboard/master-profile/designation");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete designation profile" };
  }
}
