import { prisma } from "@/lib/prisma";

export interface FailureModeProfile {
  id: string;
  failureMode: string;
  remark: string | null;
  status: string;
  isDeleted: boolean;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

function toFailureMode(item: any): FailureModeProfile {
  return {
    ...item,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

export async function getFailureModeProfiles(): Promise<FailureModeProfile[]> {
  const rows = await prisma.failureModeProfile.findMany({
    where: { isDeleted: false },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toFailureMode);
}

export async function createFailureModeProfile(data: {
  failureMode: string;
  remark?: string;
  createdBy?: string;
}): Promise<FailureModeProfile> {
  const existing = await prisma.failureModeProfile.findFirst({
    where: { failureMode: data.failureMode, isDeleted: false },
  });
  if (existing) throw new Error("Failure Mode already exists");

  const created = await prisma.failureModeProfile.create({
    data: {
      failureMode: data.failureMode,
      remark: data.remark || null,
      createdBy: data.createdBy || null,
      updatedBy: data.createdBy || null,
    },
  });
  return toFailureMode(created);
}

export async function updateFailureModeProfile(
  id: string,
  data: { remark?: string | null; status?: string; updatedBy?: string }
): Promise<FailureModeProfile> {
  const updated = await prisma.failureModeProfile.update({
    where: { id },
    data: {
      remark: data.remark !== undefined ? data.remark : undefined,
      status: data.status,
      updatedBy: data.updatedBy !== undefined ? data.updatedBy : undefined,
    },
  });
  return toFailureMode(updated);
}

export async function deleteFailureModeProfile(id: string, updatedBy?: string) {
  await prisma.failureModeProfile.update({
    where: { id },
    data: {
      isDeleted: true,
      updatedBy: updatedBy || undefined,
    },
  });
  return true;
}
