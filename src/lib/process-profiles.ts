import { prisma } from "@/lib/prisma";

export async function getProcessProfiles() {
  const profiles = await prisma.processProfile.findMany({
    include: { mainProcess: true },
    orderBy: { routingProcess: "asc" },
  });
  return profiles.map((p) => ({
    ...p,
    costPerMinute: Number(p.costPerMinute),
  }));
}

export async function getProcessProfileById(id: string) {
  const p = await prisma.processProfile.findUnique({
    where: { id },
    include: { mainProcess: true },
  });
  return p ? { ...p, costPerMinute: Number(p.costPerMinute) } : null;
}

export async function createProcessProfile(data: {
  mainProcessId: string;
  routingProcess: string;
  welding: boolean;
  sprayPainting: boolean;
  machining: boolean;
  costPerMinute: number;
  remark?: string;
}) {
  const existing = await prisma.processProfile.findUnique({
    where: { routingProcess: data.routingProcess },
  });
  if (existing) throw new Error(`Routing Process "${data.routingProcess}" already exists.`);

  return prisma.processProfile.create({
    data: {
      mainProcessId: data.mainProcessId,
      routingProcess: data.routingProcess,
      welding: data.welding,
      sprayPainting: data.sprayPainting,
      machining: data.machining,
      costPerMinute: data.costPerMinute,
      remark: data.remark || null,
      status: "Active",
    },
  });
}

export async function updateProcessProfile(
  id: string,
  data: {
    welding: boolean;
    sprayPainting: boolean;
    machining: boolean;
    costPerMinute: number;
    remark?: string;
    status?: string;
    mainProcessId?: string;
  }
) {
  return prisma.processProfile.update({
    where: { id },
    data: {
      mainProcessId: data.mainProcessId,
      welding: data.welding,
      sprayPainting: data.sprayPainting,
      machining: data.machining,
      costPerMinute: data.costPerMinute,
      remark: data.remark !== undefined ? data.remark : undefined,
      status: data.status,
    },
  });
}

export async function toggleProcessProfileStatus(id: string, status: string) {
  return prisma.processProfile.update({
    where: { id },
    data: { status },
  });
}

export async function deleteProcessProfile(id: string) {
  return prisma.processProfile.delete({
    where: { id },
  });
}

export async function getMainProcesses() {
  return prisma.mainProcess.findMany({
    where: { status: "Active" },
    orderBy: { process: "asc" },
  });
}
