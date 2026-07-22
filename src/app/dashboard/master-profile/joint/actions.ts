"use server";

import { revalidatePath } from "next/cache";
import {
  getJointProfiles,
  createJointProfile,
  updateJointProfile,
  deleteJointProfile,
} from "@/lib/joint-profiles";

// Optional: You could fetch the session here to get the actual user name if using NextAuth
// import { auth } from "@/lib/auth";

export async function getJointProfileItems() {
  try {
    const data = await getJointProfiles();
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to get joint profiles" };
  }
}

export async function createJointProfileItem(formData: FormData) {
  try {
    const joint = formData.get("joint")?.toString().trim();
    const remark = formData.get("remark")?.toString().trim();

    if (!joint) {
      return { success: false, error: "Joint Name is required" };
    }

    // Replace with real user later if available
    const createdBy = "Admin"; 

    const data = await createJointProfile({ joint, remark, createdBy });
    revalidatePath("/dashboard/master-profile/joint");
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create joint profile" };
  }
}

export async function updateJointProfileItem(id: string, formData: FormData) {
  try {
    const remark = formData.get("remark")?.toString().trim();
    
    // Joint name is not updatable according to requirements
    const updatedBy = "Admin";

    const data = await updateJointProfile(id, { remark, updatedBy });
    revalidatePath("/dashboard/master-profile/joint");
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update joint profile" };
  }
}

export async function toggleJointProfileStatus(id: string) {
  try {
    const items = await getJointProfiles();
    const item = items.find((i: any) => i.id === id);
    if (!item) throw new Error("Not found");

    const newStatus = item.status === "Active" ? "Inactive" : "Active";
    const updatedBy = "Admin";
    await updateJointProfile(id, { status: newStatus, updatedBy });
    revalidatePath("/dashboard/master-profile/joint");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to toggle status" };
  }
}

export async function deleteJointProfileItem(id: string) {
  try {
    const updatedBy = "Admin";
    // Using soft delete per requirements
    await deleteJointProfile(id, updatedBy);
    revalidatePath("/dashboard/master-profile/joint");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete joint profile" };
  }
}
