import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const woNo = 'WO-SO-2026-0005-001';
  const wo = await prisma.workOrder.findUnique({
    where: { workOrderNo: woNo },
    include: {
      customer: true,
      inProcesses: {
        include: {
          routingProcesses: {
            orderBy: { sn: 'asc' },
            include: {
              routingProcess: true,
              productionTimesheets: true,
              qualityControls: true,
            }
          }
        }
      }
    }
  });

  console.log(JSON.stringify(wo, null, 2));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
