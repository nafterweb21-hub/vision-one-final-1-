"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getActiveReworks() {
  const reworks = await prisma.workOrderRework.findMany({
    where: {
      status: {
        in: ["Rework In Progress", "Rework Completed"]
      }
    },
    include: {
      workOrder: {
        include: {
          customer: true
        }
      },
      rejectedBy: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return JSON.parse(JSON.stringify(reworks));
}

export async function startRework(reworkId: string) {
  const rework = await prisma.workOrderRework.update({
    where: { id: reworkId },
    data: {
      status: "Rework In Progress",
      reworkStartTime: new Date()
    }
  });

  await prisma.workOrder.update({
    where: { workOrderNo: rework.workOrderNo },
    data: { status: "WIP" }
  });

  revalidatePath('/dashboard/production/rework');
  revalidatePath('/dashboard/production/work-order');
  revalidatePath('/terminal');
  return { success: true };
}

export async function completeRework(reworkId: string, reworkedQty: number) {
  await prisma.$transaction(async (tx) => {
    // 1. Update Rework task
    const rework = await tx.workOrderRework.update({
      where: { id: reworkId },
      data: {
        status: "Re-inspection Pending",
        reworkedQty: reworkedQty,
        reworkEndTime: new Date()
      }
    });

    // 2. Add the reworkedQty to the WorkOrder's total reworkedQty
    await tx.workOrder.update({
      where: { workOrderNo: rework.workOrderNo },
      data: {
        reworkedQty: { increment: reworkedQty }
      }
    });
  });

  revalidatePath('/dashboard/production/rework');
  revalidatePath('/dashboard/production/work-order');
  revalidatePath('/qc');
  return { success: true };
}
