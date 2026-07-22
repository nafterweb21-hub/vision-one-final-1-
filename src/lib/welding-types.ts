import { prisma } from "@/lib/prisma";

export async function getWeldingTypes() {
  return prisma.weldingTypeProfile.findMany({ orderBy: { createdAt: "desc" } });
}

export async function createWeldingType(data: { type: string; remark?: string }) {
  const existing = await prisma.weldingTypeProfile.findUnique({ where: { type: data.type } });
  if (existing) throw new Error("Welding type already exists");

  return prisma.weldingTypeProfile.create({
    data: {
      type: data.type,
      remark: data.remark || null,
    },
  });
}

export async function updateWeldingType(
  id: string,
  data: { remark?: string | null; status?: string }
) {
  return prisma.weldingTypeProfile.update({
    where: { id },
    data: {
      remark: data.remark !== undefined ? data.remark : undefined,
      status: data.status,
    },
  });
}

export async function deleteWeldingType(id: string) {
  await prisma.weldingTypeProfile.delete({ where: { id } });
  return true;
}
