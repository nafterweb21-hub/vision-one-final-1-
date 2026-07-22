"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createReceipt, updateReceipt, transitionReceipt, ReceiptInput, ReceiptAction } from "@/lib/receipts";

export async function getReceipts() {
  try {
    const receipts = await prisma.receipt.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { customerName: true } },
        invoice: { select: { invoiceNo: true } },
        currency: { select: { code: true } },
      },
    });
    return { success: true, data: JSON.parse(JSON.stringify(receipts)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getReceipt(id: string) {
  try {
    const receipt = await prisma.receipt.findUnique({
      where: { id },
      include: {
        company: true,
        customer: true,
        invoice: true,
        currency: true,
        creator: true,
      },
    });
    if (!receipt) throw new Error("Receipt not found");
    return { success: true, data: JSON.parse(JSON.stringify(receipt)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getReceiptFormData() {
  try {
    const [companies, customers, currencies, employees, invoices] = await Promise.all([
      prisma.companyProfile.findMany({ where: { status: "Active" } }),
      prisma.customerProfile.findMany({ where: { status: "Active" } }),
      prisma.currency.findMany({ where: { status: "Active" } }),
      prisma.employee.findMany({ where: { status: "ACTIVE" }, include: { user: true } }),
      prisma.invoice.findMany({
        where: {
          status: { in: ["Submitted", "Partially Paid"] },
        },
        include: {
          currency: true,
          customer: true,
        },
      }),
    ]);

    return {
      success: true,
      data: JSON.parse(
        JSON.stringify({
          companies,
          customers,
          currencies,
          employees,
          invoices,
        }),
      ),
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createReceiptAction(data: ReceiptInput & { creatorId: string }) {
  try {
    const receipt = await createReceipt(data);
    revalidatePath("/dashboard/sales/receipt");
    return { success: true, data: JSON.parse(JSON.stringify(receipt)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateReceiptAction(id: string, data: ReceiptInput) {
  try {
    const receipt = await updateReceipt(id, data);
    revalidatePath("/dashboard/sales/receipt");
    return { success: true, data: JSON.parse(JSON.stringify(receipt)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function transitionReceiptAction(id: string, action: ReceiptAction) {
  try {
    await transitionReceipt(id, action);
    revalidatePath("/dashboard/sales/receipt");
    revalidatePath("/dashboard/sales/invoice");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteDraftReceiptAction(id: string) {
  try {
    const receipt = await prisma.receipt.findUnique({ where: { id } });
    if (!receipt) throw new Error("Receipt not found");
    if (receipt.status !== "Draft") throw new Error("Only Draft receipts can be deleted");

    await prisma.receipt.delete({ where: { id } });
    revalidatePath("/dashboard/sales/receipt");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
