import { prisma } from "@/lib/prisma";
import { getStockAggregates, onHand } from "@/lib/stock-balance";

/**
 * Material Consumption — the document that issues stock to a work order.
 *
 * Draft is editable and invisible to the stock balance. Submitting freezes the
 * lines and decrements on-hand. Per the spec's no-DELETE rule a submitted
 * document is voided, never removed, which reverses the decrement while leaving
 * the running number in place.
 */
export const CONSUMPTION_STATUSES = ["Draft", "Submitted", "Void"] as const;
export type ConsumptionStatus = (typeof CONSUMPTION_STATUSES)[number];

export interface ConsumptionItemInput {
  stockItemId: string;
  quantity: number | string;
  remark?: string | null;
  sortOrder?: number;
}

export interface ConsumptionInput {
  date: string | Date;
  workOrderNo: string;
  issuedById: string;
  remark?: string | null;
  items: ConsumptionItemInput[];
}

export interface ConsumptionItem {
  id: string;
  stockItemId: string;
  code: string;
  name: string;
  uomName: string;
  itemType: string;
  quantity: number;
  unitCost: number;
  amount: number;
  remark: string | null;
  sortOrder: number;
}

export interface Consumption {
  id: string;
  mcNo: string;
  date: string;
  workOrderNo: string;
  customerName: string;
  issuedById: string;
  issuedByName: string;
  remark: string | null;
  status: ConsumptionStatus;
  totalAmount: number;
  items: ConsumptionItem[];
  createdAt: string;
  updatedAt: string;
}

const INCLUDE = {
  issuedBy: { select: { name: true, code: true } },
  workOrder: { select: { customer: { select: { customerName: true } } } },
  items: {
    orderBy: { sortOrder: "asc" as const },
    include: {
      stockItem: {
        select: {
          itemType: true,
          materialProfile: { select: { partNo: true, description: true } },
          uom: { select: { uomName: true } },
        },
      },
    },
  },
} as const;

