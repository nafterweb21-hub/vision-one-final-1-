import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const doItem = await prisma.deliveryOrder.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            workOrder: true,
            uom: true,
          }
        },
        cocs: true,
      },
    });

    if (!doItem) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(doItem);
  } catch (error: any) {
    console.error("Get Delivery Order Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { doNo, date, customerId, salesOrderId, cocRequired, items } = body;

    // Check if duplicate DO no
    const existing = await prisma.deliveryOrder.findUnique({ where: { doNo } });
    if (existing && existing.id !== id) {
      return NextResponse.json({ error: "Delivery Order No already exists." }, { status: 400 });
    }

    const current = await prisma.deliveryOrder.findUnique({ where: { id } });
    if (!current) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (current.status !== "Draft") {
      return NextResponse.json({ error: "Only draft Delivery Orders can be updated." }, { status: 400 });
    }

    const updated = await prisma.deliveryOrder.update({
      where: { id },
      data: {
        doNo,
        date: new Date(date),
        customerId,
        salesOrderId,
        cocRequired: !!cocRequired,
        items: {
          deleteMany: {},
          create: items.map((item: any) => ({
            workOrderNo: item.workOrderNo,
            quantity: Number(item.quantity),
            uomId: item.uomId || null,
            deliveryDate: item.deliveryDate ? new Date(item.deliveryDate) : null,
          })),
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Update Delivery Order Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const current = await prisma.deliveryOrder.findUnique({ where: { id } });
    if (!current) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (current.status !== "Draft") {
      return NextResponse.json({ error: "Only draft Delivery Orders can be deleted." }, { status: 400 });
    }

    await prisma.deliveryOrder.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete Delivery Order Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
