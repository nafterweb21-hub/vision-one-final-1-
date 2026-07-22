"use server";

import { revalidatePath } from "next/cache";
import {
  getWeldingTypes,
  createWeldingType,
  updateWeldingType,
  deleteWeldingType,
} from "@/lib/welding-types";

export async function getWeldingTypeProfiles() {
  try {
    const data = await getWeldingTypes();
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to get welding types" };
  }
}

export async function createWeldingTypeProfile(formData: FormData) {
  try {
    const type = formData.get("type")?.toString().trim();
    const remark = formData.get("remark")?.toString().trim();

    if (!type) {
      return { success: false, error: "Type is required" };
    }

    const data = await createWeldingType({ type, remark });
    revalidatePath("/dashboard/master-profile/welding-type");
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create welding type" };
  }
}

export async function updateWeldingTypeProfile(id: string, formData: FormData) {
  try {
    const remark = formData.get("remark")?.toString().trim();
    
    // Type is not updatable according to requirements
    const data = await updateWeldingType(id, { remark });
    revalidatePath("/dashboard/master-profile/welding-type");
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update welding type" };
  }
}

export async function toggleWeldingTypeStatus(id: string) {
  try {
    const items = await getWeldingTypes();
    const item = items.find((i: any) => i.id === id);
    if (!item) throw new Error("Not found");

    const newStatus = item.status === "Active" ? "Inactive" : "Active";
    await updateWeldingType(id, { status: newStatus });
    revalidatePath("/dashboard/master-profile/welding-type");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to toggle status" };
  }
}

export async function deleteWeldingTypeProfile(id: string) {
  try {
    await deleteWeldingType(id);
    revalidatePath("/dashboard/master-profile/welding-type");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete welding type" };
  }
}
