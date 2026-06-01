import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const materialId = searchParams.get("materialId");

    if (!materialId) {
      return NextResponse.json({ error: "materialId is required" }, { status: 400 });
    }

    // 1. Fetch Open PO items
    const poItems = await prisma.purchaseOrderItem.findMany({
      where: {
        materialProfileId: materialId,
        purchaseOrder: {
          status: "Issued",
          receiveStatus: { not: "Fully Received" }
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
        poUom: true,
        internalUom: true,
        materialProfile: true,
      }
    });

    // 2. Fetch GR items
    const grItems = await prisma.goodsReceiveItem.findMany({
      where: {
        purchaseOrderItem: { materialProfileId: materialId },
        goodsReceive: { status: "Submitted" } // Assumption: only Submitted GRs affect inventory
      },
      include: {
        goodsReceive: true,
        purchaseOrderItem: {
          include: {
            purchaseOrder: {
              include: {
                supplier: true,
                workOrder: { include: { customer: true } }
              }
            },
            poUom: true,
            internalUom: true,
            materialProfile: true,
          }
        }
      }
    });

    // 3. Fetch RTN items
    const rtnItems = await prisma.goodsReturnItem.findMany({
      where: {
        goodsReceiveItem: {
          purchaseOrderItem: { materialProfileId: materialId }
        },
        goodsReturn: { status: "Submitted" }
      },
      include: {
        goodsReturn: true,
        goodsReceiveItem: {
          include: {
            goodsReceive: true,
            purchaseOrderItem: {
              include: {
                purchaseOrder: {
                  include: {
                    supplier: true,
                    workOrder: { include: { customer: true } }
                  }
                },
                poUom: true,
                internalUom: true,
                materialProfile: true,
              }
            }
          }
        }
      }
    });

    const movements: any[] = [];

    // Map PO
    poItems.forEach(item => {
      movements.push({
        id: `PO-${item.id}`,
        transactionType: "PO",
        transactionNo: item.purchaseOrder.poNo,
        transactionDate: item.purchaseOrder.date,
        supplier: item.purchaseOrder.supplier?.supplierName || "",
        workOrderNo: item.purchaseOrder.workOrderNo || "",
        customer: item.purchaseOrder.workOrder?.customer?.customerName || "",
        poUom: item.poUom?.uomName || "",
        poQty: Number(item.quantity || 0),
        conversion: Number(item.conversion || 1),
        internalUom: item.internalUom?.uomName || "",
        internalQty: Number(item.internalQuantity || 0),
        inOut: "In",
        unitPrice: Number(item.unitPrice || 0),
        amountPoCurrency: Number(item.amount || 0),
        amountSgd: Number(item.amount || 0) * Number(item.purchaseOrder.exchangeRate || 1), // Simplification
        deliveryDate: item.deliveryDate,
        invoiceNo: "",
        receiveStatus: item.purchaseOrder.receiveStatus,
      });
    });

    // Map GR
    grItems.forEach(item => {
      const poItem = item.purchaseOrderItem;
      const conversion = Number(poItem.conversion || 1);
      const receiveQty = Number(item.receiveQty || 0);
      movements.push({
        id: `GR-${item.id}`,
        transactionType: "GR",
        transactionNo: item.goodsReceive.grNo,
        transactionDate: item.goodsReceive.date,
        supplier: poItem.purchaseOrder.supplier?.supplierName || "",
        workOrderNo: poItem.purchaseOrder.workOrderNo || "",
        customer: poItem.purchaseOrder.workOrder?.customer?.customerName || "",
        poUom: poItem.poUom?.uomName || "",
        poQty: receiveQty, // Using receiveQty as the relevant transaction qty
        conversion: conversion,
        internalUom: poItem.internalUom?.uomName || "",
        internalQty: receiveQty * conversion,
        inOut: "In",
        unitPrice: Number(poItem.unitPrice || 0),
        amountPoCurrency: receiveQty * Number(poItem.unitPrice || 0),
        amountSgd: (receiveQty * Number(poItem.unitPrice || 0)) * Number(item.goodsReceive.exchangeRate || 1),
        deliveryDate: poItem.deliveryDate,
        invoiceNo: item.goodsReceive.invoiceNo || "",
        receiveStatus: "N/A", // Usually applies to PO, not individual GR
      });
    });

    // Map RTN
    rtnItems.forEach(item => {
      const poItem = item.goodsReceiveItem.purchaseOrderItem;
      const returnQty = Number(item.returnQty || 0);
      movements.push({
        id: `RTN-${item.id}`,
        transactionType: "RTN",
        transactionNo: item.goodsReturn.rtnNo,
        transactionDate: item.goodsReturn.rtnDate,
        supplier: poItem.purchaseOrder.supplier?.supplierName || "",
        workOrderNo: poItem.purchaseOrder.workOrderNo || "",
        customer: poItem.purchaseOrder.workOrder?.customer?.customerName || "",
        poUom: poItem.poUom?.uomName || "",
        poQty: returnQty,
        conversion: Number(poItem.conversion || 1),
        internalUom: poItem.internalUom?.uomName || "",
        internalQty: Number(item.internalQty || 0),
        inOut: "Out",
        unitPrice: Number(poItem.unitPrice || 0),
        amountPoCurrency: Number(item.amount || 0),
        amountSgd: Number(item.amount || 0) * Number(item.goodsReturn.exchangeRate || 1),
        deliveryDate: poItem.deliveryDate,
        invoiceNo: item.goodsReceiveItem.goodsReceive.invoiceNo || "",
        receiveStatus: "N/A",
      });
    });

    // Sort by transactionDate DESC
    movements.sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime());

    return NextResponse.json(movements);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
