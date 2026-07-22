import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const customer = searchParams.get("customer");
  const workOrderNo = searchParams.get("workOrderNo");
  const jobDescription = searchParams.get("jobDescription");
  const inProcessDescription = searchParams.get("inProcessDescription");
  const mainProcess = searchParams.get("mainProcess");
  const routingProcess = searchParams.get("routingProcess");
  const department = searchParams.get("department");

  try {
    const whereClause: any = {
      status: { not: "Void" }
    };

    if (customer) {
      whereClause.CustomerProfile = {
        customerName: { contains: customer, mode: "insensitive" }
      };
    }
    
    if (workOrderNo) {
      whereClause.workOrderNo = { contains: workOrderNo, mode: "insensitive" };
    }
    
    if (jobDescription) {
      whereClause.WorkOrder = {
        jobDescription: { contains: jobDescription, mode: "insensitive" }
      };
    }
    
    if (inProcessDescription) {
      whereClause.WorkOrderInProcess = {
        description: { contains: inProcessDescription, mode: "insensitive" }
      };
    }
    
    if (mainProcess) {
      whereClause.MainProcess = {
        process: { contains: mainProcess, mode: "insensitive" }
      };
    }
    
    if (routingProcess) {
      whereClause.RoutingProcess = {
        routingProcess: {
          routingProcess: { contains: routingProcess, mode: "insensitive" }
        }
      };
    }
    
    if (department) {
      whereClause.department = { contains: department, mode: "insensitive" };
    }

    const ncrRecords = await prisma.ncr.findMany({
      where: whereClause,
      include: {
        CustomerProfile: true,
        WorkOrder: true,
        WorkOrderInProcess: true,
        MainProcess: true,
        RoutingProcess: {
          include: {
            routingProcess: true
          }
        },
        Employee_Ncr_responsiblePartyIdToEmployee: true,
        NcrFailureMode: {
          include: {
            FailureModeProfile: true
          }
        }
      },
      orderBy: [
        {
          workOrderNo: 'asc'
        },
        {
          MainProcess: {
            process: 'asc'
          }
        },
        {
          RoutingProcess: {
            routingProcessId: 'asc'
          }
        }
      ]
    });

    const reportData = ncrRecords.map(ncr => {
      // Join failure modes
      const failureModes = ncr.NcrFailureMode.map(fm => fm.FailureModeProfile?.failureMode).filter(Boolean).join("; ");

      return {
        customer: ncr.CustomerProfile?.customerName || "",
        customerPoRef: ncr.WorkOrder?.customerPoRef || "",
        woNo: ncr.workOrderNo || "",
        woDate: ncr.WorkOrder?.date || null,
        jobDescription: ncr.WorkOrder?.jobDescription || "",
        inProcessDescription: ncr.WorkOrderInProcess?.description || "",
        mainProcess: ncr.MainProcess?.process || "",
        routingProcess: ncr.RoutingProcess?.routingProcess?.routingProcess || "",
        ncrQty: Number(ncr.ncrQuantity || 0),
        department: ncr.department || "",
        responsibleParty: ncr.Employee_Ncr_responsiblePartyIdToEmployee?.name || "",
        problemDescription: ncr.descriptionOfNonConformance || "",
        reworkQty: Number(ncr.reworkQuantity || 0),
        useAsIsQty: Number(ncr.useAsIsQuantity || 0),
        scrapQty: Number(ncr.scrapQuantity || 0),
        otherDecision: ncr.otherDecisions || "",
        otherQty: Number(ncr.otherQuantity || 0),
        customerAcceptance: ncr.customerAcceptanceForUseAsIs === true ? "Yes" : (ncr.customerAcceptanceForUseAsIs === false ? "No" : ""),
        failureMode: failureModes,
        rootCause: ncr.rootCause || "",
        correctiveAction: ncr.correctivePreventiveAction || "",
        actionTaken: ncr.actionTaken || ""
      };
    });

    return NextResponse.json(reportData);
  } catch (error: any) {
    console.error("NCR Report Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
