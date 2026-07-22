"use server";

import { revalidatePath } from "next/cache";
import {
  getMaterialTypes,
  createMaterialType,
  updateMaterialType,
  deleteMaterialType,
} from "@/lib/material-types";

export async function getMaterialTypesList() {
  try {
    const data = await getMaterialTypes();
    return { success: true, data };
  } catch (error: any) {
    console.error("Error fetching material types:", error);
    return { success: false, error: "Failed to fetch material types." };
  }
}

export async function getMaterialTypeDetail(id: string) {
  try {
    const data = await getMaterialTypes();
    const item = data.find((d: any) => d.id === id);
    if (!item) return { success: false, error: "Material type not found." };
    return { success: true, data: item };
  } catch (error: any) {
    console.error("Error fetching material type detail:", error);
    return { success: false, error: "Failed to fetch material type details." };
  }
}

export async function createMaterialTypeProfile(data: { type: string; remark?: string }) {
  try {
    const newItem = await createMaterialType(data);
    revalidatePath("/dashboard/master-profile/material-type");
    return { success: true, data: newItem };
  } catch (error: any) {
    console.error("Error creating material type:", error);
    return { success: false, error: error.message || "Failed to create material type." };
  }
}

export async function updateMaterialTypeProfile(id: string, data: { remark?: string; status?: string }) {
  try {
    const updated = await updateMaterialType(id, data);
    revalidatePath("/dashboard/master-profile/material-type");
    return { success: true, data: updated };
  } catch (error: any) {
    console.error("Error updating material type:", error);
    return { success: false, error: error.message || "Failed to update material type." };
  }
}

export async function toggleMaterialTypeStatus(id: string) {
  try {
    const items = await getMaterialTypes();
    const item = items.find((i: any) => i.id === id);
    if (!item) return { success: false, error: "Material type not found." };

    const newStatus = item.status === "Active" ? "Inactive" : "Active";
    const updated = await updateMaterialType(id, {
      status: newStatus,
    });
    revalidatePath("/dashboard/master-profile/material-type");
    return { success: true, data: updated };
  } catch (error: any) {
    console.error("Error toggling material type status:", error);
    return { success: false, error: error.message || "Failed to update status." };
  }
}

export async function deleteMaterialTypeProfile(id: string) {
  try {
    await deleteMaterialType(id);
    revalidatePath("/dashboard/master-profile/material-type");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting material type:", error);
    return { success: false, error: error.message || "Failed to delete material type." };
  }
}