function toConsumption(row: any): Consumption {
  const items: ConsumptionItem[] = row.items.map((i: any) => {
    const quantity = Number(i.quantity);
    const unitCost = Number(i.unitCost);
    return {
      id: i.id,
      stockItemId: i.stockItemId,
      code: i.stockItem?.materialProfile?.partNo ?? "",
      name: i.stockItem?.materialProfile?.description ?? "",
      uomName: i.stockItem?.uom?.uomName ?? "",
      itemType: i.stockItem?.itemType ?? "",
      quantity,
      unitCost,
      amount: quantity * unitCost,
      remark: i.remark,
      sortOrder: i.sortOrder,
    };
  });

  return {
    id: row.id,
    mcNo: row.mcNo,
    date: row.date.toISOString(),
    workOrderNo: row.workOrderNo,
    customerName: row.workOrder?.customer?.customerName ?? "",
    issuedById: row.issuedById,
    issuedByName: row.issuedBy ? `${row.issuedBy.name} (${row.issuedBy.code})` : "",
    remark: row.remark,
    status: row.status,
    totalAmount: items.reduce((sum, i) => sum + i.amount, 0),
    items,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/**
 * `MC{yy}{00001}`, scoped to the calendar year. Called inside the create
 * transaction; the unique index on `mcNo` is what actually prevents a
 * duplicate if two storekeepers submit in the same millisecond.
 */
async function nextMcNo(tx: any): Promise<string> {
  const yy = String(new Date().getFullYear()).slice(-2);
  const prefix = `MC${yy}`;

  const latest = await tx.materialConsumption.findFirst({
    where: { mcNo: { startsWith: prefix } },
    orderBy: { mcNo: "desc" },
    select: { mcNo: true },
  });

  let next = 1;
  const match = latest?.mcNo?.match(/^MC\d{2}(\d{5})$/);
  if (match) {
    const num = parseInt(match[1], 10);
    if (!isNaN(num)) next = num + 1;
  }

  return `${prefix}${String(next).padStart(5, "0")}`;
}

/** Trimmed, with the required fields proven present. Throws on the first gap. */
function sanitize(data: ConsumptionInput) {
  if (!data.workOrderNo) throw new Error("Work Order is required");
  if (!data.issuedById) throw new Error("Issued By is required");
  if (!data.date) throw new Error("Date is required");

  const items = (data.items ?? []).filter((i) => i.stockItemId);
  if (items.length === 0) throw new Error("At least one item is required");

  // One line per stock item, so a lookup of "how much of X did this doc issue"
  // has a single answer and the over-issue check below cannot be split.
  const seen = new Set<string>();
  for (const item of items) {
    if (seen.has(item.stockItemId)) throw new Error("The same item appears on more than one line");
    seen.add(item.stockItemId);

    if (Number(item.quantity) <= 0) throw new Error("Quantity must be greater than zero");
  }

  return {
    date: new Date(data.date),
    workOrderNo: data.workOrderNo,
    issuedById: data.issuedById,
    remark: data.remark?.trim() || null,
    items: items.map((item, index) => ({
      stockItemId: item.stockItemId,
      quantity: Number(item.quantity),
      remark: item.remark?.trim() || null,
      sortOrder: item.sortOrder ?? index,
    })),
  };
}

/**
 * Refuses to issue more of a material than the store actually holds.
 *
 * Safe to call for a document that is mid-submit: only `Submitted` rows feed
 * `consumedQty`, so a Draft's own lines never count against the stock it is
 * about to claim.
 *
 * `creditDocId` is for the other case — re-saving a document that is already
 * Submitted. Its current lines *do* sit against on-hand, so they are credited
 * back before the new lines are checked; without that, re-saving a document
 * unchanged would look like issuing the same material twice.
 *
 * Reads through `tx` so the check sees the transaction's snapshot. Under READ
 * COMMITTED this still does not serialise two concurrent submits of the same
 * material — both could pass and drive stock negative. Locking the stock rows
 * would fix that; it has not been needed at this site's volume.
 */
async function assertSufficientStock(
  tx: any,
  items: { stockItemId: string; quantity: number }[],
  creditDocId?: string,
) {
  const stockItems = await tx.stockItem.findMany({
    where: { id: { in: items.map((i) => i.stockItemId) } },
    select: {
      id: true,
      openingStock: true,
      materialProfileId: true,
      materialProfile: { select: { partNo: true, description: true } },
    },
  });
  if (stockItems.length !== items.length) throw new Error("One or more items no longer exist");

  const byId = new Map(stockItems.map((s: any) => [s.id, s]));
  const aggregates = await getStockAggregates(
    stockItems.map((s: any) => s.materialProfileId),
    tx,
  );
  const credited = await creditedQuantities(tx, creditDocId);

  const shortfalls: string[] = [];
  for (const line of items) {
    const stock: any = byId.get(line.stockItemId);
    const agg = aggregates.get(stock.materialProfileId);
    const balance =
      (agg ? onHand(agg, Number(stock.openingStock)) : Number(stock.openingStock)) +
      (credited.get(stock.materialProfileId) ?? 0);
    if (line.quantity > balance) {
      const label = stock.materialProfile?.partNo || stock.materialProfile?.description || line.stockItemId;
      shortfalls.push(`${label} (on hand ${balance}, issuing ${line.quantity})`);
    }
  }

  if (shortfalls.length > 0) {
    throw new Error(`Not enough stock to issue: ${shortfalls.join("; ")}`);
  }
}

/**
 * What a still-Submitted document is currently holding, per material profile.
 * Empty for a Draft (it holds nothing) and for no document at all.
 */
async function creditedQuantities(tx: any, docId?: string): Promise<Map<string, number>> {
  const credited = new Map<string, number>();
  if (!docId) return credited;

  const lines = await tx.materialConsumptionItem.findMany({
    where: {
      materialConsumptionId: docId,
      materialConsumption: { status: "Submitted" },
    },
    select: { quantity: true, stockItem: { select: { materialProfileId: true } } },
  });

  for (const line of lines) {
    const matId = line.stockItem?.materialProfileId;
    if (!matId) continue;
    credited.set(matId, (credited.get(matId) ?? 0) + Number(line.quantity));
  }
  return credited;
}

/** Snapshots each line's unit cost so later re-pricing cannot rewrite job cost. */
async function withUnitCost(tx: any, items: { stockItemId: string; quantity: number; remark: string | null; sortOrder: number }[]) {
  const stockItems = await tx.stockItem.findMany({
    where: { id: { in: items.map((i) => i.stockItemId) } },
    select: { id: true, unitCost: true },
  });
  const costById = new Map<string, number>(
    stockItems.map((s: any) => [s.id as string, Number(s.unitCost)]),
  );
  return items.map((i) => ({ ...i, unitCost: costById.get(i.stockItemId) ?? 0 }));
}

export async function getConsumptions(search = "", status = ""): Promise<Consumption[]> {
  const rows = await prisma.materialConsumption.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { mcNo: { contains: search, mode: "insensitive" as const } },
              { workOrderNo: { contains: search, mode: "insensitive" as const } },
              { remark: { contains: search, mode: "insensitive" as const } },
              { issuedBy: { name: { contains: search, mode: "insensitive" as const } } },
            ],
          }
        : {}),
    },
    include: INCLUDE,
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toConsumption);
}

export async function getConsumption(id: string): Promise<Consumption> {
  const row = await prisma.materialConsumption.findUnique({ where: { id }, include: INCLUDE });
  if (!row) throw new Error("Consumption not found");
  return toConsumption(row);
}

