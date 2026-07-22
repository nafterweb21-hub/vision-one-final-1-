"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { checkAndCompleteRoutingProcess } from "@/app/terminal/actions";

export async function getPendingParameters() {
  const commonWhere = {
    status: "Pending", // Fetch those created by scanOut
  };

  const [welding, sprayPainting, machining] = await Promise.all([
    prisma.processParameterWelding.findMany({
      where: commonWhere,
      include: {
        timesheet: {
          include: {
            employee: true,
            routingProcess: {
              include: {
                inProcess: {
                  include: {
                    workOrder: {
                      include: {
                        customer: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        typeOfJoint: true,
        weldingMachine: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.processParameterSprayPainting.findMany({
      where: commonWhere,
      include: {
        timesheet: {
          include: {
            employee: true,
            routingProcess: {
              include: {
                inProcess: {
                  include: {
                    workOrder: {
                      include: {
                        customer: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.processParameterMachining.findMany({
      where: commonWhere,
      include: {
        timesheet: {
          include: {
            employee: true,
            routingProcess: {
              include: {
                inProcess: {
                  include: {
                    workOrder: {
                      include: {
                        customer: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        machine: true,
        toolLists: true,
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  console.log("Fetching Pending Confirmation Records...");
  console.log(`Welding: ${welding.length} records`);
  console.log(`Spray Painting: ${sprayPainting.length} records`);
  console.log(`Machining: ${machining.length} records`);

  return {
    welding: JSON.parse(JSON.stringify(welding)),
    sprayPainting: JSON.parse(JSON.stringify(sprayPainting)),
    machining: JSON.parse(JSON.stringify(machining)),
  };
}

export async function getConfirmationOptions() {
  const [employees, elcometers] = await Promise.all([
    prisma.employee.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true, code: true },
      orderBy: { name: "asc" },
    }),
    prisma.elcometerProfile.findMany({
      where: { status: "Active" },
      select: { id: true, serialNo: true },
      orderBy: { serialNo: "asc" },
    }),
  ]);

  return {
    employees,
    elcometers,
  };
}

export async function confirmParameters(
  type: "Welding" | "SprayPainting" | "Machining",
  ids: string[],
  employeeId: string,
  elcometerId?: string
) {
  try {
    const data: any = {
      status: "Confirmed",
      confirmedById: employeeId,
      confirmedDate: new Date(),
    };

    if (type === "SprayPainting" && elcometerId) {
      data.elcometerSerialNoId = elcometerId;
    }

    console.log(`Confirming [${type}] Parameters:`, ids);
    console.log(`Confirmed By: ${employeeId}, Confirmed Date: ${data.confirmedDate.toISOString()}`);

    if (type === "Welding") {
      const params = await prisma.processParameterWelding.findMany({
         where: { id: { in: ids } },
         include: { timesheet: true }
      });
      await prisma.processParameterWelding.updateMany({
        where: { id: { in: ids } },
        data,
      });
      for (const p of params) {
        await checkAndCompleteRoutingProcess(p.timesheet.routingProcessId);
      }
    } else if (type === "SprayPainting") {
      const params = await prisma.processParameterSprayPainting.findMany({
         where: { id: { in: ids } },
         include: { timesheet: true }
      });
      await prisma.processParameterSprayPainting.updateMany({
        where: { id: { in: ids } },
        data,
      });
      for (const p of params) {
        await checkAndCompleteRoutingProcess(p.timesheet.routingProcessId);
      }
    } else if (type === "Machining") {
      const params = await prisma.processParameterMachining.findMany({
         where: { id: { in: ids } },
         include: { timesheet: true }
      });
      await prisma.processParameterMachining.updateMany({
        where: { id: { in: ids } },
        data,
      });
      for (const p of params) {
        await checkAndCompleteRoutingProcess(p.timesheet.routingProcessId);
      }
    }

    revalidatePath("/dashboard/production/process-parameter-confirmation");
    return { success: true };
  } catch (err: any) {
    console.error("confirmParameters error:", err);
    return { success: false, error: err.message || "Failed to confirm parameters" };
  }
}
