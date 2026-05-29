"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function confirmProcessParameter(formData: FormData) {
  const type = formData.get("type") as string;
  const id = formData.get("id") as string;
  const confirmedById = formData.get("confirmedById") as string;
  const elcometerName = formData.get("elcometerName") as string | null;

  if (!id || !confirmedById || !type) {
    throw new Error("Missing required fields");
  }

  const updateData: any = {
    status: "Confirmed",
    confirmedById,
    confirmedDate: new Date(),
  };

  let timesheetId = "";

  if (type === "welding") {
    const updated = await prisma.processParameterWelding.update({
      where: { id },
      data: updateData,
      select: { timesheetId: true },
    });
    timesheetId = updated.timesheetId;
  } else if (type === "sprayPainting") {
    if (elcometerName) {
      updateData.elcometerName = elcometerName;
    }
    const updated = await prisma.processParameterSprayPainting.update({
      where: { id },
      data: updateData,
      select: { timesheetId: true },
    });
    timesheetId = updated.timesheetId;
  } else if (type === "machining") {
    const updated = await prisma.processParameterMachining.update({
      where: { id },
      data: updateData,
      select: { timesheetId: true },
    });
    timesheetId = updated.timesheetId;
  }

  // Find the next pending timesheet
  const nextPending = await prisma.productionTimesheet.findFirst({
    where: {
      OR: [
        { weldingParameter: { status: "Pending" } },
        { sprayParameter: { status: "Pending" } },
        { machiningParameter: { status: "Pending" } },
      ],
      id: { not: timesheetId },
    },
    orderBy: { createdAt: "desc" },
  });

  revalidatePath("/dashboard/production/process-parameter");
  
  if (nextPending) {
    redirect(`/dashboard/production/process-parameter/${nextPending.id}`);
  } else {
    redirect("/dashboard/production/process-parameter");
  }
}

export async function confirmBulkProcessParameters(formData: FormData) {
  const confirmedById = formData.get("confirmedById") as string;
  const elcometerName = formData.get("elcometerName") as string | null;
  const timesheetIds = formData.getAll("timesheetIds") as string[];

  if (!confirmedById || timesheetIds.length === 0) {
    throw new Error("Missing required fields");
  }

  const updateData: any = {
    status: "Confirmed",
    confirmedById,
    confirmedDate: new Date(),
  };

  const sprayUpdateData: any = { ...updateData };
  if (elcometerName) {
    sprayUpdateData.elcometerName = elcometerName;
  }

  // Find all timesheets
  const timesheets = await prisma.productionTimesheet.findMany({
    where: { id: { in: timesheetIds } },
    include: {
      weldingParameter: true,
      sprayParameter: true,
      machiningParameter: true,
    }
  });

  const weldingIds = timesheets.filter(ts => ts.weldingParameter).map(ts => ts.weldingParameter!.id);
  const sprayIds = timesheets.filter(ts => ts.sprayParameter).map(ts => ts.sprayParameter!.id);
  const machiningIds = timesheets.filter(ts => ts.machiningParameter).map(ts => ts.machiningParameter!.id);

  if (weldingIds.length > 0) {
    await prisma.processParameterWelding.updateMany({
      where: { id: { in: weldingIds } },
      data: updateData,
    });
  }

  if (sprayIds.length > 0) {
    await prisma.processParameterSprayPainting.updateMany({
      where: { id: { in: sprayIds } },
      data: sprayUpdateData,
    });
  }

  if (machiningIds.length > 0) {
    await prisma.processParameterMachining.updateMany({
      where: { id: { in: machiningIds } },
      data: updateData,
    });
  }

  revalidatePath("/dashboard/production/process-parameter");
}
// Force Next.js to recompile this file
