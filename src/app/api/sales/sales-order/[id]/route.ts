import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { nextDocumentNo } from "@/lib/document-numbering";
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const order = await prisma.salesOrder.findUnique({
      where: { id },
      include: {
        items: {
          include: { batches: true },
        },
      },
    });

    if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json(order);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { items, status, customerSelection, ...orderDataRest } = body;
    let orderData = { ...orderDataRest };

    // Validation
    if (!orderData.salespersonId) return NextResponse.json({ error: "Salesperson is required" }, { status: 400 });
    if (!customerSelection || (customerSelection.type === "profile" && !customerSelection.profileId) || (customerSelection.type === "freetext" && !customerSelection.freeTextPayload?.customerName)) {
      return NextResponse.json({ error: "Customer is required" }, { status: 400 });
    }
    if (!orderData.paymentTermId) return NextResponse.json({ error: "Payment Term is required" }, { status: 400 });
    if (!orderData.currencyId) return NextResponse.json({ error: "Currency is required" }, { status: 400 });

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "At least one order item is required" }, { status: 400 });
    }

    for (let i = 0; i < items.length; i++) {
      if (!items[i].partId) return NextResponse.json({ error: `Item ${i + 1}: Part No / Description is required` }, { status: 400 });
      if (!items[i].uomId) return NextResponse.json({ error: `Item ${i + 1}: UOM is required` }, { status: 400 });
    }

    // Get current order to check status change
    const currentOrder = await prisma.salesOrder.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!currentOrder) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    let nextRevision = currentOrder.revision;
    // If status changes to Confirmed, increment revision
    if (status === "Confirmed" && currentOrder.status !== "Confirmed") {
      nextRevision += 1;
    }

    const cleanId = (id: any) => (id === "" ? null : id);

    // Delete existing items and recreate to simplify updates
    await prisma.salesOrderItem.deleteMany({
      where: { salesOrderId: id },
    });

    // Prepare items with Work Order Generation if confirmed
    // Prepare items with Work Order Generation if confirmed
    const itemsData = (items || []).map((item: any, index: number) => {
      return {
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
            uploadUrl: null,
            workOrderNo: item.workOrderNo || null,
          }]).map((b: any, bIndex: number) => {
            let woNo = b.workOrderNo;
            if (status === "Confirmed" && !woNo) {
              const itemNumber = String(index + 1).padStart(3, "0");
              const batchNumber = String(bIndex + 1).padStart(2, "0");
              const isSingleBatch = (item.batches || []).length <= 1;
              woNo = isSingleBatch 
                ? `WO-${currentOrder.orderNo}-${itemNumber}` 
                : `WO-${currentOrder.orderNo}-${itemNumber}-${batchNumber}`;
            }

            return {
              quantity: Number(b.quantity) || 0,
              deliveryDate: new Date(b.deliveryDate),
              noRoutingProcess: b.noRoutingProcess || false,
              workOrderNo: woNo || null,
              remark: b.remark || null,
              uploadUrl: b.uploadUrl || null,
            };
          })
        }
      };
    });

    let finalCustomerId = orderData.customerId;
    let finalContactPersonId = cleanId(orderData.contactPersonId);
    let finalDeliverToId = cleanId(orderData.deliverToId);
    let finalBillToId = cleanId(orderData.billToId);

    if (customerSelection) {
      if (customerSelection.type === "profile") {
        finalCustomerId = customerSelection.profileId;
      } else if (customerSelection.type === "freetext") {
        const freeTextData = customerSelection.freeTextPayload || customerSelection.freeTextData;
        
        let customer = await prisma.customerProfile.findUnique({
          where: { customerName: freeTextData.customerName }
        });
        
        if (!customer) {
          const customerCode = await nextDocumentNo(prisma as any, "CUSTOMER", {
            isTaken: async (no) => (await prisma.customerProfile.count({ where: { customerCode: no } })) > 0,
          });
          customer = await prisma.customerProfile.create({
            data: {
              customerCode,
              customerName: freeTextData.customerName,
              gstin: freeTextData.gstin || null,
            }
          });
        }
        finalCustomerId = customer.id;

        if (freeTextData.contactPerson) {
          const cp = await prisma.customerContactPerson.create({
            data: {
              customerId: customer.id,
              contactPersonName: freeTextData.contactPerson,
              email: freeTextData.email || null,
              telNo: freeTextData.phone || null,
              isDefault: true
            }
          });
          finalContactPersonId = cp.id;
        }

        if (freeTextData.address) {
          const addr = await prisma.customerAddress.create({
            data: {
              customerId: customer.id,
              address: freeTextData.address,
              isDefault: true
            }
          });
          finalDeliverToId = addr.id;
          finalBillToId = addr.id;
        }
      }
    }

    const updatedOrder = await prisma.salesOrder.update({
      where: { id },
      data: {
        ...orderData,
        customerId: finalCustomerId!,
        date: new Date(orderData.date),
        orderType: orderData.orderType || "Direct",
        status,
        revision: nextRevision,
        taxTypeId: cleanId(orderData.taxTypeId),
        contactPersonId: finalContactPersonId,
        deliverToId: finalDeliverToId,
        billToId: finalBillToId,
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
          create: itemsData,
        },
      },
      include: { items: true },
    });

    // Do not automatically create Work Orders here.
    // The spec states: "On SO confirmation, a Work Order No is auto-generated per batch 
    // (but the WO must still be created in the Work Order module to start operations)."
    // The 'Outstanding Work' list depends on the Work Order *not* being created yet.

    return NextResponse.json(updatedOrder);
  } catch (error: any) {
    console.error("Sales Order PUT Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
