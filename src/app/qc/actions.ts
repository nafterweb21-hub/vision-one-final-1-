"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getAwaitingInspection() {
  // Get recently completed production sessions that have Pending parameters
  const timesheets = await prisma.productionTimesheet.findMany({
    where: { 
      timeOut: { not: null },
      qcStatus: "Pending"
    },
    include: {
      employee: true,
      routingProcess: {
        include: {
          routingProcess: true,
          inProcess: {
            include: {
              workOrder: {
                include: { customer: true }
              }
            }
          }
        }
      },
      weldingParameter: true,
      sprayParameter: true,
      machiningParameter: true
    },
    orderBy: { timeOut: 'desc' },
    take: 50
  });

  return JSON.parse(JSON.stringify(timesheets));
}

export async function getActiveWorkOrders() {
  const wos = await prisma.workOrder.findMany({
    where: { status: { in: ["Proceed", "WIP", "Pending for QC", "Completed"] } },
    include: {
      customer: true
    },
    orderBy: { date: 'desc' },
    take: 50
  });
  return JSON.parse(JSON.stringify(wos));
}

export async function submitWorkOrderQc(workOrderNo: string, qcAcceptance: string, remark?: string, employeeId?: string) {
  const status = qcAcceptance === "Approved" ? "Completed" : "WIP";
  
  await prisma.workOrder.update({
    where: { workOrderNo },
    data: {
      qcAcceptance,
      qcDate: new Date(),
      qcById: employeeId || null,
      remark,
      status
    }
  });
  
  revalidatePath('/qc');
  return { success: true };
}

export async function submitProcessQc(timesheetId: string, qcAcceptance: string, remark?: string) {
  await prisma.productionTimesheet.update({
    where: { id: timesheetId },
    data: {
      qcStatus: qcAcceptance,
      qcRemark: remark || null
    }
  });
  
  revalidatePath('/qc');
  return { success: true };
}
