import { PrismaClient } from './generated/prisma';

const prisma = new PrismaClient();

async function main() {
  const wos = await prisma.workOrder.findMany({
    select: {
      workOrderNo: true,
      status: true,
      qcAcceptance: true,
      inProcesses: {
        select: {
          id: true,
          description: true
        }
      }
    }
  });
  console.log(JSON.stringify(wos, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
