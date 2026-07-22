import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [customers, salesOrders, workOrders, uoms] = await Promise.all([
      prisma.customerProfile.findMany({
        where: { status: "Active" },
        select: {
          id: true,
          customerName: true,
          customerCode: true,
        },
        orderBy: { customerName: "asc" },
      }),
      prisma.salesOrder.findMany({
        where: {
          status: { not: "Void" },
        },
        select: {
          id: true,
          orderNo: true,
          customerId: true,
          customerPoRef: true,
        },
        orderBy: { orderNo: "asc" },
      }),
      prisma.workOrder.findMany({
        where: {
          status: "Completed",
          qcAcceptance: "Approved",
        },
        select: {
          workOrderNo: true,
          customerId: true,
          quantity: true,
          uom: true,
          deliveryDate: true,
        },
        orderBy: { workOrderNo: "asc" },
      }),
      prisma.uomProfile.findMany({
        where: { status: "Active" },
        select: { id: true, uomName: true },
        orderBy: { uomName: "asc" },
      }),
    ]);

    return NextResponse.json({
      customers,
      salesOrders,
      workOrders,
      uoms,
    });
  } catch (e: any) {
    console.error("Delivery Order form-data error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
