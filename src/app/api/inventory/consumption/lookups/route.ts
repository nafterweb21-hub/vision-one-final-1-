import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authz";
import { getStockAggregates, onHand } from "@/lib/stock-balance";

import { RecordStatus } from "@/lib/status";
/**
 * Picker options for the Material Consumption form.
 *
 * Unlike `/api/inventory/lookups` this one is module-scoped: it exposes on-hand
 * quantities and unit costs, which are inventory data rather than master-record
 * labels. Anyone allowed to raise a consumption can already see both.
 *
 * A static segment outranks `[id]`, so this never resolves as a document id.
 */
export async function GET() {
  const { error } = await requirePermission("MATERIAL_CONSUMPTION", "v");
  if (error) return error;

  try {
    const [stockRows, workOrders, employees] = await Promise.all([
      prisma.stockItem.findMany({
        where: { status: "Active" },
        select: {
          id: true,
          itemType: true,
          unitCost: true,
          openingStock: true,
          materialProfileId: true,
          materialProfile: { select: { partNo: true, description: true } },
          uom: { select: { uomName: true } },
        },
        orderBy: { materialProfile: { partNo: "asc" } },
      }),
      // A closed or cancelled job should not draw new material.
      prisma.workOrder.findMany({
        where: { status: { notIn: ["Completed", "Cancelled", "Void"] } },
        select: {
          workOrderNo: true,
          jobDescription: true,
          customer: { select: { customerName: true } },
        },
        orderBy: { date: "desc" },
      }),
      // Employee.status is upper-cased, unlike every other master table.
      prisma.employee.findMany({
        where: { status: RecordStatus.Active },
        select: { id: true, name: true, code: true },
        orderBy: { name: "asc" },
      }),
    ]);

    const aggregates = await getStockAggregates(stockRows.map((s) => s.materialProfileId));

    return NextResponse.json({
      stockItems: stockRows.map((s) => {
        const agg = aggregates.get(s.materialProfileId);
        const opening = Number(s.openingStock);
        return {
          id: s.id,
          code: s.materialProfile?.partNo ?? "",
          name: s.materialProfile?.description ?? "",
          label: `${s.materialProfile?.partNo ?? "—"} — ${s.materialProfile?.description ?? ""}`,
          itemType: s.itemType,
          uomName: s.uom?.uomName ?? "",
          unitCost: Number(s.unitCost),
          onHand: agg ? onHand(agg, opening) : opening,
        };
      }),
      workOrders: workOrders.map((w) => ({
        workOrderNo: w.workOrderNo,
        label: w.workOrderNo,
        customerName: w.customer?.customerName ?? "",
        jobDescription: w.jobDescription ?? "",
      })),
      employees: employees.map((e) => ({ id: e.id, label: `${e.name} (${e.code})` })),
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch consumption lookups" },
      { status: 500 },
    );
  }
}
