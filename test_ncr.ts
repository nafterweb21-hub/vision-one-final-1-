import { prisma } from "./src/lib/prisma";

async function main() {
  const whereClause: any = {
    status: { not: "Void" }
  };

  const customer = "indu";
  const workOrderNo = "WO-SO-2026-0008-001";
  const jobDescription = "finished";
  const mainProcess = "sawing";
  const routingProcess = "CUTTING";
  const department = "production";

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

  console.log(JSON.stringify(whereClause, null, 2));

  const ncrRecords = await prisma.ncr.findMany({
    where: whereClause,
    include: {
      CustomerProfile: true,
      WorkOrder: true,
      MainProcess: true,
      RoutingProcess: {
        include: {
          routingProcess: true
        }
      }
    }
  });

  console.log("Found records:", ncrRecords.length);
  
  // Try querying NCR directly to see what actually exists
  const allNcrs = await prisma.ncr.findMany({
    include: {
      CustomerProfile: true,
      WorkOrder: true,
      MainProcess: true,
      RoutingProcess: {
        include: {
          routingProcess: true
        }
      }
    }
  });

  console.log("Total NCRs:", allNcrs.length);
  if (allNcrs.length > 0) {
    const matching = allNcrs.filter(n => 
      n.CustomerProfile?.customerName?.toLowerCase().includes("indu")
    );
    console.log("Matching indu in memory:", matching.length);
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
