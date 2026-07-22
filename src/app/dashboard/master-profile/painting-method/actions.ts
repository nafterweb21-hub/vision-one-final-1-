"use server";

import { revalidatePath } from "next/cache";
import {
  getPaintingMethods,
  createPaintingMethod,
  updatePaintingMethod,
  deletePaintingMethod,
} from "@/lib/painting-methods";

export async function getPaintingMethodProfiles() {
  try {
    const data = await getPaintingMethods();
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to get painting methods" };
  }
}

export async function createPaintingMethodProfile(formData: FormData) {
  try {
    const method = formData.get("method")?.toString().trim();
    const remark = formData.get("remark")?.toString().trim();

    if (!method) {
      return { success: false, error: "Painting Method is required" };
    }

    const data = await createPaintingMethod({ method, remark });
    revalidatePath("/dashboard/master-profile/painting-method");
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create painting method" };
  }
}

export async function updatePaintingMethodProfile(id: string, formData: FormData) {
  try {
    const remark = formData.get("remark")?.toString().trim();
    
    // Method is not updatable according to requirements
    const data = await updatePaintingMethod(id, { remark });
    revalidatePath("/dashboard/master-profile/painting-method");
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update painting method" };
  }
}

export async function togglePaintingMethodStatus(id: string) {
  try {
    const items = await getPaintingMethods();
    const item = items.find((i: any) => i.id === id);
    if (!item) throw new Error("Not found");

    const newStatus = item.status === "Active" ? "Inactive" : "Active";
    await updatePaintingMethod(id, { status: newStatus });
    revalidatePath("/dashboard/master-profile/painting-method");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to toggle status" };
  }
}

export async function deletePaintingMethodProfile(id: string) {
  try {
    await deletePaintingMethod(id);
    revalidatePath("/dashboard/master-profile/painting-method");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete painting method" };
  }
}
