import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");

    const where = search
      ? {
          OR: [
            { doNo: { contains: search, mode: "insensitive" as const } },
            { customer: { customerName: { contains: search, mode: "insensitive" as const } } },
          ],
        }
      : {};

    const [total, data] = await Promise.all([
      prisma.deliveryOrder.count({ where }),
      prisma.deliveryOrder.findMany({
        where,
        include: {
          customer: { select: { customerName: true } },
          salesOrder: { select: { orderNo: true, customerPoRef: true } },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return NextResponse.json({ total, data, page, pageSize });
  } catch (error: any) {
    console.error("Delivery Order List Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { doNo, date, customerId, salesOrderId, cocRequired, items } = body;

    // Validate if doNo already exists
    const existing = await prisma.deliveryOrder.findUnique({
      where: { doNo },
    });
    if (existing) {
      return NextResponse.json({ error: "Delivery Order No already exists." }, { status: 400 });
    }

    // ── QC Guard: Only allow Completed + QC Approved work orders ──
    if (items && items.length > 0) {
      const workOrderNos = items.map((i: any) => i.workOrderNo).filter(Boolean);
      const invalidWOs = await prisma.workOrder.findMany({
        where: {
          workOrderNo: { in: workOrderNos },
          OR: [
            { status: { not: "Completed" } },
            { qcAcceptance: { not: "Approved" } },
          ],
        },
        select: { workOrderNo: true, status: true, qcAcceptance: true },
      });

      if (invalidWOs.length > 0) {
        const list = invalidWOs.map((w: any) => `${w.workOrderNo} (Status: ${w.status}, QC: ${w.qcAcceptance || "Pending"})`).join(", ");
        return NextResponse.json(
          { error: `Cannot create Delivery Order. The following Work Orders are not QC Approved: ${list}` },
          { status: 400 }
        );
      }
    }

    const newDO = await prisma.deliveryOrder.create({
      data: {
        doNo,
        date: new Date(date),
        customerId,
        salesOrderId,
        cocRequired: !!cocRequired,
        status: "Draft",
        items: {
          create: items.map((item: any) => ({
            workOrderNo: item.workOrderNo,
            quantity: Number(item.quantity),
            uomId: item.uomId || null,
            deliveryDate: item.deliveryDate ? new Date(item.deliveryDate) : null,
          })),
        },
      },
    });

    return NextResponse.json({ success: true, id: newDO.id });
  } catch (error: any) {
    console.error("Create Delivery Order Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
