"use server";

import { revalidatePath } from "next/cache";
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from "@/lib/departments";

export async function getDepartmentsList() {
  try {
    const data = await getDepartments();
    return { success: true, data };
  } catch (error: any) {
    console.error("Error fetching departments:", error);
    require('fs').writeFileSync('C:\\Users\\khanw\\Desktop\\vs_one\\debug.txt', String(error.message || error));
    return { success: false, error: "Failed to fetch departments." };
  }
}

export async function getDepartmentDetail(id: string) {
  try {
    const data = await getDepartments();
    const item = data.find((d: any) => d.id === id);
    if (!item) return { success: false, error: "Department not found." };
    return { success: true, data: item };
  } catch (error: any) {
    console.error("Error fetching department detail:", error);
    return { success: false, error: "Failed to fetch department details." };
  }
}

export async function createDepartmentProfile(data: { name: string; remark?: string }) {
  try {
    const newItem = await createDepartment(data);
    revalidatePath("/dashboard/master-profile/department");
    return { success: true, data: newItem };
  } catch (error: any) {
    console.error("Error creating department:", error);
    return { success: false, error: error.message || "Failed to create department." };
  }
}

export async function updateDepartmentProfile(id: string, data: { remark?: string; status?: string }) {
  try {
    const updated = await updateDepartment(id, data);
    revalidatePath("/dashboard/master-profile/department");
    return { success: true, data: updated };
  } catch (error: any) {
    console.error("Error updating department:", error);
    return { success: false, error: error.message || "Failed to update department." };
  }
}

export async function toggleDepartmentStatus(id: string) {
  try {
    const items = await getDepartments();
    const item = items.find((i: any) => i.id === id);
    if (!item) return { success: false, error: "Department not found." };

    const newStatus = item.status === "Active" ? "Inactive" : "Active";
    const updated = await updateDepartment(id, {
      status: newStatus,
    });
    revalidatePath("/dashboard/master-profile/department");
    return { success: true, data: updated };
  } catch (error: any) {
    console.error("Error toggling department status:", error);
    return { success: false, error: error.message || "Failed to update status." };
  }
}

export async function deleteDepartmentProfile(id: string) {
  try {
    await deleteDepartment(id);
    revalidatePath("/dashboard/master-profile/department");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting department:", error);
    return { success: false, error: error.message || "Failed to delete department." };
  }
}
