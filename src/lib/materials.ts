import { prisma } from "@/lib/prisma";

export async function getCategories() {
  return prisma.materialCategory.findMany({
    where: { NOT: { status: "Void" } },
    orderBy: { name: "asc" },
  });
}

export async function createCategory(data: { name: string; description?: string | null }) {
  const existing = await prisma.materialCategory.findUnique({ where: { name: data.name } });
  if (existing) throw new Error(`Category "${data.name}" already exists.`);

  return prisma.materialCategory.create({
    data: {
      name: data.name,
      description: data.description || null,
    },
  });
}

export async function getMaterials() {
  return prisma.materialProfile.findMany({
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getMaterialById(id: string) {
  return prisma.materialProfile.findUnique({
    where: { id },
    include: { category: true },
  });
}

export async function createMaterial(data: {
  partNo?: string;
  description: string;
  shape: string;
  size?: string;
  categoryId: string;
  remark?: string;
}) {
  return prisma.materialProfile.create({
    data: {
      partNo: data.partNo || null,
      description: data.description,
      shape: data.shape,
      size: data.size || null,
      categoryId: data.categoryId,
      remark: data.remark || null,
    },
  });
}

export async function updateMaterial(
  id: string,
  data: {
    shape?: string;
    size?: string | null;
    categoryId?: string;
    remark?: string | null;
    status?: string;
  }
) {
  return prisma.materialProfile.update({
    where: { id },
    data: {
      shape: data.shape,
      size: data.size !== undefined ? data.size : undefined,
      categoryId: data.categoryId,
      remark: data.remark !== undefined ? data.remark : undefined,
      status: data.status,
    },
  });
}

/**
 * A material referenced by a document cannot be removed — the foreign key would
 * reject it anyway, but with an opaque error. Name the blockers instead.
 */
export async function deleteMaterial(id: string) {
  const [poLines, prLines, stockItem] = await Promise.all([
    prisma.purchaseOrderItem.count({ where: { materialProfileId: id } }),
    prisma.purchaseRequisitionItem.count({ where: { materialProfileId: id } }),
    prisma.stockItem.findUnique({ where: { materialProfileId: id }, select: { itemType: true } }),
  ]);

  const blockers: string[] = [];
  if (poLines > 0) blockers.push(`${poLines} purchase order line${poLines > 1 ? "s" : ""}`);
  if (prLines > 0) blockers.push(`${prLines} purchase requisition line${prLines > 1 ? "s" : ""}`);
  if (stockItem) {
    blockers.push(stockItem.itemType === "RAW_MATERIAL" ? "a raw material record" : "a consumable record");
  }

  if (blockers.length > 0) {
    throw new Error(`This material is used by ${blockers.join(" and ")}, so it cannot be deleted.`);
  }

  await prisma.materialProfile.delete({ where: { id } });
  return true;
}
