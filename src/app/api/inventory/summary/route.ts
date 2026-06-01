import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    
    // Fetch materials matching the search
    const materials = await prisma.materialProfile.findMany({
      where: {
        OR: [
          { partNo: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { category: { name: { contains: search, mode: 'insensitive' } } },
        ]
      },
      include: {
        category: true,
      }
    });

    const materialIds = materials.map(m => m.id);
    if (materialIds.length === 0) {
      return NextResponse.json([]);
    }

    // 1. Fetch PO items for "Total On-Order Qty"
    // Issued POs where receiveStatus != Fully Received
    const poItems = await prisma.purchaseOrderItem.findMany({
      where: {
        materialProfileId: { in: materialIds },
        purchaseOrder: {
          status: "Issued",
          receiveStatus: { not: "Fully Received" }
        }
      },
      select: {
        materialProfileId: true,
        internalQuantity: true,
        purchaseOrderId: true,
        internalUom: { select: { uomName: true } },
      }
    });

    // 2. Fetch GR items for "Total Received Qty"
    const grItems = await prisma.goodsReceiveItem.findMany({
      where: {
        purchaseOrderItem: { materialProfileId: { in: materialIds } },
        goodsReceive: { status: "Submitted" } // Only submitted GRs? Assuming Submitted or similar
      },
      select: {
        receiveQty: true,
        purchaseOrderItem: { select: { materialProfileId: true, conversion: true, internalUom: { select: { uomName: true } } } }
      }
    });

    // 3. Fetch RTN items for "Total Returned Qty"
    const rtnItems = await prisma.goodsReturnItem.findMany({
      where: {
        goodsReceiveItem: {
          purchaseOrderItem: { materialProfileId: { in: materialIds } }
        },
        goodsReturn: { status: "Submitted" }
      },
      select: {
        returnQty: true,
        internalQty: true,
        goodsReceiveItem: {
          select: {
            purchaseOrderItem: { select: { materialProfileId: true, conversion: true } }
          }
        }
      }
    });

    // 4. Fetch Demand from PurchaseRequisitionItem
    const prItems = await prisma.purchaseRequisitionItem.findMany({
      where: {
        materialProfileId: { in: materialIds },
        purchaseRequisition: { workOrderNo: { not: null } }
      },
      select: {
        materialProfileId: true,
        prQuantity: true,
      }
    });

    // Aggregate data
    const summaryMap = new Map();
    materials.forEach(m => {
      summaryMap.set(m.id, {
        id: m.id,
        partNo: m.partNo || "",
        description: m.description || "",
        shape: m.shape || "",
        size: m.size || "",
        category: m.category?.name || "",
        materialStatus: m.status || "",
        internalUom: "",
        onOrderQty: 0,
        receivedQty: 0,
        returnedQty: 0,
        demandQty: 0,
        openPoCount: new Set(),
      });
    });

    poItems.forEach(item => {
      if (!item.materialProfileId) return;
      const data = summaryMap.get(item.materialProfileId);
      if (data) {
        data.onOrderQty += Number(item.internalQuantity || 0);
        data.openPoCount.add(item.purchaseOrderId);
        if (item.internalUom?.uomName && !data.internalUom) {
          data.internalUom = item.internalUom.uomName;
        }
      }
    });

    grItems.forEach(item => {
      const matId = item.purchaseOrderItem?.materialProfileId;
      if (!matId) return;
      const data = summaryMap.get(matId);
      if (data) {
        const conversion = Number(item.purchaseOrderItem?.conversion || 1);
        data.receivedQty += Number(item.receiveQty || 0) * conversion;
        if (item.purchaseOrderItem?.internalUom?.uomName && !data.internalUom) {
          data.internalUom = item.purchaseOrderItem.internalUom.uomName;
        }
      }
    });

    rtnItems.forEach(item => {
      const matId = item.goodsReceiveItem?.purchaseOrderItem?.materialProfileId;
      if (!matId) return;
      const data = summaryMap.get(matId);
      if (data) {
        // internalQty is available on GoodsReturnItem
        data.returnedQty += Number(item.internalQty || 0);
      }
    });

    prItems.forEach(item => {
      if (!item.materialProfileId) return;
      const data = summaryMap.get(item.materialProfileId);
      if (data) {
        data.demandQty += Number(item.prQuantity || 0);
      }
    });

    // Format output
    const results = Array.from(summaryMap.values()).map(data => {
      const netReceivedQty = data.receivedQty - data.returnedQty;
      const balance = netReceivedQty - data.demandQty;
      return {
        ...data,
        openPoCount: data.openPoCount.size,
        netReceivedQty,
        balance,
      };
    });

    return NextResponse.json(results);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
