import { prisma } from "@/lib/prisma";

export async function getMaterialTypes() {
  return prisma.materialType.findMany({ orderBy: { type: "asc" } });
}

export async function createMaterialType(data: { type: string; remark?: string }) {
  const existing = await prisma.materialType.findUnique({ where: { type: data.type } });
  if (existing) throw new Error("Material type already exists");

  return prisma.materialType.create({
    data: {
      type: data.type,
      remark: data.remark || null,
    },
  });
}

export async function updateMaterialType(
  id: string,
  data: { remark?: string | null; status?: string }
) {
  return prisma.materialType.update({
    where: { id },
    data: {
      remark: data.remark !== undefined ? data.remark : undefined,
      status: data.status,
    },
  });
}

export async function deleteMaterialType(id: string) {
  await prisma.materialType.delete({ where: { id } });
  return true;
}
