import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const workOrderNo = searchParams.get("workOrderNo");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const customer = searchParams.get("customer");
  const status = searchParams.get("status");

  try {
    const whereClause: any = {};

    if (workOrderNo) {
      whereClause.workOrderNo = { contains: workOrderNo, mode: "insensitive" };
    }
    
    if (dateFrom || dateTo) {
      whereClause.date = {};
      if (dateFrom) whereClause.date.gte = new Date(dateFrom);
      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        whereClause.date.lte = toDate;
      }
    }
    
    if (customer) {
      whereClause.customer = {
        customerName: { contains: customer, mode: "insensitive" }
      };
    }
    
    if (status) {
      whereClause.status = status;
    }

    const workOrders = await prisma.workOrder.findMany({
      where: whereClause,
      include: {
        customer: true,
        inProcesses: {
          include: {
            routingProcesses: {
              include: {
                routingProcess: true, // gets ProcessProfile for costPerMinute
                productionTimesheets: true // gets totalMinutes
              }
            }
          }
        },
        purchaseOrders: true // gets material cost
      },
      orderBy: {
        workOrderNo: 'asc'
      }
    });

    // Build the flat report data
    const reportData = workOrders.map(wo => {
      let totalLaborCost = 0;
      
      wo.inProcesses.forEach(inProc => {
        inProc.routingProcesses.forEach(rp => {
          const costPerMin = Number(rp.routingProcess?.costPerMinute || 0);
          rp.productionTimesheets.forEach(ts => {
            const minutes = Number(ts.totalMinutes || 0);
            totalLaborCost += (minutes * costPerMin);
          });
        });
      });

      let totalMaterialCost = 0;
      wo.purchaseOrders.forEach(po => {
        // Assuming amountAfterTax or amountBeforeTax is the total PO material cost.
        // Will use amountAfterTax.
        const poAmt = Number(po.amountAfterTax || 0);
        totalMaterialCost += poAmt;
      });

      return {
        workOrderNo: wo.workOrderNo,
        date: wo.date,
        customerName: wo.customer?.customerName || "",
        projectCode: wo.projectCode || "",
        jobDescription: wo.jobDescription || "",
        deliveryDate: wo.deliveryDate,
        status: wo.status,
        totalLaborCost: totalLaborCost,
        totalMaterialCost: totalMaterialCost,
        totalCost: totalLaborCost + totalMaterialCost
      };
    });

    return NextResponse.json(reportData);
  } catch (error: any) {
    console.error("WO Costing Report Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
