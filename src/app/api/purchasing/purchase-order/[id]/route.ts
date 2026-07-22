import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const po = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { sortOrder: "asc" },
          include: {
            poUom: true,
            internalUom: true,
            materialProfile: true,
            woRoutingProcess: {
              include: { mainProcess: true, routingProcess: true }
            },
            masterMainProcess: true,
            masterRoutingProcess: true,
          }
        },
        company: true,
        supplier: true,
        currency: true,
        taxType: true,
        contactPerson: true,
        purchaser: true,
        purchaseRequisition: true,
      },
    });

    if (!po) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(po);
  } catch (e: any) {
    console.error("GET PO error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    return await prisma.$transaction(async (tx) => {
      const exist = await tx.purchaseOrder.findUnique({ where: { id } });
      if (!exist) throw new Error("Not found");
      if (exist.status !== "Draft" && exist.status !== "Rejected") {
        throw new Error("Only Draft or Rejected PO can be edited.");
      }

      await tx.purchaseOrderItem.deleteMany({ where: { purchaseOrderId: exist.id } });

      const updated = await tx.purchaseOrder.update({
        where: { id: exist.id },
        data: {
          date: new Date(body.date),
          companyId: body.companyId,
          supplierId: body.supplierId,
          workOrderNo: body.workOrderNo || null,
          purchaseRequisitionId: body.purchaseRequisitionId || null,
          currencyId: body.currencyId,
          exchangeRate: body.exchangeRate,
          taxTypeId: body.taxTypeId,
          taxRate: body.taxRate,
          amountBeforeTax: body.amountBeforeTax || 0,
          taxAmount: body.taxAmount || 0,
          amountAfterTax: body.amountAfterTax || 0,
          millCertificate: body.millCertificate || false,
          certOfConformance: body.certOfConformance || false,
          contactPersonId: body.contactPersonId,
          telNo: body.telNo || "",
          faxNo: body.faxNo || "",
          mobileNo: body.mobileNo || "",
          email: body.email || "",
          purchaserId: body.purchaserId,
          remark: body.remark || "",
          items: {
            create: (body.items || []).map((it: any, i: number) => ({
              fromMaterialProfile: it.fromMaterialProfile || false,
              material: it.material || "",
              description: it.description || "",
              supplierMaterialNo: it.supplierMaterialNo || "",
              shape: it.shape || "",
              size: it.size || "",
              hardness: it.hardness || null,
              thickness: it.thickness || null,
              quantity: it.quantity || 0,
              poUomId: it.poUomId,
              unitPrice: it.unitPrice || 0,
              amount: it.amount || 0,
              conversion: it.conversion || 1,
              internalUomId: it.internalUomId || null,
              internalQuantity: it.internalQuantity || 0,
              deliveryDate: it.deliveryDate ? new Date(it.deliveryDate) : new Date(),
              remark: it.remark || "",
              materialProfileId: it.materialProfileId || null,
              purchaseRequisitionItemId: it.purchaseRequisitionItemId || null,
              woRoutingProcessId: it.woRoutingProcessId || null,
              masterMainProcessId: it.masterMainProcessId || null,
              masterRoutingProcessId: it.masterRoutingProcessId || null,
              sortOrder: i,
            })),
          },
        },
      });

      return NextResponse.json(updated);
    });
  } catch (e: any) {
    console.error("PUT PO error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const exist = await prisma.purchaseOrder.findUnique({ where: { id } });
    if (!exist) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (exist.status !== "Draft") {
      return NextResponse.json({ error: "Only Draft can be deleted" }, { status: 400 });
    }

    await prisma.purchaseOrder.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("DELETE PO error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
