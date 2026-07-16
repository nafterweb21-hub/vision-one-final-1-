"use server";

import { prisma } from "@/lib/prisma";

export async function getDashboardMetrics() {
  try {
    // 1. Active Work Orders
    const activeWorkOrdersCount = await prisma.workOrder.count({
      where: { status: { notIn: ["Draft", "Closed", "Completed"] } },
    });
    
    const pendingQcWorkOrders = await prisma.workOrder.count({
      where: { status: "Pending QC" },
    });
    
    const onHoldWorkOrders = await prisma.workOrder.count({
      where: { status: "On Hold" },
    });

    // 2. Open Sales Orders
    const openSalesOrders = await prisma.salesOrder.findMany({
      where: { status: { notIn: ["Draft", "Closed", "Completed", "Cancelled"] } },
      select: { amountAfterTax: true },
    });
    
    const openSalesOrdersCount = openSalesOrders.length;
    const openSalesOrdersTotal = openSalesOrders.reduce(
      (sum, so) => sum + Number(so.amountAfterTax || 0),
      0
    );

    // 3. POs Awaiting Delivery
    const posAwaitingDeliveryCount = await prisma.purchaseOrder.count({
      where: {
        status: { notIn: ["Draft", "Cancelled"] },
        receiveStatus: { notIn: ["FULLY_RECEIVED"] },
      },
    });

    const overduePosCount = await prisma.purchaseOrder.count({
      where: {
        status: { notIn: ["Draft", "Cancelled"] },
        receiveStatus: { notIn: ["FULLY_RECEIVED"] },
        items: {
          some: {
            deliveryDate: {
              lt: new Date(),
            },
          },
        },
      },
    });

    // 4. Open NCRs
    const openNcrsCount = await prisma.ncr.count({
      where: { status: { notIn: ["Closed", "Completed"] } },
    });
    
    const pendingClosureNcrsCount = await prisma.ncr.count({
      where: { status: "Pending Closure" },
    });

    // 5. Recent Work Orders
    const recentWorkOrders = await prisma.workOrder.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        customer: {
          select: { customerName: true },
        },
      },
    });

    const formattedRecentWorkOrders = recentWorkOrders.map((wo) => ({
      workOrderNo: wo.workOrderNo,
      customerName: wo.customer.customerName,
      deliveryDate: wo.deliveryDate ? wo.deliveryDate.toISOString() : null,
      status: wo.status,
      qcAcceptance: wo.qcAcceptance || "N/A",
    }));

    // 6. Process Load
    const mainProcesses = await prisma.mainProcess.findMany({
      include: {
        _count: {
          select: {
            routingProcesses: {
              where: { status: { notIn: ["Completed", "Closed"] } },
            },
          },
        },
      },
    });

    // Determine load based on a mock capacity (e.g., 20) to show percentage for UI
    const processLoad = mainProcesses.map((mp) => {
      const activeCount = mp._count.routingProcesses;
      return {
        label: mp.process,
        value: Math.min(100, Math.round((activeCount / 20) * 100)),
      };
    });

    // Add QC Load from WorkOrders Pending QC
    processLoad.push({
      label: "QC",
      value: Math.min(100, Math.round((pendingQcWorkOrders / 20) * 100)),
    });

    // Add default processes to ensure the UI looks complete if data is missing
    const defaultProcesses = ["Welding", "Machining", "Spray Paint", "Sizing", "Assembly"];
    defaultProcesses.forEach(dp => {
      if (!processLoad.find(p => p.label === dp)) {
        processLoad.push({ label: dp, value: 0 });
      }
    });

    processLoad.sort((a, b) => b.value - a.value);

    // NEW DATA FETCHING FOR REALTIME DASHBOARD PANELS
    
    // 7. PO Approvals Pending
    // Fallback to all not Draft/Cancelled if "Pending For Approval" is empty
    let pendingPosRaw = await prisma.purchaseOrder.findMany({
      where: { status: "Pending For Approval" },
      take: 4,
      orderBy: { createdAt: "desc" },
      include: { supplier: { select: { supplierName: true } } }
    });
    
    if (pendingPosRaw.length === 0) {
       pendingPosRaw = await prisma.purchaseOrder.findMany({
        where: { status: { notIn: ["Draft", "Cancelled", "Completed", "Closed"] } },
        take: 4,
        orderBy: { createdAt: "desc" },
        include: { supplier: { select: { supplierName: true } } }
      });
    }

    const pendingPoApprovals = {
      urgentCount: pendingPosRaw.length > 2 ? 2 : pendingPosRaw.length, // mock urgent count based on length
      list: pendingPosRaw.map(po => ({
        id: po.id,
        poNo: po.poNo,
        supplierName: po.supplier?.supplierName || "Unknown Supplier",
        amount: Number(po.amountAfterTax || 0),
        workOrderNo: po.workOrderNo || "N/A",
        tier: Number(po.amountAfterTax || 0) > 10000 ? "2nd Tier" : "1st Tier" // Mocking tier logic
      }))
    };

    // 8. Recent NCRs list for "Open NCRs" panel
    const recentNcrsRaw = await prisma.ncr.findMany({
      where: { status: { notIn: ["Closed", "Completed"] } },
      take: 4,
      orderBy: { createdAt: "desc" },
      include: {
        Employee_Ncr_requestorIdToEmployee: {
          select: { name: true }
        }
      }
    });

    const recentNcrsList = recentNcrsRaw.map(ncr => {
      const daysAgo = Math.floor((new Date().getTime() - new Date(ncr.createdAt).getTime()) / (1000 * 3600 * 24));
      return {
        ncrNo: ncr.ncrNo,
        title: ncr.descriptionOfNonConformance?.substring(0, 30) || "Issue",
        workOrderNo: ncr.workOrderNo,
        raisedBy: ncr.Employee_Ncr_requestorIdToEmployee?.name || "Unknown",
        timeText: daysAgo === 0 ? "Today" : `${daysAgo} days ago`,
        status: ncr.status
      };
    });

    // 9. WO Status Distribution
    const wos = await prisma.workOrder.groupBy({
      by: ['status'],
      _count: { status: true }
    });
    
    const woDistributionMap: Record<string, number> = {
      "WIP": 0, "Proceed": 0, "Completed": 0, "Pending QC": 0, "Others": 0
    };
    
    let totalWos = 0;
    wos.forEach(group => {
      totalWos += group._count.status;
      if (["WIP", "Proceed", "Completed", "Pending QC"].includes(group.status)) {
        woDistributionMap[group.status] += group._count.status;
      } else {
        woDistributionMap["Others"] += group._count.status;
      }
    });

    const woStatusDistribution = {
      total: totalWos,
      distribution: [
        { label: "WIP", value: woDistributionMap["WIP"] },
        { label: "Proceed", value: woDistributionMap["Proceed"] },
        { label: "Completed", value: woDistributionMap["Completed"] },
        { label: "Pending QC", value: woDistributionMap["Pending QC"] },
        { label: "Others", value: woDistributionMap["Others"] },
      ]
    };

    // 10. Company Profiles
    const companyProfiles = await prisma.companyProfile.findMany({
      select: {
        companyName: true,
        allowPoForWo: true,
        as9100RequirementNote: true,
      }
    });

    return {
      activeWorkOrders: {
        count: activeWorkOrdersCount,
        pendingQc: pendingQcWorkOrders,
        onHold: onHoldWorkOrders,
      },
      openSalesOrders: {
        count: openSalesOrdersCount,
        totalValue: openSalesOrdersTotal,
      },
      posAwaitingDelivery: {
        count: posAwaitingDeliveryCount,
        overdue: overduePosCount,
      },
      openNcrs: {
        count: openNcrsCount,
        pendingClosure: pendingClosureNcrsCount,
      },
      recentWorkOrders: formattedRecentWorkOrders,
      processLoad,
      pendingPoApprovals,
      recentNcrsList,
      woStatusDistribution,
      companyProfiles
    };
  } catch (error) {
    console.error("Failed to fetch dashboard metrics:", error);
    // Return fallback zeroes in case of DB error
    return {
      activeWorkOrders: { count: 0, pendingQc: 0, onHold: 0 },
      openSalesOrders: { count: 0, totalValue: 0 },
      posAwaitingDelivery: { count: 0, overdue: 0 },
      openNcrs: { count: 0, pendingClosure: 0 },
      recentWorkOrders: [],
      processLoad: [],
      pendingPoApprovals: { urgentCount: 0, list: [] },
      recentNcrsList: [],
      woStatusDistribution: { total: 0, distribution: [] },
      companyProfiles: []
    };
  }
}
