// Prisma-backed implementations of the legacy "db-fallback" API surface.
// Name kept for import stability; all calls now hit PostgreSQL.
// The MaterialCategory wrappers map external `category`/`remark` to the
// schema's `name`/`description` so existing routes don't need changes.

import { prisma } from "@/lib/prisma";

// ===== Users =====
export async function getUsers() {
  const rows = await prisma.user.findMany({ orderBy: { name: "asc" } });
  return rows.map((u) => ({
    id: u.id,
    name: u.name || "",
    email: u.email,
    status: "Active",
  }));
}

// ===== Approval Level Profiles =====
export async function getApprovalProfiles() {
  const rows = await prisma.approvalLevelProfile.findMany({
    include: { approvers: { include: { user: true } } },
    orderBy: [{ module: "asc" }, { minRange: "asc" }],
  });
  return rows.map((p) => ({
    id: p.id,
    module: p.module,
    actionButton: p.actionButton,
    minRange: p.minRange ? Number(p.minRange) : null,
    maxRange: p.maxRange ? Number(p.maxRange) : null,
    status: p.status,
    approvers: p.approvers.map((a) => ({
      id: a.id,
      userId: a.userId,
      status: a.status,
      user: {
        id: a.user.id,
        name: a.user.name || "",
        email: a.user.email,
        status: "Active",
      },
    })),
  }));
}

export async function saveApprovalProfile(data: {
  id?: string;
  module: string;
  actionButton: string | null;
  minRange: number | null;
  maxRange: number | null;
  status: string;
  approvers: Array<{ userId: string; status: string }>;
}) {
  if (data.id) {
    return prisma.$transaction(async (tx) => {
      await tx.approvalPerson.deleteMany({
        where: { approvalLevelProfileId: data.id },
      });
      return tx.approvalLevelProfile.update({
        where: { id: data.id },
        data: {
          module: data.module,
          actionButton: data.actionButton,
          minRange: data.minRange,
          maxRange: data.maxRange,
          status: data.status,
          approvers: {
            create: data.approvers.map((ap) => ({
              userId: ap.userId,
              status: ap.status,
            })),
          },
        },
        include: { approvers: true },
      });
    });
  }
  return prisma.approvalLevelProfile.create({
    data: {
      module: data.module,
      actionButton: data.actionButton,
      minRange: data.minRange,
      maxRange: data.maxRange,
      status: data.status,
      approvers: {
        create: data.approvers.map((ap) => ({
          userId: ap.userId,
          status: ap.status,
        })),
      },
    },
    include: { approvers: true },
  });
}

export async function toggleApprovalProfileStatus(id: string, status: string) {
  return prisma.approvalLevelProfile.update({ where: { id }, data: { status } });
}

export async function voidApprovalProfile(id: string) {
  return prisma.approvalLevelProfile.update({ where: { id }, data: { status: "Void" } });
}

// ===== Material Categories =====
// External shape uses { category, remark }; schema uses { name, description }.
function fromCategoryRow(row: any) {
  return {
    id: row.id,
    category: row.name,
    remark: row.description,
    status: row.status,
  };
}

export async function getMaterialCategories() {
  const rows = await prisma.materialCategory.findMany({ orderBy: { name: "asc" } });
  return rows.map(fromCategoryRow);
}

export async function saveMaterialCategory(data: {
  id?: string;
  category: string;
  remark: string | null;
  status: string;
}) {
  if (data.id) {
    const updated = await prisma.materialCategory.update({
      where: { id: data.id },
      data: {
        description: data.remark,
        status: data.status,
      },
    });
    return fromCategoryRow(updated);
  }
  const dup = await prisma.materialCategory.findUnique({ where: { name: data.category } });
  if (dup) throw new Error(`Category "${data.category}" already exists.`);

  const created = await prisma.materialCategory.create({
    data: {
      name: data.category,
      description: data.remark,
      status: data.status,
    },
  });
  return fromCategoryRow(created);
}

