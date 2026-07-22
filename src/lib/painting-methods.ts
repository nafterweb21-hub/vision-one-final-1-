import { prisma } from "@/lib/prisma";

export async function getPaintingMethods() {
  return prisma.paintingMethodProfile.findMany({ orderBy: { createdAt: "desc" } });
}

export async function createPaintingMethod(data: { method: string; remark?: string }) {
  const existing = await prisma.paintingMethodProfile.findUnique({
    where: { method: data.method },
  });
  if (existing) throw new Error("Painting method already exists");

  return prisma.paintingMethodProfile.create({
    data: {
      method: data.method,
      remark: data.remark || null,
    },
  });
}

export async function updatePaintingMethod(
  id: string,
  data: { remark?: string | null; status?: string }
) {
  return prisma.paintingMethodProfile.update({
    where: { id },
    data: {
      remark: data.remark !== undefined ? data.remark : undefined,
      status: data.status,
    },
  });
}

export async function deletePaintingMethod(id: string) {
  await prisma.paintingMethodProfile.delete({ where: { id } });
  return true;
}
