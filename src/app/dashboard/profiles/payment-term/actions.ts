"use server";

import { revalidatePath } from "next/cache";
import {
  getPaymentTerms,
  createPaymentTerm,
  updatePaymentTerm,
  deletePaymentTerm,
} from "@/lib/payment-terms";

export async function getPaymentTermItems() {
  try {
    const data = await getPaymentTerms();
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to get payment terms" };
  }
}

export async function createPaymentTermItem(formData: FormData) {
  try {
    const name = formData.get("name")?.toString().trim();
    const daysStr = formData.get("days")?.toString().trim();
    const remark = formData.get("remark")?.toString().trim();

    if (!name) return { success: false, error: "Term is required" };
    if (!daysStr) return { success: false, error: "Day is required" };

    const days = parseInt(daysStr, 10);
    if (isNaN(days)) return { success: false, error: "Day must be a valid number" };

    const data = await createPaymentTerm({ name, days, remark });
    revalidatePath("/dashboard/profiles/payment-term");
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create payment term" };
  }
}

export async function updatePaymentTermItem(id: string, formData: FormData) {
  try {
    const daysStr = formData.get("days")?.toString().trim();
    const remark = formData.get("remark")?.toString().trim();
    
    // name is not updatable according to requirements
    const updates: any = { remark };
    
    if (daysStr) {
      const days = parseInt(daysStr, 10);
      if (!isNaN(days)) {
        updates.days = days;
      }
    }

    const data = await updatePaymentTerm(id, updates);
    revalidatePath("/dashboard/profiles/payment-term");
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update payment term" };
  }
}

export async function togglePaymentTermStatus(id: string) {
  try {
    const items = await getPaymentTerms();
    const item = items.find((i: any) => i.id === id);
    if (!item) throw new Error("Not found");

    const newStatus = item.status === "Active" ? "Inactive" : "Active";
    await updatePaymentTerm(id, { status: newStatus });
    revalidatePath("/dashboard/profiles/payment-term");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to toggle status" };
  }
}

export async function deletePaymentTermItem(id: string) {
  try {
    await deletePaymentTerm(id);
    revalidatePath("/dashboard/profiles/payment-term");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete payment term" };
  }
}
