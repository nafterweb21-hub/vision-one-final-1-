"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

import { RecordStatus } from "@/lib/status";
/**
 * Fetch all data needed to render the Goods Return form:
 * companies, suppliers, employees, currencies, taxes, and
 * all Submitted GoodsReceives (with their items) for the GR dropdown.
 */
export async function getGoodsReturnFormData() {
  try {
    const [companies, suppliers, employees, currencies, taxes, goodsReceives] =
      await Promise.all([
        prisma.companyProfile.findMany({ where: { status: "Active" } }),
        prisma.supplierProfile.findMany({ where: { status: "Active" } }),
        prisma.employee.findMany({ where: { status: RecordStatus.Active } }),
        prisma.currency.findMany({ where: { status: "Active" } }),
        prisma.taxProfile.findMany({ where: { status: "Active" } }),
        prisma.goodsReceive.findMany({
          where: { status: "Submitted" },
          include: {
            purchaseOrder: true,
            items: {
              include: {
                purchaseOrderItem: {
                  include: {
                    poUom: true,
                    internalUom: true,
                  },
                },
              },
            },
          },
          orderBy: { grNo: "desc" },
        }),
      ]);

    const data = { companies, suppliers, employees, currencies, taxes, goodsReceives };
    return JSON.parse(JSON.stringify(data));
  } catch (error) {
    console.error("Error fetching GoodsReturn form data:", error);
    throw new Error("Failed to load Goods Return form data");
  }
}

export async function submitGoodsReturn(id: string) {
  try {
    await prisma.goodsReturn.update({
      where: { id },
      data: { status: "Submitted" },
    });
    revalidatePath("/dashboard/purchasing/goods-return");
    revalidatePath(`/dashboard/purchasing/goods-return/${id}`);
    return { success: true };
  } catch (error: any) {
    console.error("Error submitting GoodsReturn:", error);
    return { success: false, error: error.message };
  }
}

export async function voidGoodsReturn(id: string) {
  try {
    await prisma.goodsReturn.update({
      where: { id },
      data: { status: "Void" },
    });
    revalidatePath("/dashboard/purchasing/goods-return");
    revalidatePath(`/dashboard/purchasing/goods-return/${id}`);
    return { success: true };
  } catch (error: any) {
    console.error("Error voiding GoodsReturn:", error);
    return { success: false, error: error.message };
  }
}
