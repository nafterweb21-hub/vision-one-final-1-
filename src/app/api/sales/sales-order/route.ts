import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";

    const where: any = {};
    if (search) {
      where.OR = [
        { orderNo: { contains: search } },
        { customer: { customerName: { contains: search } } },
      ];
    }
    if (status && status !== "All") {
      where.status = status;
    }

    const orders = await prisma.salesOrder.findMany({
      where,
      include: {
        customer: { select: { customerName: true } },
        salesperson: { select: { name: true } },
        currency: { select: { code: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(orders);
  } catch (error: any) {
    console.error("Sales Order GET Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items, ...orderData } = body;

    // Validation
    if (!orderData.salespersonId) return NextResponse.json({ error: "Salesperson is required" }, { status: 400 });
    if (!orderData.customerId) return NextResponse.json({ error: "Customer is required" }, { status: 400 });
    if (!orderData.paymentTermId) return NextResponse.json({ error: "Payment Term is required" }, { status: 400 });
    if (!orderData.currencyId) return NextResponse.json({ error: "Currency is required" }, { status: 400 });

    if (items && items.length > 0) {
      for (let i = 0; i < items.length; i++) {
        if (!items[i].partId) return NextResponse.json({ error: `Item ${i + 1}: Part No / Description is required` }, { status: 400 });
        if (!items[i].uomId) return NextResponse.json({ error: `Item ${i + 1}: UOM is required` }, { status: 400 });
      }
    }

    // Generate Order No
    const currentYear = new Date().getFullYear();
    const count = await prisma.salesOrder.count({
      where: {
        orderNo: { startsWith: `SO-${currentYear}-` },
      },
    });
    const nextNumber = String(count + 1).padStart(4, "0");
    const orderNo = `SO-${currentYear}-${nextNumber}`;

    // Clean up empty string IDs to null where applicable for relations
    const cleanId = (id: any) => (id === "" ? null : id);

    const status = orderData.status || "Draft";

    const order = await prisma.salesOrder.create({
      data: {
        ...orderData,
        orderNo,
        revision: 0,
        status: status,
        date: new Date(orderData.date),
        taxTypeId: cleanId(orderData.taxTypeId),
        contactPersonId: cleanId(orderData.contactPersonId),
        deliverToId: cleanId(orderData.deliverToId),
        billToId: cleanId(orderData.billToId),
        customerPoRef: orderData.customerPoRef || null,
        projectCode: orderData.projectCode || null,
        otherPaymentDetail: orderData.otherPaymentDetail || null,
        refContract: orderData.refContract || null,
        fax: orderData.fax || null,
        tel: orderData.tel || null,
        email: orderData.email || null,
        remark: orderData.remark || null,
        uploadUrl: orderData.uploadUrl || null,
        items: {
          create: (items || []).map((item: any, i: number) => ({
            partId: item.partId,
            quantity: item.quantity || 0,
            unitPrice: item.unitPrice || 0,
            uomId: item.uomId,
            internalQuotationNo: item.internalQuotationNo || "N/A",
            vendorMaterialNo: item.vendorMaterialNo || null,
            materialSpecification: item.materialSpecification || null,
            estimateNo: item.estimateNo || null,
            remark: item.remark || null,
            uploadUrl: item.uploadUrl || null,
            batches: {
              create: (item.batches && item.batches.length > 0 ? item.batches : [{
                quantity: item.quantity,
                deliveryDate: item.deliveryDate || new Date(),
                noRoutingProcess: item.noRoutingProcess || false,
                remark: null,
                uploadUrl: null
              }]).map((b: any, bIndex: number) => {
                let woNo = null;
                if (status === "Confirmed") {
                  const itemNumber = String(i + 1).padStart(3, "0");
                  const batchNumber = String(bIndex + 1).padStart(2, "0");
                  const isSingleBatch = (item.batches || []).length <= 1;
                  woNo = isSingleBatch 
                    ? `WO-${orderNo}-${itemNumber}` 
                    : `WO-${orderNo}-${itemNumber}-${batchNumber}`;
                }
                return {
                  quantity: Number(b.quantity) || 0,
                  deliveryDate: new Date(b.deliveryDate),
                  noRoutingProcess: b.noRoutingProcess || false,
                  workOrderNo: woNo,
                  remark: b.remark || null,
                  uploadUrl: b.uploadUrl || null,
                };
              })
            }
          })),
        },
      },
      include: { items: true },
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error: any) {
    console.error("Sales Order POST Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
