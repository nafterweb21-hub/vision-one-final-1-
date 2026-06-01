"use server";

import { revalidatePath } from "next/cache";
import {
  getProcessProfiles,
  createProcessProfile,
  updateProcessProfile,
  deleteProcessProfile,
  getMainProcesses,
  getProcessProfileById,
} from "@/lib/process-profiles";

export async function getProcessProfilesAction() {
  try {
    const data = await getProcessProfiles();
    return { success: true, data: JSON.parse(JSON.stringify(data)) };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to get process profiles" };
  }
}

export async function getProcessProfileByIdAction(id: string) {
  try {
    const data = await getProcessProfileById(id);
    if (!data) return { success: false, error: "Not found" };
    return { success: true, data: JSON.parse(JSON.stringify(data)) };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to get process profile" };
  }
}

export async function getMainProcessesAction() {
  try {
    const data = await getMainProcesses();
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to get main processes" };
  }
}

export async function createProcessProfileAction(formData: FormData) {
  try {
    const mainProcessId = formData.get("mainProcessId")?.toString().trim();
    const routingProcess = formData.get("routingProcess")?.toString().trim();
    const costPerMinute = parseFloat(formData.get("costPerMinute")?.toString() || "0");
    const remark = formData.get("remark")?.toString().trim();
    
    const welding = formData.get("welding") === "on";
    const sprayPainting = formData.get("sprayPainting") === "on";
    const machining = formData.get("machining") === "on";

    if (!mainProcessId) return { success: false, error: "Main Process is required" };
    if (!routingProcess) return { success: false, error: "Routing Process is required" };
    if (isNaN(costPerMinute) || costPerMinute < 0) return { success: false, error: "Cost Per Minute must be a valid positive number" };

    const data = await createProcessProfile({
      mainProcessId,
      routingProcess,
      welding,
      sprayPainting,
      machining,
      costPerMinute,
      remark,
    });
    
    revalidatePath("/dashboard/master-profile/process-profile");
    return { success: true, data: JSON.parse(JSON.stringify(data)) };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create process profile" };
  }
}

export async function updateProcessProfileAction(id: string, formData: FormData) {
  try {
    const costPerMinute = parseFloat(formData.get("costPerMinute")?.toString() || "0");
    const remark = formData.get("remark")?.toString().trim();
    
    const welding = formData.get("welding") === "on";
    const sprayPainting = formData.get("sprayPainting") === "on";
    const machining = formData.get("machining") === "on";

    if (isNaN(costPerMinute) || costPerMinute < 0) return { success: false, error: "Cost Per Minute must be a valid positive number" };

    const data = await updateProcessProfile(id, {
      welding,
      sprayPainting,
      machining,
      costPerMinute,
      remark,
    });
    
    revalidatePath("/dashboard/master-profile/process-profile");
    return { success: true, data: JSON.parse(JSON.stringify(data)) };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update process profile" };
  }
}

export async function toggleProcessProfileStatus(id: string) {
  try {
    const item = await getProcessProfileById(id);
    if (!item) throw new Error("Not found");

    const newStatus = item.status === "Active" ? "Inactive" : "Active";
    await updateProcessProfile(id, { 
      welding: item.welding,
      sprayPainting: item.sprayPainting,
      machining: item.machining,
      costPerMinute: Number(item.costPerMinute),
      remark: item.remark || undefined,
      status: newStatus 
    });
    revalidatePath("/dashboard/master-profile/process-profile");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to toggle status" };
  }
}

export async function deleteProcessProfileAction(id: string) {
  try {
    await deleteProcessProfile(id);
    revalidatePath("/dashboard/master-profile/process-profile");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete process profile" };
  }
}
