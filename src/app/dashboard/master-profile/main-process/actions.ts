"use server";

import { prisma } from "@/lib/prisma";

export async function getMainProcessesAction() {
  try {
    const data = await prisma.mainProcess.findMany({
      orderBy: { process: "asc" },
      include: { allowedRoles: { select: { id: true, name: true } } },
    });
    return { success: true, data };
  } catch (error: any) {
    console.error("getMainProcessesAction failed:", error);
    return { success: false, error: error.message || "Failed to fetch data" };
  }
}

export async function createMainProcessAction(data: {
  process: string;
  remark: string | null;
  allowedRoleIds?: string[];
}) {
  try {
    if (!data.process || !data.process.trim()) {
      return { success: false, error: "Process is mandatory" };
    }

    const existing = await prisma.mainProcess.findUnique({
      where: { process: data.process.trim() },
    });

    if (existing) {
      return { success: false, error: "Main process already exists" };
    }

    const created = await prisma.mainProcess.create({
      data: {
        process: data.process.trim(),
        remark: data.remark,
        ...(data.allowedRoleIds && data.allowedRoleIds.length
          ? { allowedRoles: { connect: data.allowedRoleIds.map((id) => ({ id })) } }
          : {}),
      },
    });

    return { success: true, data: created };
  } catch (error: any) {
    console.error("createMainProcessAction failed:", error);
    return { success: false, error: error.message || "Failed to create" };
  }
}

export async function updateMainProcessAction(
  id: string,
  data: {
    remark: string | null;
    allowedRoleIds?: string[];
  }
) {
  try {
    // Process name cannot be changed — only remark and the allowed-role set.
    const updated = await prisma.mainProcess.update({
      where: { id },
      data: {
        remark: data.remark,
        ...(data.allowedRoleIds !== undefined
          ? { allowedRoles: { set: data.allowedRoleIds.map((rid) => ({ id: rid })) } }
          : {}),
      },
    });

    return { success: true, data: updated };
  } catch (error: any) {
    console.error("updateMainProcessAction failed:", error);
    return { success: false, error: error.message || "Failed to update" };
  }
}

export async function toggleMainProcessStatus(id: string) {
  try {
    const existing = await prisma.mainProcess.findUnique({ where: { id } });
    if (!existing) return { success: false, error: "Not found" };

    const newStatus = existing.status === "Active" ? "Inactive" : "Active";
    const updated = await prisma.mainProcess.update({
      where: { id },
      data: { status: newStatus },
    });

    return { success: true, data: updated };
  } catch (error: any) {
    console.error("toggleMainProcessStatus failed:", error);
    return { success: false, error: error.message || "Failed to toggle status" };
  }
}

export async function deleteMainProcessAction(id: string) {
  try {
    await prisma.mainProcess.delete({
      where: { id },
    });

    return { success: true };
  } catch (error: any) {
    console.error("deleteMainProcessAction failed:", error);
    return { success: false, error: error.message || "Failed to delete" };
  }
}
