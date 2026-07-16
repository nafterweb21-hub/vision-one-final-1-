import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { nextDocumentNo } from "@/lib/document-numbering";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");

    const where = search
      ? {
          OR: [
            { cocNo: { contains: search, mode: "insensitive" as const } },
            { type: { contains: search, mode: "insensitive" as const } },
            { deliveryOrder: { doNo: { contains: search, mode: "insensitive" as const } } },
            { workOrderNo: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [total, data] = await Promise.all([
      prisma.certificateOfConformity.count({ where }),
      prisma.certificateOfConformity.findMany({
        where,
        include: {
          customer: { select: { customerName: true } },
          deliveryOrder: { select: { doNo: true } },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return NextResponse.json({ total, data, page, pageSize });
  } catch (error: any) {
    console.error("COC List Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
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

    // The unique constraint checking will be handled implicitly by Prisma,
    // or we can handle it directly to provide a better error message.
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
      }
    });

    if (existing) {
      return NextResponse.json({ 
        error: "A Certificate Of Conformity for this combination already exists. Please check constraints." 
      }, { status: 400 });
    }

    // The number is taken and the COC written in one transaction: the counter's
    // row lock only holds for as long as the transaction does.
    const newCoc = await prisma.$transaction(async (tx) => {
      const cocNo = await nextDocumentNo(tx, "CERTIFICATE_OF_CONFORMITY", {
        isTaken: async (no) =>
          (await tx.certificateOfConformity.count({ where: { cocNo: no } })) > 0,
      });

      return tx.certificateOfConformity.create({
      data: {
        cocNo,
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
        status: "Draft",
      },
      });
    });

    return NextResponse.json({ success: true, id: newCoc.id, cocNo: newCoc.cocNo });
  } catch (error: any) {
    console.error("Create COC Error:", error);
    // Return unique constraint error nicely
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Duplicate COC entry based on combination of fields." }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