export async function toggleMaterialCategoryStatus(id: string, status: string) {
  const row = await prisma.materialCategory.update({ where: { id }, data: { status } });
  return fromCategoryRow(row);
}

export async function voidMaterialCategory(id: string) {
  const row = await prisma.materialCategory.update({ where: { id }, data: { status: "Void" } });
  return fromCategoryRow(row);
}

// ===== Material Types =====
export async function getMaterialTypes() {
  return prisma.materialType.findMany({ orderBy: { type: "asc" } });
}

export async function saveMaterialType(data: {
  id?: string;
  type: string;
  remark: string | null;
  status: string;
}) {
  if (data.id) {
    return prisma.materialType.update({
      where: { id: data.id },
      data: { remark: data.remark, status: data.status },
    });
  }
  const dup = await prisma.materialType.findUnique({ where: { type: data.type } });
  if (dup) throw new Error(`Material Type "${data.type}" already exists.`);

  return prisma.materialType.create({
    data: { type: data.type, remark: data.remark, status: data.status },
  });
}

export async function toggleMaterialTypeStatus(id: string, status: string) {
  return prisma.materialType.update({ where: { id }, data: { status } });
}

export async function voidMaterialType(id: string) {
  return prisma.materialType.update({ where: { id }, data: { status: "Void" } });
}

// ===== Main Processes =====
export async function getMainProcesses() {
  return prisma.mainProcess.findMany({ orderBy: { process: "asc" } });
}

export async function saveMainProcess(data: {
  id?: string;
  process: string;
  remark: string | null;
  status: string;
}) {
  if (data.id) {
    return prisma.mainProcess.update({
      where: { id: data.id },
      data: { remark: data.remark, status: data.status },
    });
  }
  const dup = await prisma.mainProcess.findUnique({ where: { process: data.process } });
  if (dup) throw new Error(`Main Process "${data.process}" already exists.`);

  return prisma.mainProcess.create({
    data: { process: data.process, remark: data.remark, status: data.status },
  });
}

export async function toggleMainProcessStatus(id: string, status: string) {
  return prisma.mainProcess.update({ where: { id }, data: { status } });
}

export async function voidMainProcess(id: string) {
  return prisma.mainProcess.update({ where: { id }, data: { status: "Void" } });
}

// ===== Process Profiles =====
export async function getProcessProfiles() {
  const rows = await prisma.processProfile.findMany({
    include: { mainProcess: true },
    orderBy: { routingProcess: "asc" },
  });
  return rows.map((p) => ({ ...p, costPerMinute: Number(p.costPerMinute) }));
}

export async function saveProcessProfile(data: {
  id?: string;
  mainProcessId: string;
  routingProcess: string;
  welding: boolean;
  sprayPainting: boolean;
  machining: boolean;
  costPerMinute: number;
  remark: string | null;
  status: string;
}) {
  if (data.id) {
    return prisma.processProfile.update({
      where: { id: data.id },
      data: {
        mainProcessId: data.mainProcessId,
        welding: data.welding,
        sprayPainting: data.sprayPainting,
        machining: data.machining,
        costPerMinute: data.costPerMinute,
        remark: data.remark,
        status: data.status,
      },
    });
  }
  const dup = await prisma.processProfile.findUnique({
    where: { routingProcess: data.routingProcess },
  });
  if (dup) throw new Error(`Routing Process "${data.routingProcess}" already exists.`);

  return prisma.processProfile.create({
    data: {
      mainProcessId: data.mainProcessId,
      routingProcess: data.routingProcess,
      welding: data.welding,
      sprayPainting: data.sprayPainting,
      machining: data.machining,
      costPerMinute: data.costPerMinute,
      remark: data.remark,
      status: data.status,
    },
  });
}

export async function toggleProcessProfileStatus(id: string, status: string) {
  return prisma.processProfile.update({ where: { id }, data: { status } });
}

export async function voidProcessProfile(id: string) {
  return prisma.processProfile.update({ where: { id }, data: { status: "Void" } });
}

// ===== Welding Types =====
export async function getWeldingTypes() {
  return prisma.weldingTypeProfile.findMany({ orderBy: { type: "asc" } });
}

