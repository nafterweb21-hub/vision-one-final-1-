import { prisma } from './src/lib/prisma.ts';
async function run() {
  const wo = await prisma.workOrder.findUnique({
    where: { workOrderNo: 'WO-SO-2026-0015-001' },
    include: {
      inProcesses: {
        include: {
          routingProcesses: {
            include: {
              mainProcess: true,
              routingProcess: true
            }
          }
        }
      }
    }
  });
  console.log(JSON.stringify(wo?.inProcesses, null, 2));
}
run();
