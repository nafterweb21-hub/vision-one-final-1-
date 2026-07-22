import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cocItem = await prisma.certificateOfConformity.findUnique({
      where: { id },
      include: {
        customer: { select: { customerName: true } },
        deliveryOrder: { select: { doNo: true, status: true } },
        workOrder: { select: { quantity: true, uom: true } },
        cocUom: { select: { uomName: true } },
        welder: { select: { name: true } },
        weldingMachine: { select: { machineNo: true, brand: true, model: true } },
        painter: { select: { name: true } },
        paintingMethod: { select: { method: true } },
        checkedBy: { select: { name: true } },
        approvedBy: { select: { name: true } },
      },
    });

    if (!cocItem) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(cocItem);
  } catch (error: any) {
    console.error("Get COC Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const {
      date, type, customerId, deliveryOrderId, workOrderNo, drawingNo,
      cocQuantity, cocUomId,
      // Welding fields
      sanNo, welderId, weldingProcess, weldingMachineId,
      // Spray fields
      partName, partNumber, paintingSanNo, painterId, paintingMethodId, paintingSpecification,
      paintThicknessSpecification, measuredTotalPaintThickness, paintBatchNo, inspectionEquipment,
    } = body;

    const current = await prisma.certificateOfConformity.findUnique({
      where: { id },
      include: { deliveryOrder: true },
    });
    
    if (!current) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    
    if (current.status !== "Draft") {
      return NextResponse.json({ error: "Only draft COCs can be updated." }, { status: 400 });
    }

    if (current.deliveryOrder.status === "Submitted") {
       return NextResponse.json({ error: "Cannot update COC because the associated Delivery Order has already been submitted." }, { status: 400 });
    }

    // Check for duplicates
    const existing = await prisma.certificateOfConformity.findFirst({
      where: {
        deliveryOrderId,
        type,
        workOrderNo,
        welderId: welderId || null,
        painterId: painterId || null,
        partNumber: partNumber || null,
        weldingMachineId: weldingMachineId || null,
        weldingProcess: weldingProcess || null,
        NOT: { id }, // exclude current
      }
    });

    if (existing) {
      return NextResponse.json({ 
        error: "A Certificate Of Conformity for this combination already exists. Please check constraints." 
      }, { status: 400 });
    }

    const updated = await prisma.certificateOfConformity.update({
      where: { id },
      data: {
        date: new Date(date),
        type,
        customerId,
        deliveryOrderId,
        workOrderNo,
        drawingNo: drawingNo || null,
        cocQuantity: Number(cocQuantity),
        cocUomId,
        sanNo: sanNo || null,
        welderId: welderId || null,
        weldingProcess: weldingProcess || null,
        weldingMachineId: weldingMachineId || null,
        partName: partName || null,
        partNumber: partNumber || null,
        paintingSanNo: paintingSanNo || null,
        painterId: painterId || null,
        paintingMethodId: paintingMethodId || null,
        paintingSpecification: paintingSpecification || null,
        paintThicknessSpecification: paintThicknessSpecification || null,
        measuredTotalPaintThickness: measuredTotalPaintThickness || null,
        paintBatchNo: paintBatchNo || null,
        inspectionEquipment: inspectionEquipment || null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Update COC Error:", error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Duplicate COC entry based on combination of fields." }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const current = await prisma.certificateOfConformity.findUnique({
      where: { id },
      include: { deliveryOrder: true },
    });
    
    if (!current) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (current.status !== "Draft") {
      return NextResponse.json({ error: "Only draft COCs can be deleted." }, { status: 400 });
    }

    if (current.deliveryOrder.status === "Submitted") {
      return NextResponse.json({ error: "Cannot delete COC because the associated Delivery Order has already been submitted." }, { status: 400 });
    }

    await prisma.certificateOfConformity.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete COC Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
