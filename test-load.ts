import { prisma } from './src/lib/prisma';
async function main() {
    const mainProcesses = await prisma.mainProcess.findMany({
      include: {
        _count: {
          select: {
            routingProcesses: {
              where: { status: { notIn: ["Completed", "Closed"] } }
            }
          }
        }
      }
    });

    const qcWorkOrdersCount = await prisma.workOrder.count({
      where: { status: "Pending QC" }
    });
    
    console.log(mainProcesses, qcWorkOrdersCount);
}
main().finally(() => process.exit(0));
