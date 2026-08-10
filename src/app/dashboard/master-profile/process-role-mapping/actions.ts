"use server";

import { prisma } from "@/lib/prisma";

export async function getProcessProfilesAction() {
  try {
    const data = await prisma.processProfile.findMany({
      orderBy: { routingProcess: "asc" },
      include: { allowedRoles: { select: { id: true, name: true } } },
    });
    console.log("ProcessProfiles loaded on server:", data);
    return { success: true, data: JSON.parse(JSON.stringify(data)) };
  } catch (error: any) {
    console.error("getProcessProfilesAction failed:", error);
    return { success: false, error: error.message || "Failed to fetch data" };
  }
}

export async function updateProcessProfileAction(
  id: string,
  data: { allowedRoleIds: string[] }
) {
  try {
    const updated = await prisma.processProfile.update({
      where: { id },
      data: {
        allowedRoles: { set: data.allowedRoleIds.map((rid) => ({ id: rid })) },
      },
    });

    return { success: true, data: JSON.parse(JSON.stringify(updated)) };
  } catch (error: any) {
    console.error("updateProcessProfileAction failed:", error);
    return { success: false, error: error.message || "Failed to update roles" };
  }
}
