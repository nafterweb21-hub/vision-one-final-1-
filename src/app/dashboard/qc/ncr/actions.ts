"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { nextDocumentNo } from "@/lib/document-numbering";

export async function getNcrFormData() {
  try {
    const [
      customers,
      employees,
      failureModes,
      mainProcesses,
      workOrders,
      departments,
    ] = await Promise.all([
      prisma.customerProfile.findMany({ where: { status: "Active" }, select: { id: true, customerName: true } }),
      prisma.employee.findMany({ where: { status: "ACTIVE" }, select: { id: true, name: true, code: true } }),
      prisma.failureModeProfile.findMany({ where: { status: "Active", isDeleted: false }, select: { id: true, failureMode: true } }),
      prisma.mainProcess.findMany({ where: { status: "Active" }, select: { id: true, process: true } }),
      prisma.workOrder.findMany({ 
        where: {
          status: { not: "Void" }
        }, 
        select: { 
          workOrderNo: true, 
          customerId: true, 
          quantity: true, 
          inProcesses: { 
            select: { 
              id: true, 
              description: true, 
              routingProcesses: { 
                select: { 
                  id: true, 
                  mainProcessId: true, 
                  routingProcessId: true, 
                  routingProcess: { select: { routingProcess: true } } 
                } 
              } 
            } 
          } 
        } 
      }),
      prisma.departmentProfile.findMany({ where: { status: "Active" }, select: { id: true, name: true } }),
    ]);

    const data = {
      customers,
      employees,
      failureModes,
      mainProcesses,
      workOrders,
      departments,
    };

    return JSON.parse(JSON.stringify(data));
  } catch (error) {
    console.error("Error fetching NCR form data:", error);
    throw new Error("Failed to load NCR prerequisite data");
  }
}

export async function getNcrList() {
  try {
    return await prisma.ncr.findMany({
      include: {
        CustomerProfile: { select: { customerName: true } },
        WorkOrder: { select: { workOrderNo: true } },
        Employee_Ncr_requestorIdToEmployee: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Error fetching NCR list:", error);
    throw new Error("Failed to load NCR list");
  }
}

export async function getNcr(id: string) {
  try {
    return await prisma.ncr.findUnique({
      where: { id },
      include: {
        NcrFailureMode: true,
      },
    });
  } catch (error) {
    console.error("Error fetching NCR:", error);
    throw new Error("Failed to load NCR details");
  }
}

export async function createNcr(data: any) {
  try {
    const { failureModeIds, ...ncrData } = data;

    // The number is taken and the NCR written in one transaction: the counter's
    // row lock only holds for as long as the transaction does.
    const newNcr = await prisma.$transaction(async (tx) => {
      const ncrNo = await nextDocumentNo(tx, "NCR", {
        isTaken: async (no) => (await tx.ncr.count({ where: { ncrNo: no } })) > 0,
      });

      return tx.ncr.create({
        data: {
          ...ncrData,
          id: crypto.randomUUID(), // Assuming cuid/uuid handled by client/DB, but let's provide explicit if @id doesn't default
          ncrNo,
          status: ncrData.status || "Draft",
          NcrFailureMode: {
            create: (failureModeIds || []).map((fmId: string) => ({
              id: crypto.randomUUID(),
              failureModeId: fmId
            }))
          }
        },
      });
    });

    revalidatePath("/dashboard/qc/ncr");
    return newNcr;
  } catch (error: any) {
    console.error("Error creating NCR:", error);
    throw new Error(error.message || "Failed to create NCR");
  }
}

export async function updateNcr(id: string, data: any) {
  try {
    const { failureModeIds, ...ncrData } = data;
    
    // Manage NcrFailureMode relations
    if (failureModeIds) {
      // Delete existing
      await prisma.ncrFailureMode.deleteMany({
        where: { ncrId: id }
      });
      // Add new
      ncrData.NcrFailureMode = {
        create: failureModeIds.map((fmId: string) => ({
          id: crypto.randomUUID(),
          failureModeId: fmId
        }))
      };
    }

    const updatedNcr = await prisma.ncr.update({
      where: { id },
      data: ncrData,
    });

    revalidatePath("/dashboard/qc/ncr");
    revalidatePath(`/dashboard/qc/ncr/${id}`);
    return updatedNcr;
  } catch (error: any) {
    console.error("Error updating NCR:", error);
    throw new Error(error.message || "Failed to update NCR");
  }
}

export async function deleteNcr(id: string) {
  try {
    await prisma.ncr.delete({
      where: { id },
    });
    revalidatePath("/dashboard/qc/ncr");
  } catch (error: any) {
    console.error("Error deleting NCR:", error);
    throw new Error("Failed to delete NCR");
  }
}
