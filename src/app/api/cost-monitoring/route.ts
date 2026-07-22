import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    
    const where: Prisma.WorkOrderWhereInput = {
      status: { not: "Void" },
      OR: search ? [
        { workOrderNo: { contains: search, mode: "insensitive" } },
        { customer: { customerName: { contains: search, mode: "insensitive" } } },
      ] : undefined,
    };

    const workOrders = await prisma.workOrder.findMany({
      where,
      include: {
        customer: true,
        inProcesses: {
          include: {
            routingProcesses: {
              include: {
                routingProcess: true, // ProcessProfile to get costPerMinute
                productionTimesheets: true, // To get totalMinutes
              }
            }
          }
        },
        purchaseOrders: {
          include: {
            items: true,
          }
        }
      },
      orderBy: { createdAt: "desc" },
    });

    const costData = workOrders.map((wo) => {
      // 1. Revenue
      const revenue = Number(wo.amount) || 0;

      // 2. Labor Cost
      let laborCost = 0;
      wo.inProcesses.forEach(inProcess => {
        inProcess.routingProcesses.forEach(rp => {
          const costPerMinute = Number(rp.routingProcess?.costPerMinute) || 0;
          rp.productionTimesheets.forEach(ts => {
            if (ts.totalMinutes) {
              laborCost += Number(ts.totalMinutes) * costPerMinute;
            }
          });
        });
      });

      // 3. Material & Subcon Costs
      let materialCost = 0;
      let subconCost = 0;
      
      wo.purchaseOrders.forEach(po => {
        if (po.status !== "Void") {
          let poAmount = 0;
          po.items.forEach(item => {
             poAmount += Number(item.amount) || 0;
          });
          
          // Wait, sometimes PO has taxes, but let's just use items amount or amountBeforeTax
          // We will use amountAfterTax or just item sum?
          // Using amountAfterTax is more accurate if tax is considered a cost.
          // Let's use item amounts for direct material cost.
          if (po.type === "MATERIAL") {
            materialCost += poAmount;
          } else if (po.type === "SUBCON") {
            subconCost += poAmount;
          }
        }
      });

      const totalCost = laborCost + materialCost + subconCost;
      const profit = revenue - totalCost;
      const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

      return {
        workOrderNo: wo.workOrderNo,
        customerName: wo.customer?.customerName || "Unknown",
        date: wo.date,
        revenue,
        laborCost,
        materialCost,
        subconCost,
        totalCost,
        profit,
        margin,
        status: wo.status,
      };
    });

    return NextResponse.json(costData);
  } catch (error: any) {
    console.error("Error fetching cost monitoring data:", error);
    return NextResponse.json(
      { error: "Failed to fetch cost monitoring data", details: error.message },
      { status: 500 }
    );
  }
}
