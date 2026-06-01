import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    
    // We want to return Work Orders that have Purchase Orders with items linked to materials
    // We'll fetch PurchaseOrderItems where purchaseOrder.workOrderNo is not null
    const poItems = await prisma.purchaseOrderItem.findMany({
      where: {
        purchaseOrder: {
          workOrderNo: { not: null, contains: search, mode: 'insensitive' }
        }
      },
      include: {
        purchaseOrder: {
          include: {
            supplier: true,
            workOrder: {
              include: {
                customer: true
              }
            }
          }
        },
        materialProfile: true,
        purchaseRequisitionItem: {
          include: {
            purchaseRequisition: true
          }
        },
        goodsReceiveItems: {
          include: {
            goodsReceive: true
          }
        }
      }
    });

    const woMap = new Map();

    poItems.forEach(item => {
      const woNo = item.purchaseOrder.workOrderNo;
      if (!woNo) return;

      if (!woMap.has(woNo)) {
        woMap.set(woNo, {
          workOrderNo: woNo,
          customer: item.purchaseOrder.workOrder?.customer?.customerName || "",
          salesOrderNo: "", // We might not have a direct link from WorkOrder to SalesOrder in some cases, wait: is salesOrder accessible from workOrder? 
          // Let's assume we can map it if there is one. 
          date: item.purchaseOrder.workOrder?.date || null,
          items: []
        });
      }

      const woData = woMap.get(woNo);
      
      const receivedQty = item.goodsReceiveItems
        .filter(gr => gr.goodsReceive.status === "Submitted")
        .reduce((sum, gr) => sum + Number(gr.receiveQty || 0), 0);
      
      const poQty = Number(item.quantity || 0);
      const outstandingQty = poQty - receivedQty;
      const unitPrice = Number(item.unitPrice || 0);
      const exchangeRate = Number(item.purchaseOrder.exchangeRate || 1);
      const unitPriceSgd = unitPrice * exchangeRate;

      woData.items.push({
        id: item.id,
        partNo: item.materialProfile?.partNo || item.material || "",
        description: item.materialProfile?.description || item.description || "",
        prNo: item.purchaseRequisitionItem?.purchaseRequisition?.prNo || "",
        poNo: item.purchaseOrder.poNo || "",
        supplier: item.purchaseOrder.supplier?.supplierName || "",
        prQty: Number(item.purchaseRequisitionItem?.prQuantity || 0),
        poQty: poQty,
        receivedQty: receivedQty,
        outstandingQty: outstandingQty > 0 ? outstandingQty : 0,
        unitPriceSgd: unitPriceSgd,
        totalCostSgd: unitPriceSgd * poQty,
      });
    });

    const results = Array.from(woMap.values());
    
    // Sort by workOrderNo
    results.sort((a, b) => a.workOrderNo.localeCompare(b.workOrderNo));

    return NextResponse.json(results);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