/**
 * Creates a Draft, or a Submitted document when `submit` is set. Stock is only
 * checked and decremented on the submitting path — a Draft holds no stock.
 */
export async function createConsumption(data: ConsumptionInput, submit = false): Promise<Consumption> {
  const clean = sanitize(data);

  const id = await prisma.$transaction(async (tx) => {
    if (submit) await assertSufficientStock(tx, clean.items);

    const items = await withUnitCost(tx, clean.items);
    const doc = await tx.materialConsumption.create({
      data: {
        mcNo: await nextMcNo(tx),
        date: clean.date,
        workOrderNo: clean.workOrderNo,
        issuedById: clean.issuedById,
        remark: clean.remark,
        status: submit ? "Submitted" : "Draft",
      },
      select: { id: true },
    });

    // `createMany` is one INSERT. A nested `create: [...]` would issue one
    // statement per line, concurrently, on the transaction's single connection.
    await tx.materialConsumptionItem.createMany({
      data: items.map((i) => ({ ...i, materialConsumptionId: doc.id })),
    });

    return doc.id;
  });

  // Read back on the pool, not inside the transaction: a deep `include` loads
  // its relations concurrently, which one transaction connection cannot do.
  return getConsumption(id);
}

/**
 * Edits a Draft or a Submitted document. A Draft holds no stock, so its lines
 * are free to change. A Submitted one is already holding stock: the new lines
 * are checked against on-hand with its own current lines credited back, and the
 * balance moves the moment the edit lands.
 *
 * A Void document stays frozen — it is the audit record of a reversal.
 */
export async function updateConsumption(id: string, data: ConsumptionInput): Promise<Consumption> {
  const clean = sanitize(data);

  await prisma.$transaction(async (tx) => {
    const current = await tx.materialConsumption.findUnique({
      where: { id },
      select: { status: true },
    });
    if (!current) throw new Error("Consumption not found");
    if (current.status === "Void") {
      throw new Error("A void consumption cannot be edited. Raise a new one.");
    }

    const submitted = current.status === "Submitted";
    if (submitted) await assertSufficientStock(tx, clean.items, id);

    // A submitted line was priced when it issued; re-pricing it here would
    // rewrite job cost behind the job's back. Only lines new to the document
    // take today's cost.
    const priorCost = new Map<string, number>(
      (
        await tx.materialConsumptionItem.findMany({
          where: { materialConsumptionId: id },
          select: { stockItemId: true, unitCost: true },
        })
      ).map((i: any) => [i.stockItemId as string, Number(i.unitCost)]),
    );

    const items = (await withUnitCost(tx, clean.items)).map((i) =>
      submitted && priorCost.has(i.stockItemId)
        ? { ...i, unitCost: priorCost.get(i.stockItemId)! }
        : i,
    );

    // Lines are replaced wholesale; ids are not addressable from the form.
    await tx.materialConsumptionItem.deleteMany({ where: { materialConsumptionId: id } });
    await tx.materialConsumptionItem.createMany({
      data: items.map((i) => ({ ...i, materialConsumptionId: id })),
    });

    await tx.materialConsumption.update({
      where: { id },
      data: {
        date: clean.date,
        workOrderNo: clean.workOrderNo,
        issuedById: clean.issuedById,
        remark: clean.remark,
      },
      select: { id: true },
    });
  });

  return getConsumption(id);
}

export async function submitConsumption(id: string): Promise<Consumption> {
  await prisma.$transaction(async (tx) => {
    const current = await tx.materialConsumption.findUnique({
      where: { id },
      select: { status: true, items: { select: { stockItemId: true, quantity: true } } },
    });
    if (!current) throw new Error("Consumption not found");
    if (current.status !== "Draft") throw new Error(`This consumption is already ${current.status}`);
    if (current.items.length === 0) throw new Error("Cannot submit a consumption with no items");

    await assertSufficientStock(
      tx,
      current.items.map((i) => ({ stockItemId: i.stockItemId, quantity: Number(i.quantity) })),
    );

    await tx.materialConsumption.update({
      where: { id },
      data: { status: "Submitted" },
      select: { id: true },
    });
  });

  return getConsumption(id);
}

/** Reverses a submitted issue. The document and its running number survive. */
export async function voidConsumption(id: string): Promise<Consumption> {
  const current = await prisma.materialConsumption.findUnique({
    where: { id },
    select: { status: true },
  });
  if (!current) throw new Error("Consumption not found");
  if (current.status === "Void") throw new Error("This consumption is already void");

  await prisma.materialConsumption.update({
    where: { id },
    data: { status: "Void" },
    select: { id: true },
  });
  return getConsumption(id);
}
