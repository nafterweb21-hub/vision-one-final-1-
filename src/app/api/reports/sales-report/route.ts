import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const soNo = searchParams.get("soNo");
  const soDateFrom = searchParams.get("soDateFrom");
  const soDateTo = searchParams.get("soDateTo");
  const customer = searchParams.get("customer");
  const salesperson = searchParams.get("salesperson");
  const partNo = searchParams.get("partNo");
  const partDescription = searchParams.get("partDescription");
  const workOrderNo = searchParams.get("workOrderNo");

  try {
    const whereClause: any = {
      status: { not: "Void" } // typically exclude voided orders
    };

    if (soNo) whereClause.orderNo = { contains: soNo, mode: "insensitive" };
    if (soDateFrom || soDateTo) {
      whereClause.date = {};
      if (soDateFrom) whereClause.date.gte = new Date(soDateFrom);
      if (soDateTo) {
        const toDate = new Date(soDateTo);
        toDate.setHours(23, 59, 59, 999);
        whereClause.date.lte = toDate;
      }
    }
    
    if (customer) {
      whereClause.customer = {
        customerName: { contains: customer, mode: "insensitive" }
      };
    }
    
    if (salesperson) {
      whereClause.salesperson = {
        name: { contains: salesperson, mode: "insensitive" }
      };
    }
    
    // Filtering on nested items requires some care. 
    // We can filter the top-level SalesOrder by using `some` on items if needed.
    const itemsWhere: any = {};
    let filterByItems = false;
    
    if (partNo) {
      itemsWhere.part = { partNo: { contains: partNo, mode: "insensitive" } };
      filterByItems = true;
    }
    if (partDescription) {
      itemsWhere.part = { ...itemsWhere.part, description: { contains: partDescription, mode: "insensitive" } };
      filterByItems = true;
    }
    if (workOrderNo) {
      itemsWhere.batches = { some: { workOrderNo: { contains: workOrderNo, mode: "insensitive" } } };
      filterByItems = true;
    }
    
    if (filterByItems) {
      whereClause.items = { some: itemsWhere };
    }

    const salesOrders = await prisma.salesOrder.findMany({
      where: whereClause,
      include: {
        customer: true,
        salesperson: true,
        currency: true,
        taxType: true,
        items: {
          include: {
            part: true,
            uom: true,
            batches: {
              include: {
                salesOrderItem: {
                  include: {
                    salesOrder: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        orderNo: 'asc'
      }
    });

    // We also need WorkOrder details (status, qcAcceptance) and DeliveryOrderItem (for qty delivered)
    // Since we can't easily include them deeply in Prisma due to schema layout, we'll fetch them separately.
    const workOrderNos = new Set<string>();
    for (const so of salesOrders) {
      for (const item of so.items) {
        for (const batch of item.batches) {
          if (batch.workOrderNo) {
            workOrderNos.add(batch.workOrderNo);
          }
        }
      }
    }
    
    const workOrders = await prisma.workOrder.findMany({
      where: {
        workOrderNo: { in: Array.from(workOrderNos) }
      },
      include: {
        deliveryOrderItems: {
          include: {
            deliveryOrder: true
          }
        }
      }
    });
    
    const woMap = new Map(workOrders.map(wo => [wo.workOrderNo, wo]));

    // Build the flat report data
    const reportData = [];

    for (const so of salesOrders) {
      // If we filtered by item fields, we might want to only show matching items, or show all items for matching SOs.
      // Usually reports show matching items only, but SO groups them.
      // We will filter items here if partNo/description was provided to be strict.
      const filteredItems = so.items.filter(item => {
        if (partNo && !item.part?.partNo?.toLowerCase().includes(partNo.toLowerCase())) return false;
        if (partDescription && !item.part?.description?.toLowerCase().includes(partDescription.toLowerCase())) return false;
        if (workOrderNo && !item.batches.some(b => b.workOrderNo?.toLowerCase().includes(workOrderNo.toLowerCase()))) return false;
        return true;
      });

      if (filteredItems.length === 0) {
        if (!filterByItems) {
          reportData.push({
            soNo: so.orderNo,
            soDate: so.date,
            salesperson: so.salesperson?.name || "",
            customer: so.customer?.customerName || "",
            customerPoRef: so.customerPoRef || "",
            projectCode: so.projectCode || "",
            curr: so.currency?.code || "",
            exchRate: Number(so.exchangeRate || 1),
            taxType: so.taxType?.taxType || "",
            taxRate: Number(so.taxRate || 0),
            beforeTax: Number(so.amountBeforeTax || 0),
            tax: Number(so.taxAmount || 0),
            aftTax: Number(so.amountAfterTax || 0),
            partNo: "",
            description: "",
            qty: 0,
            uom: "",
            unitPrice: 0,
            amt: 0,
            internalQuoNo: "",
            vendorMaterialNo: "",
            materialSpec: "",
            batchQty: 0,
            deliveryDate: "",
            woNo: "",
            woStatus: "",
            qcAcceptance: "",
            qtyDelivered: 0,
            qtyNotDelivered: 0,
            amtDelivered: 0,
            amtNotDelivered: 0,
          });
        }
      } else {
        for (const item of filteredItems) {
          if (item.batches && item.batches.length > 0) {
            for (const batch of item.batches) {
              if (workOrderNo && batch.workOrderNo && !batch.workOrderNo.toLowerCase().includes(workOrderNo.toLowerCase())) {
                continue;
              }

              const wo = batch.workOrderNo ? woMap.get(batch.workOrderNo) : null;
              
              let qtyDelivered = 0;
              if (wo && wo.deliveryOrderItems) {
                for (const doItem of wo.deliveryOrderItems) {
                  qtyDelivered += Number(doItem.quantity);
                }
              }
              
              const batchQty = Number(batch.quantity);
              const qtyNotDelivered = Math.max(0, batchQty - qtyDelivered);
              const unitPrice = Number(item.unitPrice || 0);
              
              reportData.push({
                soNo: so.orderNo,
                soDate: so.date,
                salesperson: so.salesperson?.name || "",
                customer: so.customer?.customerName || "",
                customerPoRef: so.customerPoRef || "",
                projectCode: so.projectCode || "",
                curr: so.currency?.code || "",
                exchRate: Number(so.exchangeRate || 1),
                taxType: so.taxType?.taxType || "",
                taxRate: Number(so.taxRate || 0),
                beforeTax: Number(so.amountBeforeTax || 0),
                tax: Number(so.taxAmount || 0),
                aftTax: Number(so.amountAfterTax || 0),
                partNo: item.part?.partNo || "",
                description: item.part?.description || "",
                qty: Number(item.quantity || 0),
                uom: item.uom?.uomName || "",
                unitPrice: unitPrice,
                amt: Number(item.quantity || 0) * unitPrice,
                internalQuoNo: item.internalQuotationNo || "",
                vendorMaterialNo: item.vendorMaterialNo || "",
                materialSpec: item.materialSpecification || "",
                batchQty: batchQty,
                deliveryDate: batch.deliveryDate,
                woNo: batch.workOrderNo || "",
                woStatus: wo ? wo.status : "",
                qcAcceptance: wo ? wo.qcAcceptance : "",
                qtyDelivered: qtyDelivered,
                qtyNotDelivered: qtyNotDelivered,
                amtDelivered: qtyDelivered * unitPrice,
                amtNotDelivered: qtyNotDelivered * unitPrice,
              });
            }
          } else {
            const unitPrice = Number(item.unitPrice || 0);
            const itemQty = Number(item.quantity || 0);
            reportData.push({
              soNo: so.orderNo,
              soDate: so.date,
              salesperson: so.salesperson?.name || "",
              customer: so.customer?.customerName || "",
              customerPoRef: so.customerPoRef || "",
              projectCode: so.projectCode || "",
              curr: so.currency?.code || "",
              exchRate: Number(so.exchangeRate || 1),
              taxType: so.taxType?.taxType || "",
              taxRate: Number(so.taxRate || 0),
              beforeTax: Number(so.amountBeforeTax || 0),
              tax: Number(so.taxAmount || 0),
              aftTax: Number(so.amountAfterTax || 0),
              partNo: item.part?.partNo || "",
              description: item.part?.description || "",
              qty: itemQty,
              uom: item.uom?.uomName || "",
              unitPrice: unitPrice,
              amt: itemQty * unitPrice,
              internalQuoNo: item.internalQuotationNo || "",
              vendorMaterialNo: item.vendorMaterialNo || "",
              materialSpec: item.materialSpecification || "",
              batchQty: 0,
              deliveryDate: "",
              woNo: "",
              woStatus: "",
              qcAcceptance: "",
              qtyDelivered: 0,
              qtyNotDelivered: itemQty,
              amtDelivered: 0,
              amtNotDelivered: itemQty * unitPrice,
            });
          }
        }
      }
    }

    // Sort by SO No, WO No as specified
    reportData.sort((a, b) => {
      if (a.soNo < b.soNo) return -1;
      if (a.soNo > b.soNo) return 1;
      if (a.woNo < b.woNo) return -1;
      if (a.woNo > b.woNo) return 1;
      return 0;
    });

    return NextResponse.json(reportData);
  } catch (error: any) {
    console.error("Sales Report Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
