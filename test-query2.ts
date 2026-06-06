import { prisma } from './src/lib/prisma';

async function run() {
  try {
    const workOrders = await prisma.workOrder.findMany({
      orderBy: { createdAt: "desc" },
      include: { 
        customer: true,
        inProcesses: {
          include: {
            routingProcesses: {
              include: {
                productionTimesheets: true
              }
            }
          }
        }
      },
    });
    
    const enrichedWorkOrders = workOrders.map((wo: any) => {
      let producedQty = 0;
      const totalQty = Number(wo.quantity) || 0;
      
      if (wo.status === "Completed") {
        producedQty = totalQty;
      } else if (wo.inProcesses && wo.inProcesses.length > 0) {
        let lastProcess = null;
        let maxSn = -1;
        wo.inProcesses.forEach((ip: any) => {
          ip.routingProcesses?.forEach((rp: any) => {
            if (rp.sn > maxSn) {
              maxSn = rp.sn;
              lastProcess = rp;
            }
          });
        });
        
        if (lastProcess) {
          producedQty = (lastProcess as any).productionTimesheets?.reduce((sum: number, ts: any) => sum + (Number(ts.completedQty) || 0), 0) || 0;
        }
      }
      
      producedQty = Math.min(producedQty, totalQty);
      
      return {
        ...wo,
        producedQty,
        totalQty
      };
    });

    console.log("Mapped exactly without error! Length:", enrichedWorkOrders.length);
  } catch (e) {
    console.error("Mapping error:", e);
  } finally {
    await prisma.$disconnect();
  }
}
run();
