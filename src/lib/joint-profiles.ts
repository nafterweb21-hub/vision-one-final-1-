import { prisma } from "@/lib/prisma";

export interface JointProfile {
  id: string;
  joint: string;
  remark: string | null;
  status: string;
  isDeleted: boolean;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

function toJointProfile(item: any): JointProfile {
  return {
    ...item,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

export async function getJointProfiles(): Promise<JointProfile[]> {
  const rows = await prisma.jointProfile.findMany({
    where: { isDeleted: false },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toJointProfile);
}

export async function createJointProfile(data: {
  joint: string;
  remark?: string;
  createdBy?: string;
}): Promise<JointProfile> {
  const existing = await prisma.jointProfile.findFirst({
    where: { joint: data.joint, isDeleted: false },
  });
  if (existing) throw new Error("Joint already exists");

  const created = await prisma.jointProfile.create({
    data: {
      joint: data.joint,
      remark: data.remark || null,
      createdBy: data.createdBy || null,
      updatedBy: data.createdBy || null,
    },
  });
  return toJointProfile(created);
}

export async function updateJointProfile(
  id: string,
  data: { remark?: string | null; status?: string; updatedBy?: string }
): Promise<JointProfile> {
  const updated = await prisma.jointProfile.update({
    where: { id },
    data: {
      remark: data.remark !== undefined ? data.remark : undefined,
      status: data.status,
      updatedBy: data.updatedBy !== undefined ? data.updatedBy : undefined,
    },
  });
  return toJointProfile(updated);
}

export async function deleteJointProfile(id: string, updatedBy?: string) {
  await prisma.jointProfile.update({
    where: { id },
    data: {
      isDeleted: true,
      updatedBy: updatedBy || undefined,
    },
  });
  return true;
}
