import { prisma } from "@/lib/prisma";

export interface FixedAsset {
  id: string;
  assetCode: string;
  assetName: string;
  assetCategory: string;
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  purchaseDate: string | null;
  purchaseCost: number;
  departmentId: string | null;
  departmentName: string | null;
  assignedToId: string | null;
  assignedToName: string | null;
  location: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface FixedAssetInput {
  assetCode: string;
  assetName: string;
  assetCategory: string;
  brand?: string | null;
  model?: string | null;
  serialNumber?: string | null;
  purchaseDate?: string | null;
  purchaseCost?: number;
  departmentId?: string | null;
  assignedToId?: string | null;
  location?: string | null;
  status?: string;
}

/** Assets are retired rather than deactivated, so the vocabulary differs from stock items. */
export const FIXED_ASSET_STATUSES = ["Active", "Under Maintenance", "Disposed", "Inactive"];

const INCLUDE = {
  department: { select: { name: true } },
  assignedTo: { select: { name: true } },
} as const;

function toFixedAsset(item: any): FixedAsset {
  return {
    id: item.id,
    assetCode: item.assetCode,
    assetName: item.assetName,
    assetCategory: item.assetCategory,
    brand: item.brand,
    model: item.model,
    serialNumber: item.serialNumber,
    purchaseDate: item.purchaseDate ? item.purchaseDate.toISOString() : null,
    purchaseCost: Number(item.purchaseCost),
    departmentId: item.departmentId,
    departmentName: item.department?.name ?? null,
    assignedToId: item.assignedToId,
    assignedToName: item.assignedTo?.name ?? null,
    location: item.location,
    status: item.status,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

/** Trimmed, with the required fields proven present. Throws on the first gap. */
function sanitize(data: FixedAssetInput) {
  const assetCode = data.assetCode?.trim();
  const assetName = data.assetName?.trim();
  const assetCategory = data.assetCategory?.trim();

  if (!assetCode) throw new Error("Asset Code is required");
  if (!assetName) throw new Error("Asset Name is required");
  if (!assetCategory) throw new Error("Asset Category is required");

  const purchaseDate = data.purchaseDate ? new Date(data.purchaseDate) : null;
  if (purchaseDate && Number.isNaN(purchaseDate.getTime())) {
    throw new Error("Purchase Date is invalid");
  }

  return {
    assetCode,
    assetName,
    assetCategory,
    brand: data.brand?.trim() || null,
    model: data.model?.trim() || null,
    serialNumber: data.serialNumber?.trim() || null,
    purchaseDate,
    purchaseCost: Number(data.purchaseCost ?? 0),
    departmentId: data.departmentId || null,
    assignedToId: data.assignedToId || null,
    location: data.location?.trim() || null,
    status: FIXED_ASSET_STATUSES.includes(data.status ?? "") ? (data.status as string) : "Active",
  };
}

/** `serialNumber` is unique but nullable, so only guard it when one was supplied. */
async function assertUnique(clean: ReturnType<typeof sanitize>, excludeId?: string) {
  const codeClash = await prisma.fixedAsset.findUnique({ where: { assetCode: clean.assetCode } });
  if (codeClash && codeClash.id !== excludeId) throw new Error("Asset Code already exists");

  if (clean.serialNumber) {
    const serialClash = await prisma.fixedAsset.findUnique({ where: { serialNumber: clean.serialNumber } });
    if (serialClash && serialClash.id !== excludeId) throw new Error("Serial Number already exists");
  }
}

export async function getFixedAssets(search = ""): Promise<FixedAsset[]> {
  const rows = await prisma.fixedAsset.findMany({
    where: search
      ? {
          OR: [
            { assetCode: { contains: search, mode: "insensitive" } },
            { assetName: { contains: search, mode: "insensitive" } },
            { assetCategory: { contains: search, mode: "insensitive" } },
            { brand: { contains: search, mode: "insensitive" } },
            { model: { contains: search, mode: "insensitive" } },
            { serialNumber: { contains: search, mode: "insensitive" } },
            { location: { contains: search, mode: "insensitive" } },
            { department: { name: { contains: search, mode: "insensitive" } } },
            { assignedTo: { name: { contains: search, mode: "insensitive" } } },
          ],
        }
      : undefined,
    include: INCLUDE,
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toFixedAsset);
}

export async function getFixedAsset(id: string): Promise<FixedAsset | null> {
  const row = await prisma.fixedAsset.findUnique({ where: { id }, include: INCLUDE });
  return row ? toFixedAsset(row) : null;
}

export async function createFixedAsset(data: FixedAssetInput): Promise<FixedAsset> {
  const clean = sanitize(data);
  await assertUnique(clean);

  const created = await prisma.fixedAsset.create({ data: clean, include: INCLUDE });
  return toFixedAsset(created);
}

export async function updateFixedAsset(id: string, data: FixedAssetInput): Promise<FixedAsset> {
  const clean = sanitize(data);
  await assertUnique(clean, id);

  const updated = await prisma.fixedAsset.update({ where: { id }, data: clean, include: INCLUDE });
  return toFixedAsset(updated);
}

export async function toggleFixedAssetStatus(id: string): Promise<FixedAsset> {
  const current = await prisma.fixedAsset.findUnique({ where: { id } });
  if (!current) throw new Error("Fixed Asset not found");

  const updated = await prisma.fixedAsset.update({
    where: { id },
    data: { status: current.status === "Active" ? "Inactive" : "Active" },
    include: INCLUDE,
  });
  return toFixedAsset(updated);
}

export async function deleteFixedAsset(id: string) {
  await prisma.fixedAsset.delete({ where: { id } });
  return true;
}
