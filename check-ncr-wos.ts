import { prisma } from './src/lib/prisma';

async function main() {
  const wos = await prisma.workOrder.findMany({
    where: { 
      OR: [
        { status: "Proceed" },
        { status: "WIP" },
        { status: "Pending for QC" },
        { qcAcceptance: "Rejected" }
      ] 
    },
    include: {
      inProcesses: true
    }
  });
  console.log("Found WOs matching NCR criteria:", wos.length);
  wos.forEach((wo: any) => {
    console.log(`- WO: ${wo.workOrderNo}, customerId: ${wo.customerId}, inProcesses: ${wo.inProcesses.length}`);
  });
}
main().finally(() => prisma.$disconnect());