export async function saveWeldingType(data: {
  id?: string;
  type: string;
  remark: string | null;
  status: string;
}) {
  if (data.id) {
    return prisma.weldingTypeProfile.update({
      where: { id: data.id },
      data: { remark: data.remark, status: data.status },
    });
  }
  const dup = await prisma.weldingTypeProfile.findUnique({ where: { type: data.type } });
  if (dup) throw new Error(`Welding Type "${data.type}" already exists.`);

  return prisma.weldingTypeProfile.create({
    data: { type: data.type, remark: data.remark, status: data.status },
  });
}

export async function toggleWeldingTypeStatus(id: string, status: string) {
  return prisma.weldingTypeProfile.update({ where: { id }, data: { status } });
}

export async function voidWeldingType(id: string) {
  return prisma.weldingTypeProfile.update({ where: { id }, data: { status: "Void" } });
}

// ===== Joint Profiles =====
export async function getJointProfiles() {
  return prisma.jointProfile.findMany({ orderBy: { joint: "asc" } });
}

export async function saveJointProfile(data: {
  id?: string;
  joint: string;
  remark: string | null;
  status: string;
}) {
  if (data.id) {
    return prisma.jointProfile.update({
      where: { id: data.id },
      data: { remark: data.remark, status: data.status },
    });
  }
  const dup = await prisma.jointProfile.findUnique({ where: { joint: data.joint } });
  if (dup) throw new Error(`Joint "${data.joint}" already exists.`);

  return prisma.jointProfile.create({
    data: { joint: data.joint, remark: data.remark, status: data.status },
  });
}

export async function toggleJointProfileStatus(id: string, status: string) {
  return prisma.jointProfile.update({ where: { id }, data: { status } });
}

export async function voidJointProfile(id: string) {
  return prisma.jointProfile.update({ where: { id }, data: { status: "Void" } });
}

// ===== Painting Method Profiles =====
export async function getPaintingMethodProfiles() {
  return prisma.paintingMethodProfile.findMany({ orderBy: { method: "asc" } });
}

export async function savePaintingMethodProfile(data: {
  id?: string;
  method: string;
  remark: string | null;
  status: string;
}) {
  if (data.id) {
    return prisma.paintingMethodProfile.update({
      where: { id: data.id },
      data: { remark: data.remark, status: data.status },
    });
  }
  const dup = await prisma.paintingMethodProfile.findUnique({ where: { method: data.method } });
  if (dup) throw new Error(`Method "${data.method}" already exists.`);

  return prisma.paintingMethodProfile.create({
    data: { method: data.method, remark: data.remark, status: data.status },
  });
}

export async function togglePaintingMethodStatus(id: string, status: string) {
  return prisma.paintingMethodProfile.update({ where: { id }, data: { status } });
}

export async function voidPaintingMethodProfile(id: string) {
  return prisma.paintingMethodProfile.update({ where: { id }, data: { status: "Void" } });
}

// ===== Incoterm Profiles =====
export async function getIncotermProfiles() {
  return prisma.incotermProfile.findMany({ orderBy: { incoterm: "asc" } });
}

export async function saveIncotermProfile(data: {
  id?: string;
  incoterm: string;
  remark: string | null;
  status: string;
}) {
  if (data.id) {
    return prisma.incotermProfile.update({
      where: { id: data.id },
      data: { remark: data.remark, status: data.status },
    });
  }
  const dup = await prisma.incotermProfile.findUnique({ where: { incoterm: data.incoterm } });
  if (dup) throw new Error(`Incoterm "${data.incoterm}" already exists.`);

  return prisma.incotermProfile.create({
    data: { incoterm: data.incoterm, remark: data.remark, status: data.status },
  });
}

export async function toggleIncotermStatus(id: string, status: string) {
  return prisma.incotermProfile.update({ where: { id }, data: { status } });
}

export async function voidIncotermProfile(id: string) {
  return prisma.incotermProfile.update({ where: { id }, data: { status: "Void" } });
}
