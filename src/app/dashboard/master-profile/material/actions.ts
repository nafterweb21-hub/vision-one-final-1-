"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/authz";
import {
  getMaterials,
  getMaterialById,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  getCategories,
  createCategory,
} from "@/lib/materials";

export async function getMaterialProfiles() {
  try {
    const materials = await getMaterials();
    return { success: true, data: materials };
  } catch (error: any) {
    console.error("Error fetching materials:", error);
    return { success: false, error: "Failed to fetch materials." };
  }
}

export async function getMaterialDetail(id: string) {
  try {
    const material = await getMaterialById(decodeURIComponent(id));
    if (!material) return { success: false, error: "Material not found." };
    return { success: true, data: material };
  } catch (error: any) {
    console.error("Error fetching material detail:", error);
    return { success: false, error: "Failed to fetch material details." };
  }
}

export async function createMaterialProfile(data: {
  partNo?: string;
  description: string;
  shape: string;
  size?: string;
  categoryId: string;
  remark?: string;
}) {
  try {
    const newMaterial = await createMaterial(data);
    revalidatePath("/dashboard/master-profile/material");
    return { success: true, data: newMaterial };
  } catch (error: any) {
    console.error("Error creating material:", error);
    return { success: false, error: error.message || "Failed to create material." };
  }
}

export async function updateMaterialProfile(id: string, data: {
  shape: string;
  size?: string;
  categoryId: string;
  remark?: string;
}) {
  try {
    const updated = await updateMaterial(id, data);
    revalidatePath("/dashboard/master-profile/material");
    return { success: true, data: updated };
  } catch (error: any) {
    console.error("Error updating material:", error);
    return { success: false, error: error.message || "Failed to update material." };
  }
}

export async function toggleMaterialStatus(id: string) {
  try {
    const materials = await getMaterials();
    const material = materials.find((m: any) => m.id === id);
    if (!material) return { success: false, error: "Material not found." };

    const newStatus = material.status === "Active" ? "Inactive" : "Active";
    const updated = await updateMaterial(id, {
      shape: material.shape,
      categoryId: material.categoryId,
      status: newStatus
    });
    revalidatePath("/dashboard/master-profile/material");
    return { success: true, data: updated };
  } catch (error: any) {
    console.error("Error toggling material status:", error);
    return { success: false, error: error.message || "Failed to update status." };
  }
}

export async function deleteMaterialProfile(id: string) {
  // Server actions post to whatever page invoked them, so `proxy.ts` only ever
  // checked view on that page. Inventory calls this too — enforce the real
  // permission here rather than trusting the caller's route.
  const { error } = await requirePermission("MATERIAL_PROFILE", "d");
  if (error) return { success: false, error: "You do not have permission to delete materials." };

  try {
    await deleteMaterial(id);
    revalidatePath("/dashboard/master-profile/material");
    revalidatePath("/dashboard/inventory");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting material:", error);
    return { success: false, error: error.message || "Failed to delete material." };
  }
}

export async function getMaterialCategories() {
  try {
    const categories = await getCategories();
    return { success: true, data: categories };
  } catch (error: any) {
    console.error("Error fetching categories:", error);
    return { success: false, error: "Failed to fetch categories." };
  }
}

export async function createMaterialCategory(data: {
  name: string;
  description?: string;
}) {
  try {
    const newCategory = await createCategory(data);
    revalidatePath("/dashboard/master-profile/material");
    return { success: true, data: newCategory };
  } catch (error: any) {
    console.error("Error creating category:", error);
    return { success: false, error: error.message || "Failed to create category." };
  }
}
